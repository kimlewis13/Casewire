import { NextResponse } from "next/server";
import { readDb, CHATBOT_DEMO_CASE_ID } from "@/lib/db";
import { evaluateAllCases } from "@/lib/followup";

export async function POST() {
  const db = readDb();
  const ids = db.cases.map((c) => c.id).filter((id) => id !== CHATBOT_DEMO_CASE_ID);
  const results = await evaluateAllCases(ids);
  return NextResponse.json({ results });
}
