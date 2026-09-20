import { redirect, notFound } from "next/navigation";
import { getCase } from "@/lib/db";

const STAGE_TO_TAB: Record<string, string> = {
  intake: "intake",
  extraction: "extraction",
  draft: "draft",
  tracking: "status",
};

export default async function CaseIndexPage({ params }: PageProps<"/case/[id]">) {
  const { id } = await params;
  const record = getCase(id);
  if (!record) notFound();
  redirect(`/case/${id}/${STAGE_TO_TAB[record.stage]}`);
}
