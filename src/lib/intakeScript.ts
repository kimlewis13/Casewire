export interface IntakeFieldDef {
  key: string;
  label: string;
  /** Used only to build a plausible transcript for seeded demo cases. */
  seedQuestion: string;
  /** Given to the model as the field description in the fact-extraction tool. */
  description: string;
  /**
   * Direct-entry cases already have the client's name and contact info from
   * when the case was created — the paralegal shouldn't be asked to re-enter
   * them in the intake form.
   */
  skipForDirectEntry?: boolean;
}

export const INTAKE_FIELDS: IntakeFieldDef[] = [
  {
    key: "clientName",
    label: "Name",
    seedQuestion:
      "I'm really sorry this happened to you. Before anything else — nothing you share here commits you to hiring us, and you'll get to talk with a real person soon. Can I start with your name?",
    description: "The client's full name, as given.",
    skipForDirectEntry: true,
  },
  {
    key: "incidentDate",
    label: "Incident date",
    seedQuestion: "Thanks, {name}. Can you tell me roughly when this happened?",
    description:
      "The date of the incident, resolved to an exact ISO 8601 date (YYYY-MM-DD) using today's date given in context. If they give a relative answer like \"about two weeks ago\" or \"yesterday,\" compute the actual date yourself rather than recording the relative phrase.",
  },
  {
    key: "incidentNarrative",
    label: "What happened",
    seedQuestion:
      "Thank you. Can you walk me through what happened — where you were, and how it occurred? Take whatever time you need.",
    description:
      "What happened and where — the mechanism of the incident (e.g. rear-ended, slipped on ice, struck by a vehicle while walking).",
  },
  {
    key: "injuryDescription",
    label: "Injuries",
    seedQuestion:
      "That sounds like a lot to deal with. Can you tell me about your injuries — what happened to you physically, and how you've been feeling since?",
    description: "Their injuries — what's hurt, and how it's affected them.",
  },
  {
    key: "liabilityDetail",
    label: "Liability detail",
    seedQuestion:
      "Before we go any further, I want you to know something important: we work on contingency, which means there's no cost to you today, and you wouldn't owe us anything unless we actually win your case. Now — do you know if anyone else was involved, like another driver or a business, and has anyone said anything about whose fault this was?",
    description:
      "Who else was involved and any indication of fault — a citation, an admission at the scene, a police report.",
  },
  {
    key: "treatmentStatus",
    label: "Current treatment status",
    seedQuestion:
      "Have you been able to see a doctor for this yet? Wherever it was — an ER, urgent care, your regular doctor — and are you still being treated, or has that finished up?",
    description:
      "Whether they've seen a doctor, which providers, and whether treatment is ongoing or finished.",
  },
  {
    key: "priorConditionSameArea",
    label: "Prior condition, same area",
    seedQuestion:
      "One more thing that's genuinely helpful to know upfront — not a trick question: had you had any injury or issue with that same part of your body before this happened?",
    description:
      "Whether they had any prior injury or condition to the same body part before this incident — record their answer whether it's a clear no or a detailed yes.",
  },
  {
    key: "insuranceDetail",
    label: "Insurance and coverage",
    seedQuestion:
      "Do you have insurance you'd be using for this — auto or health — and if you happen to know anything about the other party's insurance, that helps too.",
    description: "Their own insurance coverage, and the other party's insurance if known.",
  },
  {
    key: "claimFiled",
    label: "Claim already filed",
    seedQuestion:
      "Has a claim already been opened with any insurance company, either yours or theirs? If someone's already reached out to you about this, that's good to know too.",
    description: "Whether an insurance claim has already been opened by either side, and by whom.",
  },
  {
    key: "priorRepresentation",
    label: "Prior representation",
    seedQuestion:
      "One more thing about your case — have you already spoken with another attorney about this, or signed anything with another firm?",
    description: "Whether they've already spoken with or signed anything with another attorney.",
  },
  {
    key: "contactDetails",
    label: "Contact & city",
    seedQuestion:
      "Last thing — so someone from our team can follow up with you within 24 hours, what's the best phone number and email to reach you at, and what city are you in?",
    description:
      "Their phone number, email, and the city they're in — capture however they give it, no need to reformat.",
    skipForDirectEntry: true,
  },
];

export function interpolateQuestion(text: string, values: Record<string, string>): string {
  const firstName = values.clientName?.trim().split(/\s+/)[0];
  return text.replace("{name}", firstName || "there");
}
