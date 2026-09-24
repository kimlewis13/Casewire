import { NextRequest, NextResponse } from "next/server";
import { getCase, updateCase } from "@/lib/db";

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/cases/[id]/mail/send">
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const trackingNumber =
    typeof body.trackingNumber === "string" && body.trackingNumber.trim()
      ? body.trackingNumber.trim()
      : null;

  const existing = getCase(id);
  if (!existing) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }
  if (!existing.draft.letter) {
    return NextResponse.json(
      { error: "Generate the demand letter before sending it." },
      { status: 400 }
    );
  }
  if (existing.mail.status !== "not_sent") {
    return NextResponse.json({ error: "This letter has already been sent." }, { status: 400 });
  }
  const unresolved = existing.extraction.flags.filter((f) => !f.resolved);
  if (unresolved.length > 0) {
    return NextResponse.json(
      {
        error: `${unresolved.length} review item${unresolved.length === 1 ? "" : "s"} still need${unresolved.length === 1 ? "s" : ""} to be cleared before this can go out.`,
      },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  const updated = updateCase(id, (c) => ({
    ...c,
    stage: "tracking",
    stageEnteredAt: now,
    draft: { ...c.draft, completed: true },
    mail: { ...c.mail, status: "sent", sentAt: now, trackingNumber },
  }));

  return NextResponse.json({ case: updated });
}
