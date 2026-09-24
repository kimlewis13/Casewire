import { notFound } from "next/navigation";
import { getCase } from "@/lib/db";
import { CaseHeader } from "@/components/CaseHeader";
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
        <div className="flex flex-col gap-6">{children}</div>
        <CaseRail record={record} />
      </div>
    </div>
  );
}
