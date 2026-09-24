import { randomUUID } from "crypto";
import { Resend } from "resend";
import type { CaseRecord, FollowUpLog } from "./types";
import { getCase, updateCase } from "./db";

export function hoursInStage(c: CaseRecord): number {
  return (Date.now() - new Date(c.stageEnteredAt).getTime()) / (1000 * 60 * 60);
}

export function isOverdue(c: CaseRecord): boolean {
  if (c.stage === "tracking" && c.mail.status === "delivered") return false;
  return hoursInStage(c) > c.followUpWindowHours;
}

export function alreadyAlertedThisStage(c: CaseRecord): boolean {
  const enteredAt = new Date(c.stageEnteredAt).getTime();
  return c.followUpLog.some(
    (l) => l.stage === c.stage && new Date(l.triggeredAt).getTime() >= enteredAt
  );
}

type SendResult = { status: "sent" | "skipped" | "failed"; detail: string };

async function sendFollowUpEmail(c: CaseRecord): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.ALERT_EMAIL_TO;

  if (!apiKey || !from || !to) {
    return {
      status: "skipped",
      detail:
        "Resend not configured — set RESEND_API_KEY, RESEND_FROM_EMAIL, and ALERT_EMAIL_TO to send real alerts.",
    };
  }

  try {
    const resend = new Resend(apiKey);
    const hours = Math.round(hoursInStage(c));
    const { error } = await resend.emails.send({
      from,
      to,
      subject: `Casewire: ${c.clientName} has stalled in ${c.stage}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px">
          <h2 style="color:#FF5A36;margin-bottom:4px">Casewire follow-up alert</h2>
          <p><strong>${c.clientName}</strong>'s case has been sitting in
          <strong>${c.stage}</strong> for about ${hours} hours — past its
          ${c.followUpWindowHours}-hour follow-up window.</p>
          <p>Owner: ${c.owner}</p>
          <p style="color:#666;font-size:13px">Sent automatically by Casewire (prototype).</p>
        </div>`,
      text: `Casewire follow-up alert: ${c.clientName}'s case has been sitting in ${c.stage} for about ${hours} hours, past its ${c.followUpWindowHours}-hour follow-up window. Owner: ${c.owner}.`,
    });
    if (error) {
      return { status: "failed", detail: error.message ?? JSON.stringify(error) };
    }
    return { status: "sent", detail: `Email sent to ${to}` };
  } catch (err) {
    return {
      status: "failed",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

async function sendFollowUpSms(c: CaseRecord): Promise<SendResult> {
  const apiKey = process.env.TEXTBEE_API_KEY;
  const deviceId = process.env.TEXTBEE_DEVICE_ID;
  const to = process.env.ALERT_PHONE_TO;

  if (!apiKey || !deviceId || !to) {
    return {
      status: "skipped",
      detail:
        "textbee not configured — set TEXTBEE_API_KEY, TEXTBEE_DEVICE_ID, and ALERT_PHONE_TO to send a real text.",
    };
  }

  try {
    const hours = Math.round(hoursInStage(c));
    const res = await fetch(
      `https://api.textbee.dev/api/v1/gateway/devices/${deviceId}/send-sms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          recipients: [to],
          message: `Casewire: ${c.clientName} has been stuck in ${c.stage} for ~${hours}h (owner: ${c.owner}). Check the tracker.`,
        }),
      }
    );
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        status: "failed",
        detail: `textbee responded ${res.status}: ${JSON.stringify(body)}`,
      };
    }
    return { status: "sent", detail: `Text sent to ${to}` };
  } catch (err) {
    return {
      status: "failed",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

export interface FollowUpCheckResult {
  caseId: string;
  clientName: string;
  overdue: boolean;
  alreadyAlerted: boolean;
  log?: FollowUpLog;
}

export async function evaluateAndTrigger(
  caseId: string
): Promise<FollowUpCheckResult> {
  const c = getCase(caseId);
  if (!c) throw new Error(`Case ${caseId} not found`);

  const overdue = isOverdue(c);
  const alreadyAlerted = alreadyAlertedThisStage(c);

  if (!overdue || alreadyAlerted) {
    return { caseId, clientName: c.clientName, overdue, alreadyAlerted };
  }

  const [emailResult, smsResult] = await Promise.all([
    sendFollowUpEmail(c),
    sendFollowUpSms(c),
  ]);

  const log: FollowUpLog = {
    id: randomUUID(),
    triggeredAt: new Date().toISOString(),
    stage: c.stage,
    emailStatus: emailResult.status,
    emailDetail: emailResult.detail,
    smsStatus: smsResult.status,
    smsDetail: smsResult.detail,
  };

  updateCase(caseId, (rec) => ({
    ...rec,
    followUpLog: [log, ...rec.followUpLog],
  }));

  return { caseId, clientName: c.clientName, overdue, alreadyAlerted: false, log };
}

export async function evaluateAllCases(
  caseIds: string[]
): Promise<FollowUpCheckResult[]> {
  const results: FollowUpCheckResult[] = [];
  for (const id of caseIds) {
    results.push(await evaluateAndTrigger(id));
  }
  return results;
}
