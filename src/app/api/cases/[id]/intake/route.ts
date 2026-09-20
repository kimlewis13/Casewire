import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCase, updateCase } from "@/lib/db";
import { INTAKE_FIELDS } from "@/lib/intakeScript";
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
        "That gives me what I need to build out the case record. You can continue to document extraction whenever you're ready.",
        false
      )
    );
  } else if (nextFieldIndex !== cursor.fieldIndex) {
    const next = INTAKE_FIELDS[nextFieldIndex];
    newTurns.push(systemTurn(next.key, next.question, false));
  }

  const updated = updateCase(id, (c) => ({
    ...c,
    intake: {
      cursor: { fieldIndex: nextFieldIndex, awaitingFollowUp: nextAwaitingFollowUp },
      transcript: [...c.intake.transcript, ...newTurns],
      values: newValues,
      completed,
    },
  }));

  return NextResponse.json({ case: updated });
}
