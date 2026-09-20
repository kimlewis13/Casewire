import { readDb } from "@/lib/db";
import { CaseCard } from "@/components/CaseCard";
import { NewCaseForm } from "@/components/NewCaseForm";
import { RunFollowUpCheck } from "@/components/RunFollowUpCheck";

export default function DashboardPage() {
  const { cases } = readDb();

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-8 flex flex-col gap-1">
        <span className="text-sm font-semibold uppercase tracking-widest text-accent-2">
          Status tracker
        </span>
        <h1 className="font-display text-4xl font-bold tracking-tight">
          Every case, one spine.
        </h1>
        <p className="max-w-2xl text-muted">
          Intake, document extraction, and demand drafting all read and write
          the same case record. Nothing gets re-typed between stages — and a
          case that sits too long gets flagged here, not silently forgotten.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <NewCaseForm />
        <RunFollowUpCheck />
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
