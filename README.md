# Casewire

A working prototype of one connected data flow across a personal injury
case: **client intake → medical records → demand letter → sent/delivered**.
Built to demonstrate product thinking and AI-assisted prototyping under
real time pressure — not a production system.

All sample data (names, injuries, dates) is fabricated. There is no auth,
no multi-firm support, and no real OCR/ML extraction — reading medical
records is a deliberately simple, deterministic parser (see "How the
records parser actually works" below). User-facing copy avoids
engineering terms like "extraction" or "OCR" on purpose — the internal
code still uses those names, but nothing a paralegal sees should.

## The core idea

There's one `CaseRecord` per case, stored server-side. Every screen reads
from and writes to the same record, and a "Case facts" panel on each
screen shows the same captured values regardless of which stage you're
looking at — nothing is re-typed at a handoff:

- Client intake fills in structured fields (incident date, liability,
  injury severity, treatment status, prior representation).
- Medical records fills in a chronology and a "needs review" list.
- The demand letter is generated **from** the intake fields and the
  chronology — not typed separately.
- Sending is what moves a case into its final stage; delivery
  confirmation (with an optional photo of the signed slip) closes it out.

The dashboard leads with a prioritized **action queue** — one line per
case naming the single next thing a paralegal owes it — rather than a
plain status list, so nobody has to infer what's needed from a stage
badge. An "All cases" grid underneath covers everything else.

## Running it

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Five seeded demo cases appear on the
dashboard, one per stage (plus one already sent and one already
delivered, so all three mail states are visible without doing anything).
`case-reyes` ("Jordan Reyes") is the intentionally unfinished one — walk
it through the whole flow live.

Data lives in `data/db.json`, created automatically on first run and
gitignored (it's runtime state, not source). Delete it (or `POST
/api/reset`) to get back to the original seed.

## The screens

### Client details (`/case/[id]/intake`)

A scripted chat that asks five questions (incident date, liability,
injury severity, treatment status, prior representation). Each question
has a heuristic vagueness check — e.g. "it was bad" for an incident date
has no digits, so it gets followed up ("do you have an approximate date?")
instead of being written to the record as-is. The clarified answer
replaces (or, for narrative fields, extends) the original — the vague
version never survives into the case record or the letter. The captured
facts are the primary view; the back-and-forth that produced them sits
collapsed behind "View chat details" for anyone who wants to audit it.

### Medical records (`/case/[id]/extraction`)

Two fabricated sample records are built in, plus a box to paste your own
in the same format. The parser looks for `Date: / Provider: / Type: /
Notes:` blocks separated by `---`. It surfaces what's on file, a "needs
review before drafting" checklist, and — behind a disclosure, since it's
supporting detail rather than the headline — the full chronology table.

Three checks run over the parsed chronology:
- **Gaps** — any two consecutive dated entries more than 30 days apart.
- **Inconsistencies** — a phrase like "history of prior surgery" that
  shows up in exactly one entry and is never mentioned again.
- **Unresolved items** — something "recommended" or "ordered" (an MRI, a
  referral) that never appears again in a later entry.

The first sample document ("Reyes — rear-end collision") plants all
three. The second ("Shah — slip and fall") is clean, to show the checks
aren't just always firing.

### Demand letter (`/case/[id]/draft`)

Assembles a first-pass letter from the intake fields and the chronology,
plus a "needs attorney review" list built from the records flags (and a
standing reminder that billing/damages figures aren't computed here).
Regenerating pulls from whatever is currently on the case record — until
it's sent, after which the letter locks and only the mail state below it
moves.

**Certified mail** lives at the bottom of this screen as a three-state
flow, since that's how PI demand letters actually go out (return receipt
requested, to establish a paper trail):
1. **Ready to send** → "Send via certified mail" (optional tracking
   number). This is also what actually advances the case out of the
   drafting stage — sending is the transition, not a separate button.
2. **Sent — awaiting delivery** → "Mark as delivered" opens a small form
   for the delivery date/time, who signed for it, and an optional photo
   of the delivery slip/green card.
3. **Delivered** → a closed-out confirmation card with the signature
   details and that photo, if one was provided.

There's no real certified-mail API wired up here (unlike email/SMS below)
— faking a government mail receipt would be worse than just being honest
that this step is manually confirmed.

### Status

There's no separate status screen. Stage, time-in-stage, an overdue flag,
and follow-up history live in a persistent header on every case screen,
under the client's name, so it's never something you have to go check.

## Follow-up alerts (Resend + textbee)

Each case tracks a `followUpWindowHours`. The dashboard's "Run follow-up
check" button (and the per-case one under "Follow-up history" in the
header) evaluates every case: if it's been sitting in its current stage
longer than that window **and** hasn't already been alerted for this
stint in that stage, it fires a real email through Resend and a real SMS
through textbee, and logs the result either way (sent / skipped / failed).
A case that's already been marked **delivered** is never flagged as
overdue — there's nothing left to chase.

Without any of this configured, the check still does everything except
the actual send — it correctly detects overdue cases and shows
`skipped: not configured` in the log, so the rest of the demo keeps
working. To make it a real send:

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
src/lib/actions.ts          derives each case's single next action
src/lib/sampleDocuments.ts  the two fabricated medical records
src/app/case/[id]/...       the per-case screens (client details, records, letter)
src/app/api/...             mutation routes backing each screen
```
