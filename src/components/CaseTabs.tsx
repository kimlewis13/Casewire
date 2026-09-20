"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "intake", label: "1. Intake" },
  { href: "extraction", label: "2. Documents" },
  { href: "draft", label: "3. Demand draft" },
  { href: "status", label: "4. Status" },
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
