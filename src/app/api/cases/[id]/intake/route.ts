import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCase, updateCase } from "@/lib/db";
import { INTAKE_FIELDS, interpolateQuestion } from "@/lib/intakeScript";
import { computeStatuteOfLimitationsDeadline } from "@/lib/statuteOfLimitations";
import { parseContactDetails } from "@/lib/contactParsing";
import type { IntakeTurn } from "@/lib/types";

function systemTurn(field: string | null, text: string, isFollowUp: boolean): IntakeTurn {
  return {
    id: randomUUID(),
    role: "system",
    field,
    text,
    isFollowUp,
    createdAt: new Date().toISOString(),
  };
}

function clientTurn(field: string, text: string, isFollowUp: boolean): IntakeTurn {
  return {
    id: randomUUID(),
    role: "client",
    field,
    text,
    isFollowUp,
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
      const first = INTAKE_FIELDS[0];
      const updated = updateCase(id, (c) => ({
        ...c,
        intake: {
          ...c.intake,
          transcript: [systemTurn(first.key, first.question, false)],
        },
      }));
      return NextResponse.json({ case: updated });
    }
    return NextResponse.json({ case: existing });
  }

  if (existing.intake.completed || !message) {
    return NextResponse.json({ case: existing });
  }

  const { cursor } = existing.intake;
  const field = INTAKE_FIELDS[cursor.fieldIndex];
  if (!field) {
    return NextResponse.json({ case: existing });
  }

  const newTurns: IntakeTurn[] = [
    clientTurn(field.key, message, cursor.awaitingFollowUp),
  ];
  const newValues = { ...existing.intake.values };
  let nextFieldIndex = cursor.fieldIndex;
  let nextAwaitingFollowUp = false;

  if (!cursor.awaitingFollowUp) {
    newValues[field.key] = message;
    if (field.isVague(message)) {
      newTurns.push(systemTurn(field.key, field.followUpQuestion(message), true));
      nextAwaitingFollowUp = true;
    } else {
      nextFieldIndex = cursor.fieldIndex + 1;
    }
  } else {
    const original = newValues[field.key] ?? "";
    newValues[field.key] = field.mergeFollowUp
      ? field.mergeFollowUp(original, message)
      : message;
    nextFieldIndex = cursor.fieldIndex + 1;
  }

  let completed = false;
  if (nextFieldIndex >= INTAKE_FIELDS.length) {
    completed = true;
    newTurns.push(
      systemTurn(
        null,
        "Thank you for walking me through all of that — I know none of this is easy to talk about. Everything you've told me is already with our team, and a real person will follow up with you directly within 24 hours. You don't need to do anything else right now.",
        false
      )
    );
  } else if (nextFieldIndex !== cursor.fieldIndex) {
    const next = INTAKE_FIELDS[nextFieldIndex];
    newTurns.push(systemTurn(next.key, interpolateQuestion(next.question, newValues), false));
  }

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
      cursor: { fieldIndex: nextFieldIndex, awaitingFollowUp: nextAwaitingFollowUp },
      transcript: [...c.intake.transcript, ...newTurns],
      values: newValues,
      completed,
      statuteOfLimitationsDeadline,
    },
  }));

  return NextResponse.json({ case: updated });
}
