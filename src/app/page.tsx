import { readDb } from "@/lib/db";
import { sortActions } from "@/lib/actions";
import { CaseTable } from "@/components/CaseTable";
import { ActionQueue } from "@/components/ActionQueue";
import { NewCaseForm } from "@/components/NewCaseForm";

export default function DashboardPage() {
  const { cases } = readDb();
  const queue = sortActions(cases);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-8 flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted">
          Your queue
        </span>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Today&rsquo;s priorities
        </h1>
      </div>

      <div className="mb-4">
        <NewCaseForm />
      </div>

      <ActionQueue items={queue} />

      <div className="mb-3 mt-12 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          All cases
        </h2>
        <span className="text-sm text-muted">{cases.length} total</span>
      </div>

      {cases.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-muted">
          No cases yet — start one above.
        </p>
      ) : (
        <CaseTable records={cases} />
      )}
    </div>
  );
}
