import { notFound } from "next/navigation";
import { getCase } from "@/lib/db";
import { IntakeChat } from "@/components/IntakeChat";

export default async function IntakePage({ params }: PageProps<"/case/[id]/intake">) {
  const { id } = await params;
  const record = getCase(id);
  if (!record) notFound();

  return (
    <div>
      <h2 className="mb-1 font-display text-xl font-semibold">Client details</h2>
      <p className="mb-4 text-sm text-muted">
        Vague answers get a follow-up question instead of being recorded as-is.
      </p>
      <IntakeChat record={record} />
    </div>
  );
}
