import Link from "next/link";
import { notFound } from "next/navigation";
import { getCase } from "@/lib/db";
import { CaseHeader } from "@/components/CaseHeader";
import { CaseTabs } from "@/components/CaseTabs";

export default async function CaseLayout({
  children,
  params,
}: LayoutProps<"/case/[id]">) {
  const { id } = await params;
  const record = getCase(id);
  if (!record) notFound();

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-foreground"
      >
        ← Dashboard
      </Link>

      <CaseHeader record={record} />

      <div className="mb-8 rounded-2xl border border-border bg-surface p-1.5">
        <CaseTabs caseId={id} />
      </div>

      {children}
    </div>
  );
}
