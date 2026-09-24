import { notFound } from "next/navigation";
import { getCase } from "@/lib/db";
import { RecordsWorkspace } from "@/components/RecordsWorkspace";

export default async function ExtractionPage({
  params,
}: PageProps<"/case/[id]/extraction">) {
  const { id } = await params;
  const record = getCase(id);
  if (!record) notFound();

  return (
    <div>
      <h2 className="mb-4 font-display text-xl font-semibold">Medical records</h2>
      <RecordsWorkspace record={record} />
    </div>
  );
}
