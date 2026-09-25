import { NextRequest, NextResponse } from "next/server";
import { getCase, updateCase } from "@/lib/db";
import { INTAKE_FIELDS } from "@/lib/intakeScript";
import { computeStatuteOfLimitationsDeadline } from "@/lib/statuteOfLimitations";

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

  const askedFields = INTAKE_FIELDS.filter((f) => !f.skipForDirectEntry);
  const missing = askedFields.filter((f) => !String(values[f.key] ?? "").trim());
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Fill in ${missing.map((f) => f.label).join(", ")} before saving.` },
      { status: 400 }
    );
  }

  const cleanValues: Record<string, string> = {};
  for (const field of askedFields) {
    cleanValues[field.key] = String(values[field.key]).trim();
  }
  // Name and contact info were already captured when this case was created —
  // carry them into intake.values too so Case facts shows them consistently
  // across direct-entry and chatbot-sourced cases.
  cleanValues.clientName = existing.clientName;
  cleanValues.contactDetails = [existing.contactEmail, existing.contactPhone]
    .filter(Boolean)
    .join(" · ");

  const updated = updateCase(id, (c) => ({
    ...c,
    intake: {
      ...c.intake,
      values: cleanValues,
      completed: true,
      statuteOfLimitationsDeadline: computeStatuteOfLimitationsDeadline(
        cleanValues.incidentDate ?? ""
      ),
    },
  }));

  return NextResponse.json({ case: updated });
}
