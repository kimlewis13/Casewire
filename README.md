# Casewire

A working prototype of one connected data flow across four stages of a
personal injury case: **intake → document extraction → demand drafting →
status tracking**. Built to demonstrate product thinking and AI-assisted
prototyping under real time pressure — not a production system.

All sample data (names, injuries, dates) is fabricated. There is no auth,
no multi-firm support, and no real OCR/ML extraction — extraction is a
deliberately simple, deterministic parser (see "How extraction actually
works" below).

## The core idea

There's one `CaseRecord` per case, stored server-side. Every screen reads
from and writes to the same record:

- Intake fills in structured fields (incident date, liability, injury
  severity, treatment status, prior representation).
- Document extraction fills in a chronology and a list of flags.
- The demand draft is generated **from** the intake fields and the
  chronology — not typed separately.
- The status tracker reads `stage` + `stageEnteredAt` off every case to
  know how long it's been sitting, and fires real alerts when a case
  crosses its follow-up window.

A sidebar on every case screen ("Shared case record") shows the same
values regardless of which stage you're looking at, so it's visible that
nothing is re-typed at the handoffs.

## Running it

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Four seeded demo cases appear on the
dashboard, one per stage. `case-reyes` ("Jordan Reyes") is the intentionally
unfinished one — walk it through all four screens live.

Data lives in `data/db.json`, created automatically on first run and
gitignored (it's runtime state, not source). Delete it (or `POST
/api/reset`) to get back to the original seed.

## The four screens

### 1. Intake (`/case/[id]/intake`)

A scripted chat that asks five questions (incident date, liability,
injury severity, treatment status, prior representation). Each question
has a heuristic vagueness check — e.g. "it was bad" for an incident date
has no digits, so it gets followed up ("do you have an approximate date?")
instead of being written to the record as-is. The clarified answer
replaces (or, for narrative fields, extends) the original — the vague
version never survives into the case record or the draft.

### 2. Document extraction (`/case/[id]/extraction`)

Two fabricated sample medical records are built in, plus a box to paste
your own in the same format. The parser looks for `Date: / Provider: /
Type: / Notes:` blocks separated by `---` — this is intentionally a plain
parser, not OCR or a trained model (out of scope by design).

It then runs three checks over the parsed chronology:
- **Gaps** — any two consecutive dated entries more than 30 days apart.
- **Inconsistencies** — a phrase like "history of prior surgery" that
  shows up in exactly one entry and is never mentioned again.
- **Unresolved items** — something "recommended" or "ordered" (an MRI, a
  referral) that never appears again in a later entry.

The first sample document ("Reyes — rear-end collision") plants all
three. The second ("Shah — slip and fall") is clean, to show the checks
aren't just always firing.

### 3. Demand draft (`/case/[id]/draft`)

Assembles a first-pass letter from the intake fields and the chronology,
plus a "needs attorney review" list built from the extraction flags (and
a standing reminder that billing/damages figures aren't computed here).
Regenerating pulls from whatever is currently on the case record.

### 4. Status (`/case/[id]/status`, plus the dashboard)

Each case tracks `stage`, `stageEnteredAt`, an owner, and a
`followUpWindowHours`. The dashboard's "Run follow-up check" button (and
the per-case "Run follow-up check for this case" button on the Status
tab) evaluates every case: if a case has been in its current stage longer
than its follow-up window **and** hasn't already been alerted for this
stint in that stage, it fires a real email through Resend and a real SMS
through textbee, and logs the result either way (sent / skipped / failed)
in that case's follow-up history.

## Setting up the real alerts (Resend + textbee)

Without any of this configured, the tracker still does everything except
the actual send — it correctly detects overdue cases and shows
`skipped: not configured` in the follow-up log, so the rest of the demo
keeps working. To make it a real send:

1. Copy `.env.example` to `.env.local`.
2. **Resend** — create a free account, verify a sending domain, generate
   an API key. Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (your branded
   sender), and `ALERT_EMAIL_TO` (where alerts land).
3. **textbee** — install the textbee Android app on a phone and register
   it as a gateway device at textbee.dev; this is the one step to do
   *before* touching the tracker code, since it's the setup most likely
   to stall mid-build. Set `TEXTBEE_API_KEY`, `TEXTBEE_DEVICE_ID`, and
   `ALERT_PHONE_TO`.
4. Restart `npm run dev` so the new env vars load.

## Project layout

```
src/lib/types.ts            shared CaseRecord shape — the data spine
src/lib/db.ts                file-backed store (data/db.json) + seed data
src/lib/intakeScript.ts     the five intake questions + vagueness rules
src/lib/extraction.ts       structured-document parser + flag detection
src/lib/demand.ts            demand letter template
src/lib/followup.ts         overdue check + Resend/textbee integration
src/lib/sampleDocuments.ts  the two fabricated medical records
src/app/case/[id]/...       the four per-case screens
src/app/api/...             mutation routes backing each screen
```
