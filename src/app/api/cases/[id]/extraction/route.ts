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

  const chronology = parseStructuredDocument(text);
  if (chronology.length === 0) {
    return NextResponse.json(
      {
        error:
          "Couldn't find any Date: / Notes: entries in that document. Use the sample format, or check the section separators (---).",
      },
      { status: 422 }
    );
  }
  const flags = detectFlags(chronology);

  const updated = updateCase(id, (c) => ({
    ...c,
    extraction: {
      sourceDocumentName: name,
      sourceText: text!,
      chronology,
      flags,
      completed: true,
      ranAt: new Date().toISOString(),
    },
    draft: { letter: null, reviewItems: [], generatedAt: null, completed: false },
  }));

  return NextResponse.json({ case: updated });
}
