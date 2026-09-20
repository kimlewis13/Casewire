import { NextRequest, NextResponse } from "next/server";
import { createCase } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const clientName = String(body.clientName ?? "").trim();
  if (!clientName) {
    return NextResponse.json({ error: "clientName is required" }, { status: 400 });
  }

  const record = createCase({
    clientName,
    contactEmail: String(body.contactEmail ?? "").trim(),
    contactPhone: String(body.contactPhone ?? "").trim(),
    owner: String(body.owner ?? "You (paralegal)").trim() || "You (paralegal)",
    followUpWindowHours: Number(body.followUpWindowHours) || 48,
  });

  return NextResponse.json({ case: record });
}
