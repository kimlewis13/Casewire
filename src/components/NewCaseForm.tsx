"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewCaseForm() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: formData.get("clientName"),
          contactEmail: formData.get("contactEmail"),
          contactPhone: formData.get("contactPhone"),
          owner: formData.get("owner"),
          followUpWindowHours: formData.get("followUpWindowHours"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create case");
      router.push(`/case/${data.case.id}/intake`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition hover:brightness-105 active:scale-[0.98]"
      >
        + New case
      </button>
    );
  }

  return (
    <form
      action={handleSubmit}
      className="w-full max-w-xl rounded-2xl border border-border bg-surface p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">Start a new case</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Client name
          <input
            name="clientName"
            required
            placeholder="e.g. Jamie Torres"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Contact email
          <input
            name="contactEmail"
            type="email"
            placeholder="jamie@example.com"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Contact phone
          <input
            name="contactPhone"
            placeholder="+1 555 555 0100"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Owner
          <input
            name="owner"
            defaultValue="You (paralegal)"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Follow-up window (hours)
          <input
            name="followUpWindowHours"
            type="number"
            min={1}
            defaultValue={48}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent-2"
          />
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:brightness-110 disabled:opacity-60"
      >
        {submitting ? "Creating…" : "Create & start intake"}
      </button>
    </form>
  );
}
