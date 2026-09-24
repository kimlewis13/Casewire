import Link from "next/link";
import type { CaseRecord } from "@/lib/types";
import { StageBadge } from "@/components/StageBadge";
import { formatHoursInStage } from "@/lib/format";
import { hoursInStage, isOverdue } from "@/lib/followup";

export function CaseTable({ records }: { records: CaseRecord[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-background text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-2.5 font-semibold">Client</th>
            <th className="px-4 py-2.5 font-semibold">Stage</th>
            <th className="px-4 py-2.5 font-semibold">Owner</th>
            <th className="px-4 py-2.5 font-semibold">Time in stage</th>
            <th className="px-4 py-2.5 font-semibold">Follow-up window</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const overdue = isOverdue(record);
            return (
              <tr key={record.id} className="border-b border-border/60 last:border-0 hover:bg-background">
                <td className="px-4 py-3">
                  <Link href={`/case/${record.id}`} className="font-semibold hover:text-accent">
                    {record.clientName}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StageBadge record={record} />
                </td>
                <td className="px-4 py-3 text-muted">{record.owner}</td>
                <td className={`px-4 py-3 ${overdue ? "font-semibold text-danger" : "text-muted"}`}>
                  {formatHoursInStage(hoursInStage(record))}
                  {overdue && " · overdue"}
                </td>
                <td className="px-4 py-3 text-muted">{record.followUpWindowHours}h</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
