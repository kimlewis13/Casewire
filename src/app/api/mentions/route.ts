import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export async function GET() {
  const db = readDb();
  const mentions = [...db.mentions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return NextResponse.json({
    mentions,
    unreadCount: mentions.filter((m) => !m.read).length,
  });
}
