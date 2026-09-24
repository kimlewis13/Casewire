import type { CaseRecord } from "./types";

export function hoursInStage(c: CaseRecord): number {
  return (Date.now() - new Date(c.stageEnteredAt).getTime()) / (1000 * 60 * 60);
}

export function isOverdue(c: CaseRecord): boolean {
  if (c.stage === "tracking" && c.mail.status === "delivered") return false;
  return hoursInStage(c) > c.followUpWindowHours;
}
