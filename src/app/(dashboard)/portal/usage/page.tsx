import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default async function UsagePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Usage Analytics</h2>
        <p className="text-muted-foreground">
          Track your tool usage and performance metrics
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Coming Soon</h3>
          <p className="text-muted-foreground text-center mt-1">
            Usage analytics will be available once tools are being used.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
