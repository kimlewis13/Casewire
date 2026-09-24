import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

export async function POST() {
  const db = readDb();
  db.mentions = db.mentions.map((m) => ({ ...m, read: true }));
  writeDb(db);
  return NextResponse.json({ ok: true });
}
