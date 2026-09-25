import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCase, updateCase } from "@/lib/db";
import { INTAKE_FIELDS } from "@/lib/intakeScript";
import { computeStatuteOfLimitationsDeadline } from "@/lib/statuteOfLimitations";
import { parseContactDetails } from "@/lib/contactParsing";
import { runIntakeTurn } from "@/lib/llmIntake";
import type { IntakeTurn } from "@/lib/types";

const OPENING_MESSAGE =
  "Thank you for contacting Lewis & Louis Injury Law. Can I start with your name?";

const CLOSING_MESSAGE =
  "Thank you for walking me through all of that — I know none of this is easy to talk about. Everything you've told me is already with our team, and a real person will follow up with you directly within 24 hours. You don't need to do anything else right now.";

const TROUBLE_MESSAGE =
  "Sorry — I'm having trouble responding right now. Please try sending that again in a moment.";

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
  const history: { role: "user" | "assistant"; content: string }[] = [
    ...existing.intake.transcript.map((t) => ({
      role: t.role === "client" ? ("user" as const) : ("assistant" as const),
      content: t.text,
    })),
    { role: "user" as const, content: message },
  ];

  let result;
  try {
    result = await runIntakeTurn(history, existing.intake.values);
  } catch (err) {
    console.error("LLM intake turn failed:", err);
    const updated = updateCase(id, (c) => ({
      ...c,
      intake: {
        ...c.intake,
        transcript: [...c.intake.transcript, clientTurn(message), systemTurn(TROUBLE_MESSAGE)],
      },
    }));
    return NextResponse.json({ case: updated });
  }

  const newValues = { ...existing.intake.values, ...result.extracted };
  // Trust the model's own completion signal, with a safety net in case it
  // fills every field but forgets to call complete_intake.
  const completed = result.complete || INTAKE_FIELDS.every((f) => newValues[f.key]?.trim());

  const newTurns: IntakeTurn[] = [
    clientTurn(message),
    // Always show the same tested closing line on completion rather than
    // whatever the model generated for its final turn, so that critical
    // message never varies.
    systemTurn(completed ? CLOSING_MESSAGE : result.reply || "Got it, thank you."),
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
