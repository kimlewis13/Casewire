import { NextRequest, NextResponse } from "next/server";
import { getCase, updateCase } from "@/lib/db";
import { INTAKE_FIELDS } from "@/lib/intakeScript";

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/cases/[id]/intake/direct">
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const values = body.values && typeof body.values === "object" ? body.values : {};

  const existing = getCase(id);
  if (!existing) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }
  if (existing.source !== "direct") {
    return NextResponse.json({ error: "This case was not started as a direct entry." }, { status: 400 });
  }

  const missing = INTAKE_FIELDS.filter((f) => !String(values[f.key] ?? "").trim());
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Fill in ${missing.map((f) => f.label).join(", ")} before saving.` },
      { status: 400 }
    );
  }

  const cleanValues: Record<string, string> = {};
  for (const field of INTAKE_FIELDS) {
    cleanValues[field.key] = String(values[field.key]).trim();
  }

  const updated = updateCase(id, (c) => ({
    ...c,
    intake: {
      ...c.intake,
      values: cleanValues,
      completed: true,
    },
  }));

  return NextResponse.json({ case: updated });
}
