import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { CaseRecord, Db, IntakeState, IntakeTurn, MailState } from "./types";
import { INTAKE_FIELDS } from "./intakeScript";
import { parseStructuredDocument, detectFlags } from "./extraction";
import { findSampleDocument } from "./sampleDocuments";
import { generateDemandLetter } from "./demand";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

function emptyIntake(): IntakeState {
  return {
    cursor: { fieldIndex: 0, awaitingFollowUp: false },
    transcript: [],
    values: {},
    completed: false,
  };
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

function seededIntake(values: Record<string, string>): IntakeState {
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

function newCase(partial: {
  id: string;
  clientName: string;
  contactEmail: string;
  contactPhone: string;
  owner: string;
  stage: CaseRecord["stage"];
  stageEnteredAt: string;
  followUpWindowHours: number;
  createdAt: string;
  intake: IntakeState;
  sampleDocId?: string;
  mail?: Partial<MailState>;
}): CaseRecord {
  const chronology = partial.sampleDocId
    ? parseStructuredDocument(findSampleDocument(partial.sampleDocId)!.text)
    : [];
  const flags = chronology.length ? detectFlags(chronology) : [];

  const record: CaseRecord = {
    id: partial.id,
    clientName: partial.clientName,
    contactEmail: partial.contactEmail,
    contactPhone: partial.contactPhone,
    owner: partial.owner,
    createdAt: partial.createdAt,
    stage: partial.stage,
    stageEnteredAt: partial.stageEnteredAt,
    followUpWindowHours: partial.followUpWindowHours,
    followUpLog: [],
    intake: partial.intake,
    extraction: {
      sourceDocumentName: partial.sampleDocId
        ? findSampleDocument(partial.sampleDocId)!.name
        : null,
      sourceText: partial.sampleDocId
        ? findSampleDocument(partial.sampleDocId)!.text
        : null,
      chronology,
      flags,
      completed: chronology.length > 0,
      ranAt: chronology.length > 0 ? partial.createdAt : null,
    },
    draft: { letter: null, reviewItems: [], generatedAt: null, completed: false },
    mail: { ...emptyMail(), ...partial.mail },
  };

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
    newCase({
      id: "case-reyes",
      clientName: "Jordan Reyes",
      contactEmail: "jordan.reyes@example.com",
      contactPhone: "+15555550101",
      owner: "You (paralegal)",
      stage: "intake",
      stageEnteredAt: hoursAgo(1),
      followUpWindowHours: 48,
      createdAt: hoursAgo(1),
      intake: emptyIntake(),
    }),
    // Healthy case sitting in extraction, using the clean sample document.
    newCase({
      id: "case-shah",
      clientName: "Priya Shah",
      contactEmail: "priya.shah@example.com",
      contactPhone: "+15555550102",
      owner: "Alex Kim",
      stage: "extraction",
      stageEnteredAt: hoursAgo(6),
      followUpWindowHours: 72,
      createdAt: hoursAgo(30),
      intake: seededIntake({
        incidentDate: "February 1, 2024",
        liability: "Slipped on a wet floor at a grocery store entrance where no warning sign had been posted.",
        injurySeverity: "Right wrist sprain and right hip contusion, confirmed by X-ray with no fracture.",
        treatmentStatus: "Discharged from active treatment as of the last physical therapy visit.",
        priorRepresentation: "No, this is the first attorney contact for this matter.",
      }),
      sampleDocId: "shah-slip-fall",
    }),
    // Case mid-draft, not yet overdue.
    newCase({
      id: "case-ward",
      clientName: "Devon Ward",
      contactEmail: "devon.ward@example.com",
      contactPhone: "+15555550103",
      owner: "Alex Kim",
      stage: "draft",
      stageEnteredAt: hoursAgo(5),
      followUpWindowHours: 24,
      createdAt: hoursAgo(96),
      intake: seededIntake({
        incidentDate: "January 5, 2024",
        liability: "Rear-ended at a stoplight by a distracted driver who admitted fault to responding police.",
        injurySeverity: "Cervical strain and lumbar contusion, treated with physical therapy and an orthopedic referral.",
        treatmentStatus: "Currently in week five of a six-week physical therapy program, twice weekly.",
        priorRepresentation: "No prior attorney contact.",
      }),
      sampleDocId: "reyes-rear-end",
    }),
    // Stalled case sitting well past its follow-up window — this is the one
    // the tracker's follow-up check should flag and (if keys are configured) alert on.
    newCase({
      id: "case-brooks",
      clientName: "Taylor Brooks",
      contactEmail: "taylor.brooks@example.com",
      contactPhone: "+15555550104",
      owner: "Morgan Lee",
      stage: "tracking",
      stageEnteredAt: hoursAgo(10 * 24),
      followUpWindowHours: 72,
      createdAt: hoursAgo(40 * 24),
      intake: seededIntake({
        incidentDate: "November 3, 2023",
        liability: "Struck by a delivery van while crossing in a marked crosswalk with the signal in her favor.",
        injurySeverity: "Fractured left tibia requiring surgical fixation, followed by months of physical therapy.",
        treatmentStatus: "Completed physical therapy; final orthopedic follow-up confirmed healing.",
        priorRepresentation: "No prior attorney contact.",
      }),
      sampleDocId: "reyes-rear-end",
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
      owner: "Morgan Lee",
      stage: "tracking",
      stageEnteredAt: hoursAgo(5 * 24),
      followUpWindowHours: 72,
      createdAt: hoursAgo(60 * 24),
      intake: seededIntake({
        incidentDate: "August 12, 2023",
        liability: "Sideswiped while merging by a driver who failed to check their blind spot.",
        injurySeverity: "Shoulder sprain and mild concussion, resolved with six weeks of physical therapy.",
        treatmentStatus: "Discharged from care; no further treatment needed.",
        priorRepresentation: "No prior attorney contact.",
      }),
      sampleDocId: "shah-slip-fall",
      mail: {
        status: "delivered",
        sentAt: hoursAgo(5 * 24),
        trackingNumber: "9407 3000 0000 0000 9988 77",
        deliveredAt: hoursAgo(2 * 24),
        signedBy: "J. Ortiz",
      },
    }),
  ];

  return { cases };
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
    return JSON.parse(raw) as Db;
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

export function createCase(input: {
  clientName: string;
  contactEmail: string;
  contactPhone: string;
  owner: string;
  followUpWindowHours: number;
}): CaseRecord {
  const db = readDb();
  const record = newCase({
    id: randomUUID(),
    clientName: input.clientName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    owner: input.owner,
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
