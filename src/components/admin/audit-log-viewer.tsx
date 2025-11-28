"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  History,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  User,
  FolderKanban,
  Zap,
  Settings,
  CreditCard,
  Users,
  Plug,
  Key,
  AlertTriangle,
  Info,
  AlertCircle,
  Loader2,
  Download,
} from "lucide-react";
import type { AdminAuditLog, AuditResourceType, AuditSeverity } from "@/types/database";
import { formatDateTime } from "@/lib/utils";

const resourceIcons: Record<AuditResourceType, React.ElementType> = {
  client: User,
  project: FolderKanban,
  automation: Zap,
  settings: Settings,
  billing: CreditCard,
  team: Users,
  integration: Plug,
  api_key: Key,
  user: User,
};

const severityIcons: Record<AuditSeverity, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
};

const severityColors: Record<AuditSeverity, string> = {
  info: "text-blue-500 bg-blue-500/10",
  warning: "text-yellow-500 bg-yellow-500/10",
  critical: "text-red-500 bg-red-500/10",
};

interface AuditLogResponse {
  logs: AdminAuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AuditLogViewer() {
  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [resourceType, setResourceType] = useState<string>("all");
  const [severity, setSeverity] = useState<string>("all");

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (resourceType && resourceType !== "all") params.set("resource_type", resourceType);
      if (severity && severity !== "all") params.set("severity", severity);

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, resourceType, severity]);

  const handleSearch = () => {
    setPage(1);
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Audit Log</h2>
          <p className="text-muted-foreground">
            Track all administrative actions and changes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="icon" onClick={fetchLogs} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={resourceType} onValueChange={setResourceType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Resource Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="automation">Automation</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="team">Team</SelectItem>
                <SelectItem value="integration">Integration</SelectItem>
                <SelectItem value="api_key">API Key</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Activity History
          </CardTitle>
          <CardDescription>
            {data?.pagination.total || 0} total entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data?.logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.logs.map((log) => {
                  const ResourceIcon = resourceIcons[log.resource_type] || Info;
                  const SeverityIcon = severityIcons[log.severity];
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDateTime(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm">{log.user_email || "System"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ResourceIcon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium capitalize">{log.resource_type}</p>
                            {log.resource_name && (
                              <p className="text-xs text-muted-foreground">{log.resource_name}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                        {log.description || "-"}
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${severityColors[log.severity]}`}>
                          <SeverityIcon className="h-3 w-3" />
                          <span className="capitalize">{log.severity}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page === data.pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
