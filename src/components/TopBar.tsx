"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CaseAlert, Mention } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

type Notification =
  | ({ kind: "mention" } & Mention)
  | ({ kind: "case_alert" } & CaseAlert);

export function TopBar() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [mentionsRes, alertsRes] = await Promise.all([
          fetch("/api/mentions"),
          fetch("/api/case-alerts"),
        ]);
        const mentionsData = await mentionsRes.json();
        const alertsData = await alertsRes.json();
        if (cancelled) return;

        const mentions: Notification[] = (mentionsData.mentions ?? []).map((m: Mention) => ({
          kind: "mention" as const,
          ...m,
        }));
        const alerts: Notification[] = (alertsData.alerts ?? []).map((a: CaseAlert) => ({
          kind: "case_alert" as const,
          ...a,
        }));
        const merged = [...mentions, ...alerts].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setItems(merged);
        setUnread(merged.filter((i) => !i.read).length);
      } catch {
        // background convenience poll — ignore failures
      }
    }
    load();
    const interval = setInterval(load, 30_000);
    window.addEventListener("casewire:mentions-updated", load);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("casewire:mentions-updated", load);
    };
  }, []);

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      setItems((prev) => prev.map((i) => ({ ...i, read: true })));
      fetch("/api/mentions/read-all", { method: "POST" }).catch(() => {});
      fetch("/api/case-alerts/read-all", { method: "POST" }).catch(() => {});
    }
  }

  return (
    <div className="flex justify-end border-b border-border bg-surface px-5 py-2.5">
      <div className="relative">
        <button
          onClick={toggleOpen}
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-background hover:text-foreground"
          aria-label="Notifications"
        >
          <svg
            aria-hidden
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 8a5 5 0 0 1 10 0c0 3.2 1 4.8 1.5 5.5H3.5C4 12.8 5 11.2 5 8Z" />
            <path d="M8.2 16a1.8 1.8 0 0 0 3.6 0" />
          </svg>
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-10 z-30 w-80 rounded-lg border border-border bg-surface shadow-lg">
            <p className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted">
              Notifications
            </p>
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted">No notifications yet.</p>
            ) : (
              <ul className="max-h-96 overflow-y-auto scrollbar-thin">
                {items.map((item) => (
                  <li key={item.id} className="border-b border-border/60 px-4 py-3 text-sm last:border-0">
                    <Link
                      href={item.kind === "mention" ? `/case/${item.caseId}#notes` : `/case/${item.caseId}`}
                      onClick={() => setOpen(false)}
                      className="block hover:text-accent"
                    >
                      {item.kind === "mention" ? (
                        <>
                          <p className="text-xs text-muted">
                            {formatDateTime(item.createdAt)} · {item.mentionedBy} tagged {item.targetPerson}
                          </p>
                          <p className="mt-0.5 font-semibold">{item.clientName}</p>
                          <p className="mt-0.5 line-clamp-2 text-muted">{item.noteText}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-muted">
                            {formatDateTime(item.createdAt)} · New case from the chatbot
                          </p>
                          <p className="mt-0.5 font-semibold">{item.clientName}</p>
                        </>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
