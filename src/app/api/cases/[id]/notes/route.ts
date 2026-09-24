import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCase, updateCase, addMentions } from "@/lib/db";
import { findMentions } from "@/lib/people";
import type { CaseNote, Mention } from "@/lib/types";

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/cases/[id]/notes">
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const text = String(body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Note can't be empty." }, { status: 400 });
  }

  const existing = getCase(id);
  if (!existing) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const note: CaseNote = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    author: existing.owner,
    text,
    kind: "note",
  };

  const updated = updateCase(id, (c) => ({
    ...c,
    notes: [note, ...c.notes],
  }));

  const targets = findMentions(text);
  const mentions: Mention[] = targets.map((targetPerson) => ({
    id: randomUUID(),
    createdAt: note.createdAt,
    caseId: id,
    clientName: existing.clientName,
    mentionedBy: existing.owner,
    targetPerson,
    noteText: text,
    read: false,
  }));
  if (mentions.length > 0) addMentions(mentions);

  return NextResponse.json({ case: updated, mentions });
}
