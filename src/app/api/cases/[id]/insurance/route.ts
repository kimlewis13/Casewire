import { NextRequest, NextResponse } from "next/server";
import { getCase, updateCase } from "@/lib/db";

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/cases/[id]/insurance">
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const existing = getCase(id);
  if (!existing) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const updated = updateCase(id, (c) => ({
    ...c,
    insurance: {
      atFaultCarrier: String(body.atFaultCarrier ?? "").trim(),
      claimNumber: String(body.claimNumber ?? "").trim(),
      adjusterName: String(body.adjusterName ?? "").trim(),
      healthInsurer: String(body.healthInsurer ?? "").trim(),
      lienExpected: Boolean(body.lienExpected),
    },
  }));

  return NextResponse.json({ case: updated });
}
