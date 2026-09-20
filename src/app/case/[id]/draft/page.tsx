import { notFound } from "next/navigation";
import { getCase } from "@/lib/db";
import { DraftView } from "@/components/DraftView";
import { CaseRecordSummary } from "@/components/CaseRecordSummary";

export default async function DraftPage({ params }: PageProps<"/case/[id]/draft">) {
  const { id } = await params;
  const record = getCase(id);
  if (!record) notFound();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <h2 className="mb-1 font-display text-xl font-semibold">Demand draft</h2>
        <p className="mb-4 text-sm text-muted">
          Generated straight from the intake record and the extracted
          chronology — not generic boilerplate.
        </p>
        <DraftView record={record} />
      </div>
      <CaseRecordSummary record={record} />
    </div>
  );
}
