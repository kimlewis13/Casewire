import { NextRequest, NextResponse } from "next/server";
import { getCase, updateCase } from "@/lib/db";

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/cases/[id]/extraction/flags/[flagId]">
) {
  const { id, flagId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const resolved = Boolean(body.resolved);

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

  const updated = updateCase(id, (c) => ({
    ...c,
    extraction: {
      ...c.extraction,
      flags: c.extraction.flags.map((f) => (f.id === flagId ? { ...f, resolved } : f)),
    },
  }));

  return NextResponse.json({ case: updated });
}
