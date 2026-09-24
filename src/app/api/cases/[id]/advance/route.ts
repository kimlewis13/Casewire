import { NextRequest, NextResponse } from "next/server";
import { getCase, updateCase } from "@/lib/db";
import type { CaseStage } from "@/lib/types";

// Draft → Sent happens exclusively through /mail/send, since sending is
// what actually moves the case into that stage (and sets mail state).
const NEXT_STAGE: Record<CaseStage, CaseStage | null> = {
  intake: "extraction",
  extraction: "draft",
  draft: null,
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
    const message =
      existing.stage === "draft"
        ? "Send the letter via certified mail to move this case forward."
        : "Case is already in its final stage.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (existing.stage === "intake" && !existing.intake.completed) {
    return NextResponse.json(
      { error: "Finish the intake conversation before continuing." },
      { status: 400 }
    );
  }
  if (existing.stage === "extraction" && !existing.extraction.completed) {
    return NextResponse.json(
      { error: "Add the medical records before continuing." },
      { status: 400 }
    );
  }

  const updated = updateCase(id, (c) => ({
    ...c,
    stage: next,
    stageEnteredAt: new Date().toISOString(),
  }));

  return NextResponse.json({ case: updated });
}
