import { notFound } from "next/navigation";
import { getCase } from "@/lib/db";
import { IntakeChat } from "@/components/IntakeChat";
import { DirectEntryForm } from "@/components/DirectEntryForm";
import { RecordsWorkspace } from "@/components/RecordsWorkspace";
import { DraftView } from "@/components/DraftView";
import { CaseTimeline } from "@/components/CaseTimeline";
import { LockedSection } from "@/components/LockedSection";
import { STAGE_ORDER } from "@/lib/format";

export default async function CaseDetailPage({ params }: PageProps<"/case/[id]">) {
  const { id } = await params;
  const record = getCase(id);
  if (!record) notFound();

  const stageIndex = STAGE_ORDER.indexOf(record.stage);

  return (
    <>
      <section>
        <h2 className="mb-4 font-display text-xl font-semibold">Client intake</h2>
        {record.stage === "intake" ? (
          record.source === "chatbot" ? (
            <IntakeChat record={record} />
          ) : (
            <DirectEntryForm record={record} />
          )
        ) : (
          <div className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
            Complete — see Case facts and Source in the panel.
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold">Medical records</h2>
        {stageIndex < 1 ? (
          <LockedSection message="Available once client intake is complete." />
        ) : (
          <RecordsWorkspace record={record} />
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold">Demand letter</h2>
        {stageIndex < 2 ? (
          <LockedSection message="Available once medical records are added." />
        ) : (
          <DraftView record={record} />
        )}
      </section>

      <section>
        <CaseTimeline caseId={id} notes={record.notes} />
      </section>
    </>
  );
}
