import Link from "next/link";

export function NavBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-accent-foreground text-sm font-bold">
            C
          </span>
          <span className="font-display text-base font-semibold tracking-tight">
            Casewire
          </span>
          <span className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted sm:inline">
            Prototype
          </span>
        </Link>
      </div>
    </header>
  );
}
