// Demo simplification: real personal-injury statutes of limitation vary by
// state and claim type. This hardcodes a single common period (2 years) so
// the intake flow can show a computed deadline without asking the client an
// extra question — it is not legal guidance.
const DEMO_SOL_YEARS = 2;

const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

const RELATIVE_AGO = /\b(a|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(day|week|month|year)s?\s+ago\b/i;

/**
 * The intake bot deliberately accepts casual, digit-free answers like "about
 * three weeks ago" (see intakeScript.ts) — a plain `new Date()` parse fails
 * on those, so this resolves the common relative phrasings itself before
 * falling back to the native parser for literal dates.
 */
function parseIncidentDate(text: string): Date | null {
  const trimmed = text.trim().toLowerCase();

  if (/\btoday\b/.test(trimmed)) return new Date();
  if (/\byesterday\b/.test(trimmed)) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  }
  if (/\blast week\b/.test(trimmed)) {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (/\blast month\b/.test(trimmed)) {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
  }
  if (/\blast year\b/.test(trimmed)) {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d;
  }

  const agoMatch = trimmed.match(RELATIVE_AGO);
  if (agoMatch) {
    const amount = Number.isNaN(Number(agoMatch[1]))
      ? NUMBER_WORDS[agoMatch[1]]
      : Number(agoMatch[1]);
    const unit = agoMatch[2];
    const d = new Date();
    if (unit === "day") d.setDate(d.getDate() - amount);
    else if (unit === "week") d.setDate(d.getDate() - amount * 7);
    else if (unit === "month") d.setMonth(d.getMonth() - amount);
    else if (unit === "year") d.setFullYear(d.getFullYear() - amount);
    return d;
  }

  const native = new Date(text);
  return Number.isNaN(native.getTime()) ? null : native;
}

export function computeStatuteOfLimitationsDeadline(incidentDateText: string): string | null {
  const parsed = parseIncidentDate(incidentDateText);
  if (!parsed) return null;
  const deadline = new Date(parsed);
  deadline.setFullYear(deadline.getFullYear() + DEMO_SOL_YEARS);
  // A deadline that's already elapsed isn't useful as a passive info card —
  // seeded demo dates in particular can drift stale over time — so hide it
  // rather than show what would read as an alarming, already-expired claim.
  if (deadline.getTime() <= Date.now()) return null;
  return deadline.toISOString();
}
