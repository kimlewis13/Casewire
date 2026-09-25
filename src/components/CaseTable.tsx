"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CaseRecord } from "@/lib/types";
import { StageBadge } from "@/components/StageBadge";
import { formatHoursInStage, STAGE_ORDER } from "@/lib/format";
import { hoursInStage, isOverdue } from "@/lib/followupCore";

type SortKey = "client" | "stage" | "owner" | "timeInStage" | "followUp";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "client", label: "Client" },
  { key: "stage", label: "Stage" },
  { key: "owner", label: "Owner" },
  { key: "timeInStage", label: "Time in stage" },
  { key: "followUp", label: "Follow-up window" },
];

export function CaseTable({ records }: { records: CaseRecord[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("timeInStage");
  const [asc, setAsc] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete(e: React.MouseEvent, record: CaseRecord) {
    e.stopPropagation();
    if (!window.confirm(`Delete ${record.clientName}'s case? This can't be undone.`)) return;
    setDeletingId(record.id);
    try {
      await fetch(`/api/cases/${record.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setAsc((a) => !a);
    } else {
      setSortKey(key);
      setAsc(true);
    }
  }

  const sorted = useMemo(() => {
    const withValues = records.map((r) => ({
      record: r,
      client: r.clientName,
      stage: STAGE_ORDER.indexOf(r.stage),
      owner: r.owner,
      timeInStage: hoursInStage(r),
      followUp: r.followUpWindowHours,
    }));
    withValues.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return asc ? cmp : -cmp;
    });
    return withValues.map((v) => v.record);
  }, [records, sortKey, asc]);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-background text-xs uppercase tracking-wide text-muted">
            {COLUMNS.map((col) => (
              <th key={col.key} className="px-4 py-2.5 font-semibold">
                <button
                  onClick={() => toggleSort(col.key)}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  {col.label}
                  {sortKey === col.key && <span>{asc ? "↑" : "↓"}</span>}
                </button>
              </th>
            ))}
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((record) => {
            const overdue = isOverdue(record);
            return (
              <tr
                key={record.id}
                onClick={() => router.push(`/case/${record.id}`)}
                className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-background"
              >
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
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => handleDelete(e, record)}
                    disabled={deletingId === record.id}
                    className="text-xs font-semibold text-muted hover:text-danger disabled:opacity-50"
                  >
                    {deletingId === record.id ? "Deleting…" : "Delete"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
