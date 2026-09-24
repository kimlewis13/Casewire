import { notFound } from "next/navigation";
import { getCase } from "@/lib/db";
import { RecordsWorkspace } from "@/components/RecordsWorkspace";
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
        <h2 className="mb-1 font-display text-xl font-semibold">Medical records</h2>
        <p className="mb-4 text-sm text-muted">
          What&rsquo;s on file, what&rsquo;s missing, and what needs a look before drafting.
        </p>
        <RecordsWorkspace record={record} />
      </div>
      <CaseRecordSummary record={record} />
    </div>
  );
}
