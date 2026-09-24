export type CaseStage = "intake" | "extraction" | "draft" | "tracking";
export type CaseSource = "direct" | "chatbot";

export interface IntakeTurn {
  id: string;
  role: "system" | "client";
  field: string | null;
  text: string;
  isFollowUp: boolean;
  createdAt: string;
}

export interface IntakeCursor {
  fieldIndex: number;
  awaitingFollowUp: boolean;
}

export interface IntakeState {
  cursor: IntakeCursor;
  transcript: IntakeTurn[];
  values: Record<string, string>;
  completed: boolean;
}

export type ChronologyEventType =
  | "visit"
  | "diagnosis"
  | "treatment"
  | "imaging"
  | "referral";

export interface ChronologyEntry {
  id: string;
  date: string;
  provider: string;
  type: ChronologyEventType;
  summary: string;
  raw: string;
}

export type ExtractionFlagType = "gap" | "inconsistency" | "missing";
export type FlagSeverity = "low" | "medium" | "high";

export interface ExtractionFlag {
  id: string;
  type: ExtractionFlagType;
  severity: FlagSeverity;
  message: string;
  relatedEntryIds: string[];
  resolved: boolean;
}

export interface ExtractionState {
  sourceDocumentName: string | null;
  sourceText: string | null;
  chronology: ChronologyEntry[];
  flags: ExtractionFlag[];
  completed: boolean;
  ranAt: string | null;
}

export interface DraftState {
  letter: string | null;
  reviewItems: string[];
  generatedAt: string | null;
  completed: boolean;
}

export type MailStatus = "not_sent" | "sent" | "delivered";

export interface MailState {
  status: MailStatus;
  sentAt: string | null;
  trackingNumber: string | null;
  deliveredAt: string | null;
  signedBy: string | null;
  proofImageDataUrl: string | null;
}

export interface FollowUpLog {
  id: string;
  triggeredAt: string;
  stage: CaseStage;
  emailStatus: "sent" | "skipped" | "failed";
  emailDetail: string;
  smsStatus: "sent" | "skipped" | "failed";
  smsDetail: string;
}

export interface CaseRecord {
  id: string;
  clientName: string;
  contactEmail: string;
  contactPhone: string;
  owner: string;
  source: CaseSource;
  createdAt: string;
  stage: CaseStage;
  stageEnteredAt: string;
  followUpWindowHours: number;
  followUpLog: FollowUpLog[];
  intake: IntakeState;
  extraction: ExtractionState;
  draft: DraftState;
  mail: MailState;
}

export interface Db {
  cases: CaseRecord[];
}
