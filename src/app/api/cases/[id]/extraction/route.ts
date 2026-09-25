import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCase, updateCase } from "@/lib/db";
import { parseStructuredDocument, detectFlags } from "@/lib/extraction";
import { findSampleDocument } from "@/lib/sampleDocuments";

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/cases/[id]/extraction">
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const existing = getCase(id);
  if (!existing) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }
  if (existing.mail.status !== "not_sent") {
    return NextResponse.json(
      { error: "This case's letter has already gone out — records are locked." },
      { status: 400 }
    );
  }

  let text: string | undefined;
  let name: string | null = null;

  if (typeof body.documentId === "string") {
    const sample = findSampleDocument(body.documentId);
    if (!sample) {
      return NextResponse.json({ error: "Unknown sample document" }, { status: 400 });
    }
    text = sample.text;
    name = sample.name;
  } else if (typeof body.text === "string" && body.text.trim()) {
    text = body.text;
    name = "Pasted document";
  }

  if (!text) {
    return NextResponse.json({ error: "No document provided" }, { status: 400 });
  }

  const newEntries = parseStructuredDocument(text);
  if (newEntries.length === 0) {
    return NextResponse.json(
      {
        error:
          "Couldn't find any Date: / Notes: entries in that document. Use the sample format, or check the section separators (---).",
      },
      { status: 422 }
    );
  }

  const mergedChronology = [...existing.extraction.chronology, ...newEntries].sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    return (Number.isNaN(da) ? 0 : da) - (Number.isNaN(db) ? 0 : db);
  });
  const flags = detectFlags(mergedChronology, existing.intake.values.priorConditionSameArea);

  const updated = updateCase(id, (c) => ({
    ...c,
    extraction: {
      sources: [
        ...c.extraction.sources,
        { id: randomUUID(), name: name!, addedAt: new Date().toISOString() },
      ],
      chronology: mergedChronology,
      flags,
      completed: true,
      ranAt: new Date().toISOString(),
    },
    draft: { letter: null, reviewItems: [], generatedAt: null, completed: false },
  }));

  return NextResponse.json({ case: updated });
}
