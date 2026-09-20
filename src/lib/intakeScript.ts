export interface IntakeField {
  key: string;
  label: string;
  question: string;
  followUpQuestion: (answer: string) => string;
  isVague: (answer: string) => boolean;
  /**
   * How to fold a follow-up answer into the recorded value. Defaults to
   * replacing the vague original outright (e.g. a date). Narrative fields
   * override this to append the clarification instead of discarding the
   * original context.
   */
  mergeFollowUp?: (original: string, followUp: string) => string;
}

const appendFollowUp = (original: string, followUp: string) =>
  `${original} ${followUp}`;

const VAGUE_WORDS = [
  "bad",
  "not good",
  "hurt",
  "hurts",
  "hurting",
  "pain",
  "sore",
  "fine",
  "okay",
  "ok",
  "a while",
  "a bit",
  "some",
  "kind of",
  "sort of",
  "not sure",
  "maybe",
  "i think",
];

const YES_NO_ONLY = /^\s*(yes|no|yeah|nope|yep|nah)\.?\s*$/i;

function wordCount(answer: string): number {
  return answer.trim().split(/\s+/).filter(Boolean).length;
}

function containsVagueWord(answer: string): boolean {
  const lower = answer.toLowerCase();
  return VAGUE_WORDS.some((w) => lower.includes(w));
}

export const INTAKE_FIELDS: IntakeField[] = [
  {
    key: "incidentDate",
    label: "Incident date",
    question:
      "Let's start with the basics — when did the incident happen?",
    isVague: (answer) => !/\d/.test(answer) || wordCount(answer) <= 2,
    followUpQuestion: () =>
      "I need something more specific for the file — do you have an approximate date? Even a month and year, or how many weeks/months ago, works.",
  },
  {
    key: "liability",
    label: "Liability detail",
    question:
      "Walk me through what happened, and who you believe was at fault.",
    isVague: (answer) =>
      wordCount(answer) < 12 ||
      !/(hit|rear|ran|red light|speeding|slip|fell|fall|failed|distracted|drove|driving|left|turn|stop|wet floor|ice|dog|attack|negligen)/i.test(
        answer
      ),
    followUpQuestion: () =>
      "Can you be more specific about what the other party did that you believe caused this? For example, did they run a light, fail to stop, ignore a hazard, or something else?",
    mergeFollowUp: appendFollowUp,
  },
  {
    key: "injurySeverity",
    label: "Injury severity",
    question: "What injuries did you experience as a result?",
    isVague: (answer) =>
      wordCount(answer) < 8 ||
      (containsVagueWord(answer) &&
        !/(fracture|surgery|sprain|strain|concussion|tear|herniat|dislocat|laceration|broke|broken)/i.test(
          answer
        )),
    followUpQuestion: () =>
      "Can you describe that more specifically — was there a diagnosis, did it require surgery, imaging, or physical therapy, and did you miss any work because of it?",
    mergeFollowUp: appendFollowUp,
  },
  {
    key: "treatmentStatus",
    label: "Current treatment status",
    question: "Are you still receiving treatment for these injuries?",
    isVague: (answer) => YES_NO_ONLY.test(answer) || wordCount(answer) < 5,
    followUpQuestion: () =>
      "About how many appointments have you had so far, with which providers, and is anything else scheduled going forward?",
    mergeFollowUp: appendFollowUp,
  },
  {
    key: "priorRepresentation",
    label: "Prior representation",
    question:
      "Have you spoken with another attorney about this matter, or signed anything with another firm?",
    isVague: (answer) => YES_NO_ONLY.test(answer),
    followUpQuestion: (answer) =>
      /^\s*(yes|yeah|yep)/i.test(answer)
        ? "What was the outcome of that — is it still open, or did that representation end? Did you sign a retainer or any settlement documents?"
        : "Just to confirm for the file — no prior consultations, retainers, or settlement discussions with any other attorney or insurer?",
  },
];

export function getField(index: number): IntakeField | undefined {
  return INTAKE_FIELDS[index];
}
