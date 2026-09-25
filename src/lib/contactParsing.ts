const EMAIL_REGEX = /[\w.+-]+@[\w-]+\.[A-Za-z]{2,}/;
const PHONE_REGEX = /(\+?\d[\d\s().-]{7,}\d)/;
const NOISE_WORDS = /\b(and|in|is|my|email|phone|number|reach|me|at|the|city|im|i'm)\b/gi;

/**
 * Best-effort extraction from a single free-text answer like "you can reach
 * me at 555-0100 or sarah@email.com, I'm in Denver" — this intentionally
 * isn't a strict validator (the point of asking for phone/email/city in one
 * conversational question is not making it feel like three form fields).
 */
export function parseContactDetails(text: string): { email: string; phone: string; city: string } {
  const emailMatch = text.match(EMAIL_REGEX);
  const phoneMatch = text.match(PHONE_REGEX);

  let remainder = text;
  if (emailMatch) remainder = remainder.replace(emailMatch[0], " ");
  if (phoneMatch) remainder = remainder.replace(phoneMatch[0], " ");
  remainder = remainder
    .replace(NOISE_WORDS, " ")
    .replace(/[.,;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    email: emailMatch ? emailMatch[0] : "",
    phone: phoneMatch ? phoneMatch[0].trim() : "",
    city: remainder,
  };
}
