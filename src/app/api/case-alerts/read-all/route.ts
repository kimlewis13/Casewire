import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

export async function POST() {
  const db = readDb();
  db.caseAlerts = db.caseAlerts.map((a) => ({ ...a, read: true }));
  writeDb(db);
  return NextResponse.json({ ok: true });
}
