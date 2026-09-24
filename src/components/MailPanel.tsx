"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CaseRecord } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function MailPanel({
  record,
  onChange,
  disabledReason,
}: {
  record: CaseRecord;
  onChange: (updated: CaseRecord) => void;
  /** When set, the "ready to send" state shows this instead of an active button. */
  disabledReason?: string | null;
}) {
  const router = useRouter();
  const [showSendForm, setShowSendForm] = useState(false);
  const [showDeliverForm, setShowDeliverForm] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [signedBy, setSignedBy] = useState("");
  const [deliveredAt, setDeliveredAt] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmSend() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${record.id}/mail/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't send");
      onChange(data.case);
      setShowSendForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelivery() {
    setBusy(true);
    setError(null);
    try {
      const proofImageDataUrl = proofFile ? await readFileAsDataUrl(proofFile) : undefined;
      const res = await fetch(`/api/cases/${record.id}/mail/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signedBy,
          deliveredAt: deliveredAt ? new Date(deliveredAt).toISOString() : undefined,
          proofImageDataUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't record delivery");
      onChange(data.case);
      setShowDeliverForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (record.mail.status === "delivered") {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 p-4">
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-success">Delivered</p>
        <p className="text-sm">
          Signed for {record.mail.signedBy ? `by ${record.mail.signedBy} ` : ""}
          on {formatDateTime(record.mail.deliveredAt)}.
        </p>
        <p className="mt-1 text-xs text-muted">Sent {formatDateTime(record.mail.sentAt)}</p>
        {record.mail.trackingNumber && (
          <p className="mt-1 text-xs text-muted">Tracking: {record.mail.trackingNumber}</p>
        )}
        {record.mail.proofImageDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={record.mail.proofImageDataUrl}
            alt="Delivery confirmation slip"
            className="mt-3 max-h-56 rounded-md border border-border object-contain"
          />
        )}
      </div>
    );
  }

  if (record.mail.status === "sent") {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-accent-2">
          Sent — awaiting delivery
        </p>
        <p className="text-sm">Sent via certified mail on {formatDateTime(record.mail.sentAt)}.</p>
        {record.mail.trackingNumber && (
          <p className="mt-1 text-xs text-muted">Tracking: {record.mail.trackingNumber}</p>
        )}

        {!showDeliverForm ? (
          <button
            onClick={() => setShowDeliverForm(true)}
            className="mt-3 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-semibold transition hover:border-accent hover:text-accent"
          >
            Mark as delivered
          </button>
        ) : (
          <div className="mt-3 flex flex-col gap-3 rounded-md border border-border bg-background p-3">
            <label className="flex flex-col gap-1 text-sm">
              Delivered on
              <input
                type="datetime-local"
                value={deliveredAt}
                onChange={(e) => setDeliveredAt(e.target.value)}
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Signed by (from the green card, optional)
              <input
                value={signedBy}
                onChange={(e) => setSignedBy(e.target.value)}
                placeholder="e.g. J. Ortiz"
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Photo of the delivery slip (optional)
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
            </label>
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={confirmDelivery}
                disabled={busy}
                className="rounded-md bg-foreground px-3 py-1.5 text-sm font-semibold text-background disabled:opacity-60"
              >
                {busy ? "Saving…" : "Confirm delivery"}
              </button>
              <button
                onClick={() => setShowDeliverForm(false)}
                className="rounded-md px-3 py-1.5 text-sm font-semibold text-muted hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">Ready to send</p>
      <p className="text-sm text-muted">
        Demand letters go out certified mail, return receipt requested.
      </p>

      {disabledReason ? (
        <p className="mt-3 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
          {disabledReason}
        </p>
      ) : !showSendForm ? (
        <button
          onClick={() => setShowSendForm(true)}
          className="mt-3 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:brightness-110"
        >
          Send via certified mail
        </button>
      ) : (
        <div className="mt-3 flex flex-col gap-3 rounded-md border border-border bg-background p-3">
          <label className="flex flex-col gap-1 text-sm">
            Tracking number (optional, from the post office receipt)
            <input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="9407 3000 0000 0000 0000 00"
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={confirmSend}
              disabled={busy}
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground disabled:opacity-60"
            >
              {busy ? "Sending…" : "Confirm sent"}
            </button>
            <button
              onClick={() => setShowSendForm(false)}
              className="rounded-md px-3 py-1.5 text-sm font-semibold text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
