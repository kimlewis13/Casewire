import Link from "next/link";

export function NavBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-accent-foreground font-display text-lg font-bold">
            C
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Casewire
          </span>
          <span className="hidden rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted sm:inline">
            prototype
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/" className="text-muted transition hover:text-foreground">
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
