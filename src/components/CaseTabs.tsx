"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { STAGE_ORDER } from "@/lib/format";
import type { CaseStage } from "@/lib/types";

const TABS = [
  { href: "extraction", label: "Medical records", minStageIndex: 1 },
  { href: "draft", label: "Demand letter", minStageIndex: 2 },
] as const;

export function CaseTabs({ caseId, stage }: { caseId: string; stage: CaseStage }) {
  const pathname = usePathname();
  const stageIndex = STAGE_ORDER.indexOf(stage);
  const visible = TABS.filter((tab) => stageIndex >= tab.minStageIndex);

  if (visible.length === 0) return null;

  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-thin">
      {visible.map((tab) => {
        const href = `/case/${caseId}/${tab.href}`;
        const active = pathname === href;
        return (
          <Link
            key={tab.href}
            href={href}
            className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition ${
              active
                ? "bg-foreground text-background"
                : "text-muted hover:bg-background hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
