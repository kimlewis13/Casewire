"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { InsuranceInfo } from "@/lib/types";

export function InsuranceCard({
  caseId,
  insurance,
  onChange,
}: {
  caseId: string;
  insurance: InsuranceInfo;
  onChange: (insurance: InsuranceInfo) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(insurance);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const hasAnything =
    insurance.atFaultCarrier || insurance.claimNumber || insurance.adjusterName || insurance.healthInsurer;

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/insurance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        onChange(data.case.insurance);
        setEditing(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
          Insurance &amp; liens
        </p>
        <button
          onClick={() => {
            setForm(insurance);
            setEditing((e) => !e);
          }}
          className="text-xs font-semibold text-accent hover:text-accent-2"
        >
          {editing ? "Cancel" : hasAnything ? "Edit" : "Add"}
        </button>
      </div>

      {!editing ? (
        hasAnything ? (
          <div className="flex flex-col gap-2 text-sm">
            <div>
              <p className="text-xs font-semibold text-muted">At-fault carrier</p>
              <p>{insurance.atFaultCarrier || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted">Claim / adjuster</p>
              <p>
                {insurance.claimNumber || "—"}
                {insurance.adjusterName ? ` · ${insurance.adjusterName}` : ""}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted">Health insurer</p>
              <p>{insurance.healthInsurer || "—"}</p>
            </div>
            {insurance.lienExpected && (
              <p className="rounded-md border border-warning/30 bg-warning/10 px-2 py-1 text-xs font-semibold text-warning">
                Subrogation lien expected
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm italic text-muted">Not captured yet.</p>
        )
      ) : (
        <div className="flex flex-col gap-2 text-sm">
          <input
            value={form.atFaultCarrier}
            onChange={(e) => setForm((f) => ({ ...f, atFaultCarrier: e.target.value }))}
            placeholder="At-fault carrier"
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-accent"
          />
          <input
            value={form.claimNumber}
            onChange={(e) => setForm((f) => ({ ...f, claimNumber: e.target.value }))}
            placeholder="Claim number"
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-accent"
          />
          <input
            value={form.adjusterName}
            onChange={(e) => setForm((f) => ({ ...f, adjusterName: e.target.value }))}
            placeholder="Adjuster name"
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-accent"
          />
          <input
            value={form.healthInsurer}
            onChange={(e) => setForm((f) => ({ ...f, healthInsurer: e.target.value }))}
            placeholder="Health insurer"
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-accent"
          />
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={form.lienExpected}
              onChange={(e) => setForm((f) => ({ ...f, lienExpected: e.target.checked }))}
            />
            Subrogation lien expected
          </label>
          <button
            onClick={save}
            disabled={saving}
            className="mt-1 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}
