import { getClientTool } from "@/app/actions/client-tools";
import { notFound } from "next/navigation";
import { ToolExecutionClient } from "./tool-execution-client";

export default async function ToolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tool = await getClientTool(id);

  if (!tool) {
    notFound();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <ToolExecutionClient tool={tool} />
    </div>
  );
}
