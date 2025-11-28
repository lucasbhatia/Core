"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Inbox, Clock, CheckCircle, Archive, Loader2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { getSystemSubmissions, updateSubmissionStatus } from "@/app/actions/system-data";
import { formatDateTime } from "@/lib/utils";
import type { SystemData } from "@/types/database";

interface SubmissionsViewProps {
  systemId: string;
  systemTitle: string;
}

export function SubmissionsView({ systemId, systemTitle }: SubmissionsViewProps) {
  const [submissions, setSubmissions] = useState<SystemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadSubmissions() {
    setLoading(true);
    try {
      const data = await getSystemSubmissions(systemId);
      setSubmissions(data);
    } catch (error) {
      console.error("Failed to load submissions:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubmissions();
  }, [systemId]);

  async function handleStatusChange(id: string, status: "active" | "processed" | "archived") {
    try {
      await updateSubmissionStatus(id, status);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s))
      );
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  }

  const statusColors: Record<string, string> = {
    active: "bg-blue-100 text-blue-700",
    processed: "bg-green-100 text-green-700",
    archived: "bg-gray-100 text-gray-700",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    active: <Clock className="w-3 h-3" />,
    processed: <CheckCircle className="w-3 h-3" />,
    archived: <Archive className="w-3 h-3" />,
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Inbox className="w-4 h-4" />
              Client Submissions ({submissions.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Form submissions from clients using this system
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={loadSubmissions}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p>No submissions yet</p>
            <p className="text-xs mt-1">
              Submissions will appear here when clients use this system
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="border rounded-lg overflow-hidden"
              >
                {/* Header */}
                <button
                  onClick={() =>
                    setExpandedId(expandedId === submission.id ? null : submission.id)
                  }
                  className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={statusColors[submission.status]}
                    >
                      {statusIcons[submission.status]}
                      <span className="ml-1 capitalize">{submission.status}</span>
                    </Badge>
                    <span className="text-sm font-medium">
                      {submission.action_id}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(submission.created_at)}
                    </span>
                  </div>
                  {expandedId === submission.id ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                {/* Expanded Content */}
                {expandedId === submission.id && (
                  <div className="p-3 space-y-3 border-t">
                    {/* Form Data */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Submitted Data:
                      </p>
                      <div className="bg-muted/50 rounded p-2 text-sm">
                        {Object.entries(submission.data).map(([key, value]) => (
                          <div key={key} className="flex gap-2">
                            <span className="font-medium capitalize">
                              {key.replace(/_/g, " ")}:
                            </span>
                            <span className="text-muted-foreground">
                              {String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Response */}
                    {submission.ai_result && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          AI Response:
                        </p>
                        <div className="bg-blue-50 dark:bg-blue-950/30 rounded p-2 text-sm">
                          {typeof submission.ai_result === "object" &&
                          "response" in submission.ai_result
                            ? String(submission.ai_result.response)
                            : JSON.stringify(submission.ai_result)}
                        </div>
                      </div>
                    )}

                    {/* Status Update */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        Update status:
                      </span>
                      <Select
                        value={submission.status}
                        onValueChange={(value) =>
                          handleStatusChange(
                            submission.id,
                            value as "active" | "processed" | "archived"
                          )
                        }
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="processed">Processed</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
