import { NextRequest, NextResponse } from "next/server";
import { getCase, updateCase } from "@/lib/db";
import { generateDemandLetter } from "@/lib/demand";

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/cases/[id]/draft">
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const finalize = Boolean(body.finalize);

  const existing = getCase(id);
  if (!existing) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }
  if (!existing.extraction.completed) {
    return NextResponse.json(
      { error: "Add the medical records before drafting." },
      { status: 400 }
    );
  }

  const { letter, reviewItems } = generateDemandLetter(existing);

  const updated = updateCase(id, (c) => ({
    ...c,
    draft: {
      letter,
      reviewItems,
      generatedAt: new Date().toISOString(),
      completed: finalize ? true : c.draft.completed,
    },
  }));

  return NextResponse.json({ case: updated });
}
