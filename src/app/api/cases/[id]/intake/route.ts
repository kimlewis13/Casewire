import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCase, updateCase } from "@/lib/db";
import { INTAKE_FIELDS, interpolateQuestion } from "@/lib/intakeScript";
import { computeStatuteOfLimitationsDeadline } from "@/lib/statuteOfLimitations";
import { parseContactDetails } from "@/lib/contactParsing";
import { runIntakeTurn, type LlmIntakeTurnResult } from "@/lib/llmIntake";
import type { IntakeTurn } from "@/lib/types";

const OPENING_MESSAGE =
  "Thank you for contacting Lewis & Louis Injury Law. Can I start with your name?";

const CLOSING_MESSAGE =
  "Thank you for walking me through all of that — I know none of this is easy to talk about. Everything you've told me is already with our team, and a real person will follow up with you directly within 24 hours. You don't need to do anything else right now.";

// If the AI conversation engine is unavailable (no API key configured, the
// API is down, rate limited, etc.), fall back to a plain sequential
// question flow instead of leaving the client stuck — assume their message
// answers whichever field would have been asked next, store it verbatim,
// and ask the next one. Less conversational, but the intake always
// completes and always produces a usable case record.
function fallbackTurn(message: string, captured: Record<string, string>): LlmIntakeTurnResult {
  const missingBefore = INTAKE_FIELDS.filter((f) => !captured[f.key]?.trim());
  const targetField = missingBefore[0];
  const extracted: Record<string, string> = targetField ? { [targetField.key]: message } : {};
  const newValues = { ...captured, ...extracted };
  const stillMissing = INTAKE_FIELDS.filter((f) => !newValues[f.key]?.trim());
  const complete = stillMissing.length === 0;
  const reply = complete ? "" : interpolateQuestion(stillMissing[0].seedQuestion, newValues);
  return { reply, extracted, complete };
}

function systemTurn(text: string): IntakeTurn {
  return {
    id: randomUUID(),
    role: "system",
    field: null,
    text,
    isFollowUp: false,
    createdAt: new Date().toISOString(),
  };
}

function clientTurn(text: string): IntakeTurn {
  return {
    id: randomUUID(),
    role: "client",
    field: null,
    text,
    isFollowUp: false,
    createdAt: new Date().toISOString(),
  };
}

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/cases/[id]/intake">
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const message = String(body.message ?? "").trim();

  const existing = getCase(id);
  if (!existing) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  if (message === "__start__") {
    if (existing.intake.transcript.length === 0) {
      const updated = updateCase(id, (c) => ({
        ...c,
        intake: { ...c.intake, transcript: [systemTurn(OPENING_MESSAGE)] },
      }));
      return NextResponse.json({ case: updated });
    }
    return NextResponse.json({ case: existing });
  }

  if (existing.intake.completed || !message) {
    return NextResponse.json({ case: existing });
  }

  // Stateless API — resend the whole conversation each turn, plus the new
  // message, so the model can extract facts from it and decide what to say
  // next based on everything already known.
  //
  // The transcript always starts with the static opening line (role
  // "system", mapped to "assistant" below) — but the Messages API requires
  // `messages` to start with a "user" turn, so that leading greeting has to
  // be dropped rather than sent as history. It's boilerplate the model
  // doesn't need repeated back to it anyway.
  const firstClientIdx = existing.intake.transcript.findIndex((t) => t.role === "client");
  const relevantTranscript =
    firstClientIdx === -1 ? [] : existing.intake.transcript.slice(firstClientIdx);
  const history: { role: "user" | "assistant"; content: string }[] = [
    ...relevantTranscript.map((t) => ({
      role: t.role === "client" ? ("user" as const) : ("assistant" as const),
      content: t.text,
    })),
    { role: "user" as const, content: message },
  ];

  let result: LlmIntakeTurnResult;
  try {
    result = await runIntakeTurn(history, existing.intake.values);
  } catch (err) {
    console.error("LLM intake turn failed — falling back to sequential questions:", err);
    result = fallbackTurn(message, existing.intake.values);
  }

  const newValues = { ...existing.intake.values, ...result.extracted };
  // Whether every required field is actually filled is the sole source of
  // truth for completion — the model's own complete_intake call is a signal
  // for phrasing, not a gate. Trusting result.complete on its own let the
  // model end the conversation (e.g. contact details never asked) as soon
  // as it merely believed it was done.
  const completed = INTAKE_FIELDS.every((f) => newValues[f.key]?.trim());
  const nextMissing = INTAKE_FIELDS.find((f) => !newValues[f.key]?.trim());

  // If the model thought it was done but a required field is still empty,
  // don't trust whatever closing-style text it generated for this turn —
  // it may read like a goodbye instead of a question. Ask deterministically.
  const replyText =
    !completed && result.complete && nextMissing
      ? interpolateQuestion(nextMissing.seedQuestion, newValues)
      : result.reply || "Got it, thank you.";

  const newTurns: IntakeTurn[] = [
    clientTurn(message),
    // Always show the same tested closing line on completion rather than
    // whatever the model generated for its final turn, so that critical
    // message never varies.
    systemTurn(completed ? CLOSING_MESSAGE : replyText),
  ];

  const statuteOfLimitationsDeadline = completed
    ? computeStatuteOfLimitationsDeadline(newValues.incidentDate ?? "")
    : existing.intake.statuteOfLimitationsDeadline;

  // The name and contact details are collected conversationally, in intake
  // values, but also need to land on the case record's own top-level
  // fields (clientName/contactEmail/contactPhone) — that's what the rest of
  // the app (dashboard, case header, follow-up alerts) actually reads.
  const recordPatch: { clientName?: string; contactEmail?: string; contactPhone?: string } = {};
  if (newValues.clientName) recordPatch.clientName = newValues.clientName.trim();
  if (newValues.contactDetails) {
    const parsed = parseContactDetails(newValues.contactDetails);
    if (parsed.email) recordPatch.contactEmail = parsed.email;
    if (parsed.phone) recordPatch.contactPhone = parsed.phone;
  }

  const updated = updateCase(id, (c) => ({
    ...c,
    ...recordPatch,
    intake: {
      transcript: [...c.intake.transcript, ...newTurns],
      values: newValues,
      completed,
      statuteOfLimitationsDeadline,
    },
  }));

  return NextResponse.json({ case: updated });
}
