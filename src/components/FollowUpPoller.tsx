"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import type { FollowUpCheckResult } from "@/lib/followup";

const POLL_INTERVAL_MS = 45_000;

export function FollowUpPoller() {
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/tracker/check", { method: "POST" });
        const data: { results?: FollowUpCheckResult[] } = await res.json();
        if (cancelled) return;

        const triggered = (data.results ?? []).filter((r) => r.log);
        if (triggered.length > 0) {
          triggered.forEach((r) => {
            showToast({
              title: `${r.clientName} needs follow-up`,
              description: "Past its follow-up window — an alert just went out.",
              tone: "danger",
            });
          });
          router.refresh();
        }
      } catch {
        // Background convenience check — fail silently rather than
        // surface a network blip to the user.
      }
    }

    check();
    const interval = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [router, showToast]);

  return null;
}
