import Link from "next/link";
import { notFound } from "next/navigation";
import { getCase } from "@/lib/db";
import { hoursInStage, isOverdue } from "@/lib/followup";
import { StageBadge } from "@/components/StageBadge";
import { CaseTabs } from "@/components/CaseTabs";
import { formatHoursInStage } from "@/lib/format";

export default async function CaseLayout({
  children,
  params,
}: LayoutProps<"/case/[id]">) {
  const { id } = await params;
  const record = getCase(id);
  if (!record) notFound();

  const overdue = isOverdue(record);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-foreground"
      >
        ← Dashboard
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {record.clientName}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Owner {record.owner} · in stage for {formatHoursInStage(hoursInStage(record))}
            {overdue && (
              <span className="ml-2 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
                past follow-up window
              </span>
            )}
          </p>
        </div>
        <StageBadge stage={record.stage} />
      </div>

      <div className="mb-8 rounded-2xl border border-border bg-surface p-1.5">
        <CaseTabs caseId={id} />
      </div>

      {children}
    </div>
  );
}
