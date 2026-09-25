import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type {
  CaseNote,
  CaseRecord,
  CaseSource,
  Db,
  InsuranceInfo,
  IntakeState,
  IntakeTurn,
  MailState,
  Mention,
} from "./types";
import { INTAKE_FIELDS } from "./intakeScript";
import { parseStructuredDocument, detectFlags } from "./extraction";
import { findSampleDocument } from "./sampleDocuments";
import { generateDemandLetter } from "./demand";
import { computeStatuteOfLimitationsDeadline } from "./statuteOfLimitations";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

/**
 * A dedicated, always-resettable case backing the standalone chatbot
 * walkthrough page (see /chatbot). It's excluded from the dashboard's case
 * list and action queue — it isn't a real matter, just a replayable demo
 * of the client-facing intake conversation.
 */
export const CHATBOT_DEMO_CASE_ID = "case-chatbot-demo";

export function emptyIntake(): IntakeState {
  return {
    cursor: { fieldIndex: 0, awaitingFollowUp: false },
    transcript: [],
    values: {},
    completed: false,
    statuteOfLimitationsDeadline: null,
  };
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

/**
 * Seeded incident dates are relative to "now" rather than fixed calendar
 * dates, so the computed statute-of-limitations deadline always lands in
 * the future no matter when this demo is actually opened.
 */
function monthsAgoDate(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** A completed intake with a synthetic Q&A transcript, for chatbot-sourced seed cases. */
function seededChatIntake(values: Record<string, string>): IntakeState {
  const transcript: IntakeTurn[] = [];
  INTAKE_FIELDS.forEach((field, i) => {
    transcript.push({
      id: randomUUID(),
      role: "system",
      field: field.key,
      text: field.question,
      isFollowUp: false,
      createdAt: hoursAgo(200 - i),
    });
    transcript.push({
      id: randomUUID(),
      role: "client",
      field: field.key,
      text: values[field.key] ?? "",
      isFollowUp: false,
      createdAt: hoursAgo(200 - i),
    });
  });
  return {
    cursor: { fieldIndex: INTAKE_FIELDS.length, awaitingFollowUp: false },
    transcript,
    values,
    completed: true,
    statuteOfLimitationsDeadline: computeStatuteOfLimitationsDeadline(values.incidentDate ?? ""),
  };
}

/** A completed intake with no transcript, for direct-entry seed cases. */
function seededDirectIntake(values: Record<string, string>): IntakeState {
  return {
    cursor: { fieldIndex: INTAKE_FIELDS.length, awaitingFollowUp: false },
    transcript: [],
    values,
    completed: true,
    statuteOfLimitationsDeadline: computeStatuteOfLimitationsDeadline(values.incidentDate ?? ""),
  };
}

function emptyMail(): MailState {
  return {
    status: "not_sent",
    sentAt: null,
    trackingNumber: null,
    deliveredAt: null,
    signedBy: null,
    proofImageDataUrl: null,
  };
}

function emptyInsurance(): InsuranceInfo {
  return {
    atFaultCarrier: "",
    claimNumber: "",
    adjusterName: "",
    healthInsurer: "",
    lienExpected: false,
  };
}

function newCase(partial: {
  id: string;
  clientName: string;
  contactEmail: string;
  contactPhone: string;
  owner: string;
  source: CaseSource;
  stage: CaseRecord["stage"];
  stageEnteredAt: string;
  followUpWindowHours: number;
  createdAt: string;
  intake: IntakeState;
  sampleDocIds?: string[];
  mail?: Partial<MailState>;
  notes?: CaseNote[];
  insurance?: Partial<InsuranceInfo>;
}): CaseRecord {
  const docs = (partial.sampleDocIds ?? []).map((docId) => findSampleDocument(docId)!);
  const chronology = docs
    .flatMap((doc) => parseStructuredDocument(doc.text))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const flags = chronology.length
    ? detectFlags(chronology, partial.intake.values.priorConditionSameArea)
    : [];

  const record: CaseRecord = {
    id: partial.id,
    clientName: partial.clientName,
    contactEmail: partial.contactEmail,
    contactPhone: partial.contactPhone,
    owner: partial.owner,
    source: partial.source,
    createdAt: partial.createdAt,
    stage: partial.stage,
    stageEnteredAt: partial.stageEnteredAt,
    followUpWindowHours: partial.followUpWindowHours,
    followUpLog: [],
    intake: partial.intake,
    extraction: {
      sources: docs.map((doc) => ({ id: randomUUID(), name: doc.name, addedAt: partial.createdAt })),
      chronology,
      flags,
      completed: chronology.length > 0,
      ranAt: chronology.length > 0 ? partial.createdAt : null,
    },
    draft: { letter: null, reviewItems: [], generatedAt: null, completed: false },
    mail: { ...emptyMail(), ...partial.mail },
    notes: partial.notes ?? [],
    insurance: { ...emptyInsurance(), ...partial.insurance },
  };

  // The hard send gate requires every flag resolved — for seeded cases that
  // are already sent/delivered, mark them resolved so the seed reflects a
  // world where that gate was always enforced (never a case with an open
  // review item that somehow already went out).
  if (record.mail.status !== "not_sent") {
    record.extraction.flags = record.extraction.flags.map((f) => ({ ...f, resolved: true }));
  }

  if (
    (partial.stage === "draft" || partial.stage === "tracking") &&
    record.extraction.completed
  ) {
    const { letter, reviewItems } = generateDemandLetter(record);
    record.draft = {
      letter,
      reviewItems,
      generatedAt: partial.createdAt,
      completed: partial.stage === "tracking",
    };
  }

  return record;
}

function seedDb(): Db {
  const cases: CaseRecord[] = [
    // Primary golden-path case: walk this one through all four screens live.
    // Chatbot-sourced, so the follow-up-on-vague-answer chat is on display.
    newCase({
      id: "case-reyes",
      clientName: "Jordan Reyes",
      contactEmail: "jordan.reyes@example.com",
      contactPhone: "+15555550101",
      owner: "Paralegal - You",
      source: "chatbot",
      stage: "intake",
      stageEnteredAt: hoursAgo(1),
      followUpWindowHours: 48,
      createdAt: hoursAgo(1),
      intake: emptyIntake(),
    }),
    // The centralization story: three separate provider systems, added one
    // at a time, none of which talk to each other — the case this prototype
    // is really for. Seeded with zero records yet so it can be built up live.
    newCase({
      id: "case-webb",
      clientName: "Marcus Webb",
      contactEmail: "marcus.webb@example.com",
      contactPhone: "+15555550107",
      owner: "Paralegal - You",
      source: "chatbot",
      stage: "extraction",
      stageEnteredAt: hoursAgo(1),
      followUpWindowHours: 72,
      createdAt: hoursAgo(240),
      intake: seededChatIntake({
        incidentDate: monthsAgoDate(4),
        incidentNarrative:
          "Multi-vehicle collision on the interstate during morning traffic — stopped in traffic and got hit from behind, which pushed the car into the vehicle ahead.",
        liabilityDetail:
          "The trailing driver was cited for following too closely; a state trooper responded and filed a report.",
        injuryDescription:
          "Whiplash, right shoulder strain confirmed as a partial rotator cuff tear, and a mild concussion.",
        treatmentStatus: "Ongoing orthopedic care; considering surgical repair for the shoulder.",
        priorConditionSameArea: "No, nothing like that before.",
        insuranceDetail:
          "Has their own auto insurance, and believes the other driver is covered through Coastal Auto Insurance.",
        claimFiled: "Yes, Coastal Auto Insurance already reached out and opened a claim.",
        priorRepresentation: "No prior attorney contact.",
      }),
      insurance: {
        atFaultCarrier: "Coastal Auto Insurance",
        claimNumber: "CAI-2024-55291",
        adjusterName: "R. Ibanez",
        healthInsurer: "Union Health Plan",
        lienExpected: true,
      },
    }),
    // Case mid-draft, not yet overdue.
    newCase({
      id: "case-ward",
      clientName: "Devon Ward",
      contactEmail: "devon.ward@example.com",
      contactPhone: "+15555550103",
      owner: "Paralegal - Alex K.",
      source: "chatbot",
      stage: "draft",
      stageEnteredAt: hoursAgo(5),
      followUpWindowHours: 24,
      createdAt: hoursAgo(96),
      intake: seededChatIntake({
        incidentDate: "January 5, 2024",
        incidentNarrative:
          "Stopped at a red light downtown when another car rear-ended the vehicle from behind.",
        liabilityDetail:
          "Rear-ended at a stoplight by a distracted driver who admitted fault to responding police.",
        injuryDescription:
          "Cervical strain and lumbar contusion, treated with physical therapy and an orthopedic referral.",
        treatmentStatus: "Currently in week five of a six-week physical therapy program, twice weekly.",
        priorConditionSameArea: "No prior neck or back issues before this.",
        insuranceDetail:
          "Has personal auto insurance; the other driver is insured through Granite State Mutual.",
        claimFiled: "Yes, Granite State Mutual opened a claim shortly after the accident.",
        priorRepresentation: "No prior attorney contact.",
      }),
      sampleDocIds: ["reyes-rear-end"],
      insurance: {
        atFaultCarrier: "Granite State Mutual",
        claimNumber: "GSM-4471029",
        adjusterName: "P. Contreras",
      },
      notes: [
        {
          id: randomUUID(),
          createdAt: hoursAgo(3),
          author: "Paralegal - Alex K.",
          text: "Left a voicemail for the client to confirm what happened during the PT gap — waiting on a callback before clearing that item. @Morgan L. can you follow up if I don't hear back by Friday?",
          kind: "note",
        },
      ],
    }),
    // Stalled case sitting well past its follow-up window — this is the one
    // the tracker's follow-up check should flag and (if keys are configured) alert on.
    newCase({
      id: "case-brooks",
      clientName: "Taylor Brooks",
      contactEmail: "taylor.brooks@example.com",
      contactPhone: "+15555550104",
      owner: "Paralegal - Morgan L.",
      source: "direct",
      stage: "tracking",
      stageEnteredAt: hoursAgo(10 * 24),
      followUpWindowHours: 72,
      createdAt: hoursAgo(40 * 24),
      intake: seededDirectIntake({
        incidentDate: "November 3, 2023",
        incidentNarrative:
          "Crossing the street in a marked crosswalk with the signal in her favor when a delivery van turned into her.",
        liabilityDetail:
          "Struck by a delivery van while crossing in a marked crosswalk with the signal in her favor.",
        injuryDescription:
          "Fractured left tibia requiring surgical fixation, followed by months of physical therapy.",
        treatmentStatus: "Completed physical therapy; final orthopedic follow-up confirmed healing.",
        priorConditionSameArea: "No prior issues with that leg.",
        insuranceDetail:
          "Has employer health insurance; the van is a commercial vehicle insured through Pinecrest Delivery Co.",
        claimFiled: "Yes, a claim was opened with Pinecrest Delivery Co.'s insurer.",
        priorRepresentation: "No prior attorney contact.",
      }),
      sampleDocIds: ["reyes-rear-end"],
      insurance: {
        atFaultCarrier: "Pinecrest Delivery Co. (commercial auto)",
        claimNumber: "PDC-991843",
        adjusterName: "J. Marsh",
      },
      mail: {
        status: "sent",
        sentAt: hoursAgo(10 * 24),
        trackingNumber: "9407 3000 0000 0000 1234 56",
      },
    }),
    // Fully closed out — delivered — so all three mail states are visible
    // in the seed data without any manual steps.
    newCase({
      id: "case-ortiz",
      clientName: "Jamie Ortiz",
      contactEmail: "jamie.ortiz@example.com",
      contactPhone: "+15555550105",
      owner: "Paralegal - Morgan L.",
      source: "chatbot",
      stage: "tracking",
      stageEnteredAt: hoursAgo(5 * 24),
      followUpWindowHours: 72,
      createdAt: hoursAgo(60 * 24),
      intake: seededChatIntake({
        incidentDate: "August 12, 2023",
        incidentNarrative:
          "Merging onto the highway when another car sideswiped the vehicle from the next lane.",
        liabilityDetail: "Sideswiped while merging by a driver who failed to check their blind spot.",
        injuryDescription: "Shoulder sprain and mild concussion, resolved with six weeks of physical therapy.",
        treatmentStatus: "Discharged from care; no further treatment needed.",
        priorConditionSameArea: "No prior shoulder issues.",
        insuranceDetail:
          "Has personal auto coverage; the other driver is insured through Coastal Auto Insurance.",
        claimFiled: "Yes, a claim was opened with Coastal Auto Insurance.",
        priorRepresentation: "No prior attorney contact.",
      }),
      sampleDocIds: ["shah-slip-fall"],
      insurance: {
        atFaultCarrier: "Coastal Auto Insurance",
        claimNumber: "CAI-2023-10047",
        adjusterName: "R. Ibanez",
      },
      mail: {
        status: "delivered",
        sentAt: hoursAgo(5 * 24),
        trackingNumber: "9407 3000 0000 0000 9988 77",
        deliveredAt: hoursAgo(2 * 24),
        signedBy: "J. Ortiz",
      },
    }),
    // Not a real matter — backs the standalone /chatbot walkthrough page.
    // Excluded from the dashboard's case list and action queue.
    newCase({
      id: CHATBOT_DEMO_CASE_ID,
      clientName: "Demo visitor",
      contactEmail: "demo@example.com",
      contactPhone: "+15555550100",
      owner: "Paralegal - You",
      source: "chatbot",
      stage: "intake",
      stageEnteredAt: hoursAgo(0),
      followUpWindowHours: 48,
      createdAt: hoursAgo(0),
      intake: emptyIntake(),
    }),
  ];

  return { cases, mentions: [] };
}

function ensureDb(): Db {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const seeded = seedDb();
    fs.writeFileSync(DB_PATH, JSON.stringify(seeded, null, 2));
    return seeded;
  }
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  try {
    const parsed = JSON.parse(raw) as Db;
    if (!parsed.mentions) parsed.mentions = [];
    return parsed;
  } catch {
    const seeded = seedDb();
    fs.writeFileSync(DB_PATH, JSON.stringify(seeded, null, 2));
    return seeded;
  }
}

export function readDb(): Db {
  return ensureDb();
}

export function writeDb(db: Db): void {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function getCase(id: string): CaseRecord | undefined {
  return readDb().cases.find((c) => c.id === id);
}

export function updateCase(
  id: string,
  updater: (c: CaseRecord) => CaseRecord
): CaseRecord {
  const db = readDb();
  const idx = db.cases.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error(`Case ${id} not found`);
  db.cases[idx] = updater(db.cases[idx]);
  writeDb(db);
  return db.cases[idx];
}

export function addMentions(mentions: Mention[]): void {
  const db = readDb();
  db.mentions = [...db.mentions, ...mentions];
  writeDb(db);
}

export function createCase(input: {
  clientName: string;
  contactEmail: string;
  contactPhone: string;
  owner: string;
  followUpWindowHours: number;
  source: CaseSource;
}): CaseRecord {
  const db = readDb();
  const record = newCase({
    id: randomUUID(),
    clientName: input.clientName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    owner: input.owner,
    source: input.source,
    stage: "intake",
    stageEnteredAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    followUpWindowHours: input.followUpWindowHours,
    intake: emptyIntake(),
  });
  db.cases.unshift(record);
  writeDb(db);
  return record;
}

export function resetDb(): Db {
  const seeded = seedDb();
  writeDb(seeded);
  return seeded;
}
