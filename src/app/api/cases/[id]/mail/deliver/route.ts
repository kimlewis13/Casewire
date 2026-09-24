import { NextRequest, NextResponse } from "next/server";
import { getCase, updateCase } from "@/lib/db";

const MAX_IMAGE_LENGTH = 12_000_000; // ~9MB binary, base64-encoded

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/cases/[id]/mail/deliver">
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const existing = getCase(id);
  if (!existing) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }
  if (existing.mail.status !== "sent") {
    return NextResponse.json(
      { error: "Mark this letter as sent before recording delivery." },
      { status: 400 }
    );
  }

  const signedBy =
    typeof body.signedBy === "string" && body.signedBy.trim() ? body.signedBy.trim() : null;
  const deliveredAt =
    typeof body.deliveredAt === "string" && body.deliveredAt
      ? new Date(body.deliveredAt).toISOString()
      : new Date().toISOString();

  let proofImageDataUrl: string | null = null;
  if (typeof body.proofImageDataUrl === "string" && body.proofImageDataUrl.startsWith("data:image/")) {
    if (body.proofImageDataUrl.length > MAX_IMAGE_LENGTH) {
      return NextResponse.json({ error: "That image is too large." }, { status: 413 });
    }
    proofImageDataUrl = body.proofImageDataUrl;
  }

  const updated = updateCase(id, (c) => ({
    ...c,
    mail: { ...c.mail, status: "delivered", deliveredAt, signedBy, proofImageDataUrl },
  }));

  return NextResponse.json({ case: updated });
}
