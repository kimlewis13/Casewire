import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { evaluateAllCases } from "@/lib/followup";

export async function POST() {
  const db = readDb();
  const results = await evaluateAllCases(db.cases.map((c) => c.id));
  return NextResponse.json({ results });
}
