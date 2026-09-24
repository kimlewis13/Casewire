import { redirect, notFound } from "next/navigation";
import { getCase } from "@/lib/db";
import { IntakeChat } from "@/components/IntakeChat";
import { DirectEntryForm } from "@/components/DirectEntryForm";

export default async function CaseIndexPage({ params }: PageProps<"/case/[id]">) {
  const { id } = await params;
  const record = getCase(id);
  if (!record) notFound();

  if (record.stage !== "intake") {
    redirect(`/case/${id}/${record.stage === "extraction" ? "extraction" : "draft"}`);
  }

  return (
    <div>
      <h2 className="mb-4 font-display text-xl font-semibold">Client intake</h2>
      {record.source === "chatbot" ? (
        <IntakeChat record={record} />
      ) : (
        <DirectEntryForm record={record} />
      )}
    </div>
  );
}
