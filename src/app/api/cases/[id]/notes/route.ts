import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCase, updateCase } from "@/lib/db";
import type { CaseNote } from "@/lib/types";

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

  return NextResponse.json({ case: updated });
}
