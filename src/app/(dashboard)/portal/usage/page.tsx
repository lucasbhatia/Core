import { getToolUsageLogs, getUsageStats } from "@/app/actions/tool-usage";
import { getCurrentUserProfile } from "@/app/actions/user-profiles";
import { redirect } from "next/navigation";
import { UsageClient } from "./usage-client";

export default async function UsagePage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const [logs, stats] = await Promise.all([
    getToolUsageLogs({ limit: 50 }),
    getUsageStats(),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Usage Analytics</h2>
        <p className="text-muted-foreground">
          Track your tool usage and performance metrics
        </p>
      </div>

      <UsageClient logs={logs} stats={stats} profile={profile} />
    </div>
  );
}
