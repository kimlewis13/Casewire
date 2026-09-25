import Anthropic from "@anthropic-ai/sdk";
import { INTAKE_FIELDS } from "./intakeScript";

const MODEL = "claude-sonnet-5";
const EFFORT = "medium";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

const RECORD_FACTS_TOOL: Anthropic.Tool = {
  name: "record_facts",
  description:
    "Record any of the client's facts that their latest message clearly provides. Only include fields you can confidently fill from what they actually said this turn or earlier in the conversation — omit anything not mentioned or still unclear. You can fill more than one field at once if their message covers more than one thing.",
  input_schema: {
    type: "object",
    properties: Object.fromEntries(
      INTAKE_FIELDS.map((f) => [f.key, { type: "string", description: f.description }])
    ),
    additionalProperties: false,
  },
};

const COMPLETE_INTAKE_TOOL: Anthropic.Tool = {
  name: "complete_intake",
  description:
    "Call this once every fact on the 'still needed' list has been captured and there is nothing left to ask.",
  input_schema: { type: "object", properties: {}, additionalProperties: false },
};

function buildSystemPrompt(captured: Record<string, string>): string {
  const today = new Date().toISOString().slice(0, 10);
  const have = INTAKE_FIELDS.filter((f) => captured[f.key]?.trim());
  const missing = INTAKE_FIELDS.filter((f) => !captured[f.key]?.trim());

  return `You are the intake assistant on a personal injury law firm's website chat. You're talking directly with someone who was recently in an accident — they are likely stressed, in pain, and worried about money. Your job is to have a warm, natural conversation that gathers what the firm needs, without ever feeling like a form.

Today's date is ${today}. When the client gives a relative date ("yesterday," "about two weeks ago," "last month"), resolve it to an exact date yourself before recording it — don't leave it as a relative phrase.

Facts already captured — do not ask about these again, and don't repeat them back as a question:
${have.length ? have.map((f) => `- ${f.label}: ${captured[f.key]}`).join("\n") : "(none yet)"}

Facts still needed:
${missing.length ? missing.map((f) => `- ${f.key}: ${f.description}`).join("\n") : "(none — everything is captured)"}

How to run the conversation:
- The opening message only thanked them for contacting the firm and asked their name — it deliberately does not yet say anything about their accident, since at that point you don't know anything happened. The moment they give their name, that's your first chance to react to why they're really here: greet them by name, say you're sorry this happened to them, and briefly note that nothing they share here commits them to hiring the firm and a real person will follow up with them soon — then flow straight into asking what happened, all in that same reply.
- Acknowledge what they just said, specifically, before moving on. Never just fire the next question with no reaction to what they told you.
- If their message answers something on the "still needed" list — even if it covers more than one thing at once, or answers something out of order — call record_facts with everything you can confidently extract from it.
- Ask about only one remaining thing per message, phrased naturally, like a person talking, not a form field.
- If an answer is genuinely too vague to use, ask ONE natural follow-up. A short but clear answer ("yesterday," "no") is NOT vague and needs no follow-up. Only follow up on real ambiguity ("I don't really remember," "kind of"). If they still can't give more detail after one follow-up, accept what you have and move on — never ask a third time about the same thing.
- The very first time injuries come up, and only once, mention proactively that the firm works on contingency — no cost today, nothing owed unless they win. Don't wait for them to ask.
- When asking about a prior injury to the same body part, frame it as genuinely helpful to know upfront, not an accusation.
- Once every fact on the "still needed" list is captured, call complete_intake. Always include a short, warm closing text alongside that call.
- Never invent or assume a fact. Only record what the client actually said.
- Keep every reply short — a sentence or two, not a paragraph. The one exception is the reply right after they give their name, which can run a little longer since it's carrying the sympathy line and the disclaimer as well as the next question.`;
}

export interface LlmIntakeTurnResult {
  reply: string;
  extracted: Record<string, string>;
  complete: boolean;
}

export async function runIntakeTurn(
  history: { role: "user" | "assistant"; content: string }[],
  captured: Record<string, string>
): Promise<LlmIntakeTurnResult> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1024,
    output_config: { effort: EFFORT },
    system: buildSystemPrompt(captured),
    tools: [RECORD_FACTS_TOOL, COMPLETE_INTAKE_TOOL],
    messages: history,
  });

  let reply = "";
  let extracted: Record<string, string> = {};
  let complete = false;

  for (const block of response.content) {
    if (block.type === "text") {
      reply += block.text;
    } else if (block.type === "tool_use") {
      if (block.name === "record_facts") {
        extracted = { ...extracted, ...(block.input as Record<string, string>) };
      } else if (block.name === "complete_intake") {
        complete = true;
      }
    }
  }

  return { reply: reply.trim(), extracted, complete };
}
