import { NextResponse } from "next/server";
import { resetDb } from "@/lib/db";

export async function POST() {
  const db = resetDb();
  return NextResponse.json({ cases: db.cases.length });
}
