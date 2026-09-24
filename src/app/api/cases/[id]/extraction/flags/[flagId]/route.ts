import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCase, updateCase, addMentions } from "@/lib/db";
import { findMentions } from "@/lib/people";
import type { CaseNote, Mention } from "@/lib/types";

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/cases/[id]/extraction/flags/[flagId]">
) {
  const { id, flagId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const resolved = Boolean(body.resolved);
  const note = typeof body.note === "string" ? body.note.trim() : "";

  const existing = getCase(id);
  if (!existing) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }
  if (existing.mail.status !== "not_sent") {
    return NextResponse.json(
      { error: "This letter has already gone out — the checklist is locked." },
      { status: 400 }
    );
  }
  const flag = existing.extraction.flags.find((f) => f.id === flagId);
  if (!flag) {
    return NextResponse.json({ error: "Review item not found" }, { status: 404 });
  }
  if (resolved && !note) {
    return NextResponse.json(
      { error: "Add a note explaining what you confirmed before checking this off." },
      { status: 400 }
    );
  }

  const timelineEntry: CaseNote | null = resolved
    ? {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        author: existing.owner,
        text: note,
        kind: "action",
        actionLabel: flag.message,
      }
    : null;

  const updated = updateCase(id, (c) => ({
    ...c,
    extraction: {
      ...c.extraction,
      flags: c.extraction.flags.map((f) => (f.id === flagId ? { ...f, resolved } : f)),
    },
    notes: timelineEntry ? [timelineEntry, ...c.notes] : c.notes,
  }));

  const mentions: Mention[] = timelineEntry
    ? findMentions(note).map((targetPerson) => ({
        id: randomUUID(),
        createdAt: timelineEntry.createdAt,
        caseId: id,
        clientName: existing.clientName,
        mentionedBy: existing.owner,
        targetPerson,
        noteText: note,
        read: false,
      }))
    : [];
  if (mentions.length > 0) addMentions(mentions);

  return NextResponse.json({ case: updated, mentions });
}
