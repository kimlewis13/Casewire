"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "intake", label: "Client details" },
  { href: "extraction", label: "Medical records" },
  { href: "draft", label: "Demand letter" },
] as const;

export function CaseTabs({ caseId }: { caseId: string }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-thin">
      {TABS.map((tab) => {
        const href = `/case/${caseId}/${tab.href}`;
        const active = pathname === href;
        return (
          <Link
            key={tab.href}
            href={href}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
              active
                ? "bg-foreground text-background"
                : "text-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
