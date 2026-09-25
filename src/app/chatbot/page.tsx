import { getCase, CHATBOT_DEMO_CASE_ID } from "@/lib/db";
import { ChatbotDemoView } from "@/components/ChatbotDemoView";

// Reads mutable file-based case data (and changes on every "reset") — must
// not be statically prerendered at build time.
export const dynamic = "force-dynamic";

export default function ChatbotPrototypePage() {
  const record = getCase(CHATBOT_DEMO_CASE_ID);
  if (!record) return null;

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <div className="mb-6 flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted">
          Chatbot prototype
        </span>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Client intake, from the client&rsquo;s side
        </h1>
        <p className="text-sm text-muted">
          This is a walkthrough, not a live feature — in a real deployment this
          conversation would be embedded directly on the firm&rsquo;s own website,
          so a visitor could start it the moment they land on the page after an
          accident. It isn&rsquo;t wired up as an embeddable widget here; it&rsquo;s
          presented on its own page purely to showcase the conversation itself.
          Answer as if you were the client — the same conversation engine and
          the same empathetic scripting are what run inside the tool on the
          intake screen for every case.
        </p>
      </div>

      <ChatbotDemoView record={record} />
    </div>
  );
}
