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

const HEDGE_ONLY = /^\s*(maybe|kind of|sort of|not sure|i think|possibly|i guess)\.?\s*$/i;
const RELATIVE_TIME = /\b(today|yesterday|last (week|month|year)|this (week|month)|(a|one|two|three|four|five|six|seven|eight|nine|ten)\s+(day|week|month|year)s?\s+ago)\b/i;
const YES_NO_ONLY = /^\s*(yes|no|yeah|nope|yep|nah)\.?\s*$/i;
const BARE_YES = /^\s*(yes|yeah|yep)\.?\s*$/i;

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
      "I'm really sorry this happened to you. Before anything else — nothing you share here commits you to hiring us, and you'll get to talk with a real person soon. I just want to understand your situation first. Can you tell me roughly when this happened?",
    isVague: (answer) =>
      (!/\d/.test(answer) && !RELATIVE_TIME.test(answer)) || wordCount(answer) <= 2,
    followUpQuestion: () =>
      "No worries if you don't remember the exact date — even a rough idea, like a month, or \"about three weeks ago,\" works completely fine.",
  },
  {
    key: "incidentNarrative",
    label: "What happened",
    question:
      "Thank you. Can you walk me through what happened — where you were, and how it occurred? Take whatever time you need.",
    isVague: (answer) =>
      wordCount(answer) < 10 ||
      !/(hit|rear|ran|red light|speeding|slip|fell|fall|failed|distracted|drove|driving|left turn|stop|wet floor|ice|dog|attack|work|ladder|machine)/i.test(
        answer
      ),
    followUpQuestion: () =>
      "However much you remember is okay — for example, were you driving, walking, at work, or somewhere else when it happened?",
    mergeFollowUp: appendFollowUp,
  },
  {
    key: "injuryDescription",
    label: "Injuries",
    question:
      "That sounds like a lot to deal with. Can you tell me about your injuries — what happened to you physically, and how you've been feeling since?",
    isVague: (answer) =>
      wordCount(answer) < 8 ||
      (containsVagueWord(answer) &&
        !/(fracture|surgery|sprain|strain|concussion|tear|herniat|dislocat|laceration|broke|broken|pain|ache)/i.test(
          answer
        )),
    followUpQuestion: () =>
      "However it's showing up is fine to describe in your own words — is it pain, trouble moving, something a doctor pointed out, anything like that?",
    mergeFollowUp: appendFollowUp,
  },
  {
    key: "liabilityDetail",
    label: "Liability detail",
    question:
      "Before we go any further, I want you to know something important: we work on contingency, which means there's no cost to you today, and you wouldn't owe us anything unless we actually win your case. Now — do you know if anyone else was involved, like another driver or a business, and has anyone said anything about whose fault this was?",
    isVague: (answer) =>
      wordCount(answer) < 10 ||
      !/(hit|rear|ran|red light|speeding|slip|fell|fall|failed|distracted|drove|driving|left|turn|stop|wet floor|ice|dog|attack|negligen|fault)/i.test(
        answer
      ),
    followUpQuestion: () =>
      "Even something small someone said at the scene helps — and if a police or incident report was filed, that's useful to know too.",
    mergeFollowUp: appendFollowUp,
  },
  {
    key: "treatmentStatus",
    label: "Current treatment status",
    question:
      "Have you been able to see a doctor for this yet? Wherever it was — an ER, urgent care, your regular doctor — and are you still being treated, or has that finished up?",
    isVague: (answer) => YES_NO_ONLY.test(answer) || wordCount(answer) < 5,
    followUpQuestion: () =>
      "Roughly how many appointments so far, with which providers, and is there anything else scheduled?",
    mergeFollowUp: appendFollowUp,
  },
  {
    key: "priorConditionSameArea",
    label: "Prior condition, same area",
    question:
      "One more thing that's genuinely helpful to know upfront — not a trick question: had you had any injury or issue with that same part of your body before this happened?",
    isVague: (answer) => HEDGE_ONLY.test(answer),
    followUpQuestion: () =>
      "That's really helpful either way — can you say a bit more, like roughly when that was and whether it had fully healed before this happened?",
    mergeFollowUp: appendFollowUp,
  },
  {
    key: "insuranceDetail",
    label: "Insurance and coverage",
    question:
      "Do you have insurance you'd be using for this — auto or health — and if you happen to know anything about the other party's insurance, that helps too.",
    isVague: (answer) => wordCount(answer) < 5,
    followUpQuestion: () =>
      "No worries if you're not sure of the details — even just knowing whether you think you're covered helps for now.",
    mergeFollowUp: appendFollowUp,
  },
  {
    key: "claimFiled",
    label: "Claim already filed",
    question:
      "Has a claim already been opened with any insurance company, either yours or theirs? If someone's already reached out to you about this, that's good to know too.",
    isVague: (answer) => BARE_YES.test(answer),
    followUpQuestion: () =>
      "Do you know who reached out, and what they've asked you so far?",
    mergeFollowUp: appendFollowUp,
  },
  {
    key: "priorRepresentation",
    label: "Prior representation",
    question:
      "Last thing — have you already spoken with another attorney about this, or signed anything with another firm?",
    isVague: (answer) => YES_NO_ONLY.test(answer),
    followUpQuestion: (answer) =>
      /^\s*(yes|yeah|yep)/i.test(answer)
        ? "Thanks for telling me — is that still ongoing, or did it end? Did you sign a retainer or any settlement paperwork? This won't cause a problem, I just need to know where things stand."
        : "Good to know — that keeps things simple. Just to confirm for the file: no prior consultations, retainers, or settlement talks with anyone else?",
  },
];

export function getField(index: number): IntakeField | undefined {
  return INTAKE_FIELDS[index];
}
