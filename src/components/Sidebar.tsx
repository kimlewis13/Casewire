import Link from "next/link";

export function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-border bg-surface px-4 py-5">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-accent-foreground text-sm font-bold">
          C
        </span>
        <span className="font-display text-base font-semibold tracking-tight">
          Casewire
        </span>
      </Link>

      <nav className="flex flex-col gap-1">
        <Link
          href="/"
          className="rounded-md bg-background px-3 py-2 text-sm font-semibold text-foreground"
        >
          Dashboard
        </Link>
      </nav>

      <div className="mt-auto text-[10px] font-medium text-muted">Prototype</div>
    </aside>
  );
}
