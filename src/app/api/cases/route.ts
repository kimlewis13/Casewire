import { NextRequest, NextResponse } from "next/server";
import { createCase } from "@/lib/db";
import type { CaseSource } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const clientName = String(body.clientName ?? "").trim();
  if (!clientName) {
    return NextResponse.json({ error: "clientName is required" }, { status: 400 });
  }
  const source: CaseSource = body.source === "direct" ? "direct" : "chatbot";

  const record = createCase({
    clientName,
    contactEmail: String(body.contactEmail ?? "").trim(),
    contactPhone: String(body.contactPhone ?? "").trim(),
    owner: String(body.owner ?? "Paralegal - You").trim() || "Paralegal - You",
    followUpWindowHours: Number(body.followUpWindowHours) || 48,
    source,
  });

  return NextResponse.json({ case: record });
}
