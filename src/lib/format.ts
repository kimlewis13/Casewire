import type { CaseRecord, CaseStage, FlagSeverity } from "./types";

export const STAGE_LABEL: Record<CaseStage, string> = {
  intake: "Client intake",
  extraction: "Medical records",
  draft: "Demand letter",
  tracking: "Sent",
};

export const STAGE_ORDER: CaseStage[] = ["intake", "extraction", "draft", "tracking"];

export const STAGE_DOT_CLASS: Record<CaseStage, string> = {
  intake: "bg-accent-2",
  extraction: "bg-warning",
  draft: "bg-accent",
  tracking: "bg-success",
};

export const STAGE_BADGE_CLASS: Record<CaseStage, string> = {
  intake: "bg-accent-2/10 text-accent-2 border-accent-2/30",
  extraction: "bg-warning/10 text-warning border-warning/30",
  draft: "bg-accent/10 text-accent border-accent/30",
  tracking: "bg-success/10 text-success border-success/30",
};

export const SEVERITY_BADGE_CLASS: Record<FlagSeverity, string> = {
  high: "bg-danger/10 text-danger border-danger/30",
  medium: "bg-warning/10 text-warning border-warning/30",
  low: "bg-muted/10 text-muted border-muted/30",
};

/**
 * The stage label alone can't say much once a case reaches "Sent" — whether
 * mail is in transit or a signature is already back changes what the
 * paralegal needs to do next, so fold mail state into the same label.
 */
export function stageDisplayLabel(record: CaseRecord): string {
  if (record.stage !== "tracking") return STAGE_LABEL[record.stage];
  if (record.mail.status === "delivered") return "Delivered";
  if (record.mail.status === "sent") return "Sent — awaiting delivery";
  return "Ready to send";
}

export function formatHoursInStage(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
