"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FIRM_NAME } from "@/lib/firm";

const CASE_SECTIONS = [
  { href: "#intake", label: "Client intake" },
  { href: "#records", label: "Medical records" },
  { href: "#letter", label: "Demand letter" },
  { href: "#notes", label: "Notes & activity" },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const onCasePage = pathname?.startsWith("/case/");

  return (
    <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-border bg-surface px-4 py-5">
      <Link href="/" className="mb-1 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-accent-foreground text-sm font-bold">
          C
        </span>
        <span className="font-display text-base font-semibold tracking-tight">
          Casewire
        </span>
      </Link>
      <p className="mb-7 text-xs text-muted">{FIRM_NAME}</p>

      <nav className="flex flex-col gap-1">
        <Link
          href="/"
          className={`rounded-md px-3 py-2 text-sm font-semibold ${
            pathname === "/" ? "bg-background text-foreground" : "text-muted hover:bg-background hover:text-foreground"
          }`}
        >
          Chatbot prototype
        </Link>
        <Link
          href="/dashboard"
          className={`rounded-md px-3 py-2 text-sm font-semibold ${
            pathname === "/dashboard" ? "bg-background text-foreground" : "text-muted hover:bg-background hover:text-foreground"
          }`}
        >
          Dashboard
        </Link>
      </nav>

      {onCasePage && (
        <>
          <p className="mb-1 mt-6 px-3 text-xs font-semibold uppercase tracking-widest text-muted">
            On this case
          </p>
          <nav className="flex flex-col gap-1">
            {CASE_SECTIONS.map((s) => (
              <a
                key={s.href}
                href={s.href}
                className="rounded-md px-3 py-2 text-sm text-muted hover:bg-background hover:text-foreground"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </>
      )}

      <div className="mt-auto text-[10px] font-medium text-muted">Prototype</div>
    </aside>
  );
}
