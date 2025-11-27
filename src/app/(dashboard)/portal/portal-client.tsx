"use client";

import { ClientTool } from "@/types/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wand2, FileText, LayoutDashboard, Workflow, ArrowRight } from "lucide-react";
import Link from "next/link";

const toolTypeIcons: Record<string, typeof Wand2> = {
  ai_generator: Wand2,
  workflow: Workflow,
  form: FileText,
  dashboard: LayoutDashboard,
};

interface PortalClientProps {
  tools: ClientTool[];
}

export function PortalClient({ tools }: PortalClientProps) {
  if (tools.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Wand2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No tools available</h3>
          <p className="text-muted-foreground text-center mt-1 max-w-md">
            Create tools in the Tool Builder to see them here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => {
        const Icon = toolTypeIcons[tool.tool_type] || Wand2;
        return (
          <Link key={tool.id} href={`/portal/tool/${tool.id}`}>
            <Card className="hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardTitle className="mt-4">{tool.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {tool.description || "No description available"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {tool.input_fields?.length || 0} input fields
                  </Badge>
                  {tool.client && (
                    <span className="text-xs text-muted-foreground">
                      {tool.client.company}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
