import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export async function GET() {
  const db = readDb();
  const alerts = [...db.caseAlerts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return NextResponse.json({
    alerts,
    unreadCount: alerts.filter((a) => !a.read).length,
  });
}
