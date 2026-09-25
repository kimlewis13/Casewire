import { NextResponse } from "next/server";
import { CHATBOT_DEMO_CASE_ID, emptyIntake, updateCase } from "@/lib/db";

export async function POST() {
  const now = new Date().toISOString();
  const updated = updateCase(CHATBOT_DEMO_CASE_ID, (c) => ({
    ...c,
    stage: "intake",
    stageEnteredAt: now,
    intake: emptyIntake(),
  }));
  return NextResponse.json({ case: updated });
}
