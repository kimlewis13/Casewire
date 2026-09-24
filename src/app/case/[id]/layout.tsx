import { notFound } from "next/navigation";
import { getCase } from "@/lib/db";
import { CaseHeader } from "@/components/CaseHeader";
import { CaseTabs } from "@/components/CaseTabs";
import { CaseRail } from "@/components/CaseRail";

export default async function CaseLayout({
  children,
  params,
}: LayoutProps<"/case/[id]">) {
  const { id } = await params;
  const record = getCase(id);
  if (!record) notFound();

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <CaseHeader record={record} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {record.stage !== "intake" && (
            <div className="mb-6 rounded-lg border border-border bg-surface p-1.5">
              <CaseTabs caseId={id} stage={record.stage} />
            </div>
          )}
          {children}
        </div>
        <CaseRail record={record} />
      </div>
    </div>
  );
}
