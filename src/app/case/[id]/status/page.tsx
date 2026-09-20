import { notFound } from "next/navigation";
import { getCase } from "@/lib/db";
import { hoursInStage, isOverdue } from "@/lib/followup";
import { StatusPanel } from "@/components/StatusPanel";
import { CaseRecordSummary } from "@/components/CaseRecordSummary";

export default async function StatusPage({ params }: PageProps<"/case/[id]/status">) {
  const { id } = await params;
  const record = getCase(id);
  if (!record) notFound();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <h2 className="mb-1 font-display text-xl font-semibold">Status</h2>
        <p className="mb-4 text-sm text-muted">
          Where this case sits, how long it&rsquo;s been there, and what
          happens when it sits too long.
        </p>
        <StatusPanel record={record} hours={hoursInStage(record)} overdue={isOverdue(record)} />
      </div>
      <CaseRecordSummary record={record} />
    </div>
  );
}
