import { readDb } from "@/lib/db";
import { sortActions } from "@/lib/actions";
import { CaseCard } from "@/components/CaseCard";
import { ActionQueue } from "@/components/ActionQueue";
import { NewCaseForm } from "@/components/NewCaseForm";
import { RunFollowUpCheck } from "@/components/RunFollowUpCheck";

export default function DashboardPage() {
  const { cases } = readDb();
  const queue = sortActions(cases);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-8 flex flex-col gap-1">
        <span className="text-sm font-semibold uppercase tracking-widest text-accent-2">
          Your queue
        </span>
        <h1 className="font-display text-4xl font-bold tracking-tight">
          Here&rsquo;s what needs you today.
        </h1>
        <p className="max-w-2xl text-muted">
          The system tracks where every case sits so you don&rsquo;t have to
          — nothing here got re-typed between client intake, the medical
          records, and the demand letter.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <NewCaseForm />
        <RunFollowUpCheck />
      </div>

      <ActionQueue items={queue} />

      <div className="mb-4 mt-12 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">All cases</h2>
        <span className="text-sm text-muted">{cases.length} total</span>
      </div>

      {cases.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted">
          No cases yet — start one above.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => (
            <CaseCard key={c.id} record={c} />
          ))}
        </div>
      )}
    </div>
  );
}
