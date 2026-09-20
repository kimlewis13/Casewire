import { NextRequest, NextResponse } from "next/server";
import { getCase, updateCase } from "@/lib/db";
import type { CaseStage } from "@/lib/types";

const NEXT_STAGE: Record<CaseStage, CaseStage | null> = {
  intake: "extraction",
  extraction: "draft",
  draft: "tracking",
  tracking: null,
};

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/cases/[id]/advance">
) {
  const { id } = await ctx.params;
  const existing = getCase(id);
  if (!existing) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const next = NEXT_STAGE[existing.stage];
  if (!next) {
    return NextResponse.json({ error: "Case is already in its final stage." }, { status: 400 });
  }

  if (existing.stage === "intake" && !existing.intake.completed) {
    return NextResponse.json(
      { error: "Finish the intake conversation before continuing." },
      { status: 400 }
    );
  }
  if (existing.stage === "extraction" && !existing.extraction.completed) {
    return NextResponse.json(
      { error: "Run document extraction before continuing." },
      { status: 400 }
    );
  }
  if (existing.stage === "draft" && !existing.draft.letter) {
    return NextResponse.json(
      { error: "Generate the demand draft before continuing." },
      { status: 400 }
    );
  }

  const updated = updateCase(id, (c) => ({
    ...c,
    stage: next,
    stageEnteredAt: new Date().toISOString(),
    draft:
      c.stage === "draft" ? { ...c.draft, completed: true } : c.draft,
  }));

  return NextResponse.json({ case: updated });
}
