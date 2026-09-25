import { randomUUID } from "crypto";
import type {
  ChronologyEntry,
  ChronologyEventType,
  ExtractionFlag,
} from "./types";

const TYPE_MAP: Record<string, ChronologyEventType> = {
  visit: "visit",
  diagnosis: "diagnosis",
  treatment: "treatment",
  imaging: "imaging",
  referral: "referral",
};

const GAP_THRESHOLD_DAYS = 30;

const PRE_EXISTING_PHRASES = [
  "history of prior",
  "history of",
  "prior surgery",
  "pre-existing",
  "preexisting",
  "previously diagnosed",
  "prior diagnosis",
  "prior injury",
];

const REFERRAL_ENTITIES = [
  "MRI",
  "CT scan",
  "CT",
  "X-ray",
  "imaging",
  "neurology",
  "specialist",
  "surgery",
  "EMG",
];

const REFERRAL_ACTION_WORDS = [
  "recommended",
  "ordered",
  "to schedule",
  "referred to",
  "scheduled for",
];

function parseDate(value: string): Date | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function firstSentence(text: string): string {
  const match = text.match(/^[^.]+\./);
  return (match ? match[0] : text).trim();
}

/** Whether an intake answer actually discloses something, as opposed to a bare denial. */
function isPositiveDisclosure(text?: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  return !/^(no|none|nope|nothing|not that i|not really)\b/i.test(trimmed);
}

export function parseStructuredDocument(source: string): ChronologyEntry[] {
  const blocks = source
    .split(/^-{3,}\s*$/m)
    .map((b) => b.trim())
    .filter(Boolean);

  const entries: ChronologyEntry[] = [];

  for (const block of blocks) {
    const dateMatch = block.match(/^Date:\s*(.+)$/m);
    const providerMatch = block.match(/^Provider:\s*(.+)$/m);
    const typeMatch = block.match(/^Type:\s*(.+)$/m);
    const notesMatch = block.match(/^Notes:\s*([\s\S]*)$/m);

    if (!dateMatch || !notesMatch) continue;

    const rawType = (typeMatch?.[1] ?? "visit").trim().toLowerCase();
    entries.push({
      id: randomUUID(),
      date: dateMatch[1].trim(),
      provider: providerMatch?.[1]?.trim() ?? "Unknown provider",
      type: TYPE_MAP[rawType] ?? "visit",
      summary: firstSentence(notesMatch[1].trim()),
      raw: notesMatch[1].trim(),
    });
  }

  return entries.sort((a, b) => {
    const da = parseDate(a.date)?.getTime() ?? 0;
    const db = parseDate(b.date)?.getTime() ?? 0;
    return da - db;
  });
}

export function detectFlags(
  entries: ChronologyEntry[],
  disclosedPriorCondition?: string
): ExtractionFlag[] {
  const flags: ExtractionFlag[] = [];
  if (entries.length === 0) return flags;

  // 1. Treatment gaps between consecutive dated entries.
  for (let i = 1; i < entries.length; i++) {
    const prev = entries[i - 1];
    const curr = entries[i];
    const prevDate = parseDate(prev.date);
    const currDate = parseDate(curr.date);
    if (!prevDate || !currDate) continue;
    const diffDays = Math.round(
      (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays > GAP_THRESHOLD_DAYS) {
      flags.push({
        id: randomUUID(),
        type: "gap",
        severity: diffDays > 60 ? "high" : "medium",
        message: `${diffDays}-day gap in treatment between ${prev.date} (${prev.provider}) and ${curr.date} (${curr.provider}) — confirm whether care actually lapsed or records are missing.`,
        relatedEntryIds: [prev.id, curr.id],
        resolved: false,
      });
    }
  }

  // 2. Facts mentioned exactly once and never revisited (e.g. pre-existing conditions).
  const clientDisclosed = isPositiveDisclosure(disclosedPriorCondition);
  for (const phrase of PRE_EXISTING_PHRASES) {
    const hits = entries.filter((e) =>
      e.raw.toLowerCase().includes(phrase)
    );
    if (hits.length === 1) {
      const entry = hits[0];
      const sentence = entry.raw
        .split(/(?<=\.)\s+/)
        .find((s) => s.toLowerCase().includes(phrase));
      const quoted = (sentence ?? phrase).trim();

      flags.push(
        clientDisclosed
          ? {
              id: randomUUID(),
              type: "inconsistency",
              severity: "low",
              message: `${entry.date} (${entry.provider}) notes "${quoted}" — this matches what the client disclosed at intake ("${disclosedPriorCondition!.trim()}"), so it likely just needs to be reflected accurately in the letter rather than treated as a new issue.`,
              relatedEntryIds: [entry.id],
              resolved: false,
            }
          : {
              id: randomUUID(),
              type: "inconsistency",
              severity: "high",
              message: `${entry.date} (${entry.provider}) notes "${quoted}" but it is never addressed again in the record, and the client did not disclose any prior condition at intake — confirm relevance to causation and reconcile before drafting.`,
              relatedEntryIds: [entry.id],
              resolved: false,
            }
      );
      break; // one flag per document is enough signal; avoid duplicate noise
    }
  }

  // 3. Referrals/orders that never show a resolution in a later entry.
  for (const entry of entries) {
    const lowerRaw = entry.raw.toLowerCase();
    const hasActionWord = REFERRAL_ACTION_WORDS.some((w) =>
      lowerRaw.includes(w)
    );
    if (!hasActionWord) continue;

    const entity = REFERRAL_ENTITIES.find((e) =>
      lowerRaw.includes(e.toLowerCase())
    );
    if (!entity) continue;

    const laterEntries = entries.slice(entries.indexOf(entry) + 1);
    const referralResolved = laterEntries.some((later) =>
      later.raw.toLowerCase().includes(entity.toLowerCase())
    );

    if (!referralResolved) {
      flags.push({
        id: randomUUID(),
        type: "missing",
        severity: "medium",
        message: `${entity} was ${
          lowerRaw.includes("recommended") ? "recommended" : "ordered"
        } on ${entry.date} (${entry.provider}) but no results or follow-up appear anywhere later in the record — confirm whether it was completed.`,
        relatedEntryIds: [entry.id],
        resolved: false,
      });
    }
  }

  return flags;
}
