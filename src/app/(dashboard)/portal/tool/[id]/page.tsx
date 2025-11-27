import { getClientTool } from "@/app/actions/client-tools";
import { getCurrentUserProfile } from "@/app/actions/user-profiles";
import { redirect, notFound } from "next/navigation";
import { ToolExecutionClient } from "./tool-execution-client";

export default async function ToolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const tool = await getClientTool(id);

  if (!tool) {
    notFound();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <ToolExecutionClient tool={tool} profile={profile} />
    </div>
  );
}
