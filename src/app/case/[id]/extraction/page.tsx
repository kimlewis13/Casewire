import { notFound } from "next/navigation";
import { getCase } from "@/lib/db";
import { ExtractionWorkspace } from "@/components/ExtractionWorkspace";
import { CaseRecordSummary } from "@/components/CaseRecordSummary";

export default async function ExtractionPage({
  params,
}: PageProps<"/case/[id]/extraction">) {
  const { id } = await params;
  const record = getCase(id);
  if (!record) notFound();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <h2 className="mb-1 font-display text-xl font-semibold">Document extraction</h2>
        <p className="mb-4 text-sm text-muted">
          Pull a structured chronology out of the medical record, and surface
          anything that looks missing or inconsistent.
        </p>
        <ExtractionWorkspace record={record} />
      </div>
      <CaseRecordSummary record={record} />
    </div>
  );
}
