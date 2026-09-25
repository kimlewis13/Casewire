import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getCase, updateCase, addCaseAlert } from "@/lib/db";

/**
 * Called once by the public chatbot widget right after the intake
 * conversation finishes. There's no paralegal present to click "continue,"
 * so this does what that internal action would have done — advances the
 * case out of "intake" — and raises a dashboard alert so the record's
 * arrival is actually noticeable, not just quietly sitting in the list.
 */
export async function POST(
  req: Request,
  ctx: RouteContext<"/api/cases/[id]/complete-public-intake">
) {
  const { id } = await ctx.params;
  const existing = getCase(id);
  if (!existing) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }
  if (existing.stage !== "intake" || !existing.intake.completed) {
    return NextResponse.json({ case: existing });
  }

  const updated = updateCase(id, (c) => ({
    ...c,
    stage: "extraction",
    stageEnteredAt: new Date().toISOString(),
  }));

  addCaseAlert({
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    caseId: id,
    clientName: updated.clientName,
    read: false,
  });

  return NextResponse.json({ case: updated });
}
