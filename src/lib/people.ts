/** The known people a note can @mention — mirrors the case-owner roster. */
export const ROSTER = ["Alex K.", "Morgan L.", "You"] as const;

export function findMentions(text: string): string[] {
  return ROSTER.filter((name) => text.toLowerCase().includes(`@${name.toLowerCase()}`));
}
