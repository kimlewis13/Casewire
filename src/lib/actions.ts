import type { CaseRecord } from "./types";
import { hoursInStage, isOverdue } from "./followup";
import { formatHoursInStage } from "./format";

export type ActionUrgency = "urgent" | "attention";

export interface CaseAction {
  urgency: ActionUrgency;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
}

const STAGE_TO_TAB: Record<CaseRecord["stage"], string> = {
  intake: "intake",
  extraction: "extraction",
  draft: "draft",
  tracking: "draft",
};

function caseHref(record: CaseRecord): string {
  return `/case/${record.id}/${STAGE_TO_TAB[record.stage]}`;
}

/**
 * The single next thing a paralegal needs to do for this case, or null if
 * nothing is owed right now (waiting on mail transit, or fully delivered).
 * This is what the dashboard queue sorts and displays — the point is that
 * nobody has to infer "what's next" from a stage badge.
 */
export function getCaseAction(record: CaseRecord): CaseAction | null {
  const href = caseHref(record);

  if (isOverdue(record)) {
    return {
      urgency: "urgent",
      title: `${record.clientName} has stalled`,
      description: `Sitting in ${record.stage === "tracking" ? "delivery" : "this stage"} for ${formatHoursInStage(
        hoursInStage(record)
      )}, past its ${record.followUpWindowHours}h follow-up window.`,
      ctaLabel: "Open case",
      href,
    };
  }

  if (record.stage === "intake" && !record.intake.completed) {
    const answered = record.intake.transcript.filter((t) => t.role === "client").length;
    return {
      urgency: "attention",
      title: `Finish intake with ${record.clientName}`,
      description:
        answered === 0
          ? "Intake hasn't started yet."
          : `${answered} question${answered === 1 ? "" : "s"} answered so far.`,
      ctaLabel: "Continue intake",
      href,
    };
  }

  if (record.stage === "extraction" && !record.extraction.completed) {
    return {
      urgency: "attention",
      title: `Add medical records for ${record.clientName}`,
      description: "No records on file yet — nothing to build a chronology from.",
      ctaLabel: "Add records",
      href,
    };
  }

  if (record.stage === "extraction" && record.extraction.completed) {
    return {
      urgency: "attention",
      title: `Ready to draft for ${record.clientName}`,
      description:
        record.extraction.flags.length > 0
          ? `${record.extraction.flags.length} item${record.extraction.flags.length === 1 ? "" : "s"} need a look before drafting.`
          : "Records reviewed and clean — ready for a demand letter.",
      ctaLabel: "Review records",
      href,
    };
  }

  if (record.stage === "draft" && !record.draft.letter) {
    return {
      urgency: "attention",
      title: `Generate a demand letter for ${record.clientName}`,
      description: "The chronology is ready — the letter hasn't been drafted yet.",
      ctaLabel: "Generate letter",
      href,
    };
  }

  if (record.stage === "draft" && record.draft.letter) {
    return {
      urgency: "attention",
      title: `Demand letter ready for ${record.clientName}`,
      description: "Drafted and waiting on review before it goes out.",
      ctaLabel: "Review & send",
      href,
    };
  }

  // stage === "tracking": sent and within its window, or delivered — nothing owed.
  return null;
}

export function sortActions(records: CaseRecord[]): { record: CaseRecord; action: CaseAction }[] {
  const withActions = records
    .map((record) => ({ record, action: getCaseAction(record) }))
    .filter((x): x is { record: CaseRecord; action: CaseAction } => x.action !== null);

  return withActions.sort((a, b) => {
    if (a.action.urgency !== b.action.urgency) {
      return a.action.urgency === "urgent" ? -1 : 1;
    }
    return hoursInStage(b.record) - hoursInStage(a.record);
  });
}
