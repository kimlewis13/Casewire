import { notFound } from "next/navigation";
import { getCase } from "@/lib/db";
import { DraftView } from "@/components/DraftView";

export default async function DraftPage({ params }: PageProps<"/case/[id]/draft">) {
  const { id } = await params;
  const record = getCase(id);
  if (!record) notFound();

  return (
    <div>
      <h2 className="mb-4 font-display text-xl font-semibold">Demand letter</h2>
      <DraftView record={record} />
    </div>
  );
}
