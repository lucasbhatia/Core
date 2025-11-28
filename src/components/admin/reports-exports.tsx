"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Download,
  Plus,
  Calendar,
  Clock,
  RefreshCw,
  Loader2,
  FileSpreadsheet,
  FileJson,
  File,
  BarChart,
  Users,
  DollarSign,
  Zap,
  Activity,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Trash2,
  Eye,
} from "lucide-react";
import type { ScheduledReport, ReportExport, ReportType, ExportFormat } from "@/types/database";
import { formatDateTime } from "@/lib/utils";

const reportTypeIcons: Record<ReportType, React.ElementType> = {
  analytics: BarChart,
  billing: DollarSign,
  usage: Activity,
  performance: Zap,
  client: Users,
  automation: Zap,
};

const formatIcons: Record<ExportFormat, React.ElementType> = {
  pdf: FileText,
  csv: FileSpreadsheet,
  excel: FileSpreadsheet,
  json: FileJson,
};

export default function ReportsExports() {
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [recentExports, setRecentExports] = useState<ReportExport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // New report form state
  const [newReport, setNewReport] = useState({
    name: "",
    description: "",
    report_type: "analytics" as ReportType,
    schedule_type: "weekly" as "daily" | "weekly" | "monthly" | "quarterly",
    schedule_day: 1,
    format: "pdf" as ExportFormat,
    recipients: "",
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/reports?type=both");
      const data = await response.json();
      setScheduledReports(data.scheduledReports || []);
      setRecentExports(data.recentExports || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportNow = async (reportType: ReportType, format: ExportFormat) => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "export",
          report_type: reportType,
          name: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - ${new Date().toLocaleDateString()}`,
          format,
        }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error creating export:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      const response = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "schedule",
          ...newReport,
          recipients: newReport.recipients.split(",").map((e) => e.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        setShowCreateDialog(false);
        setNewReport({
          name: "",
          description: "",
          report_type: "analytics",
          schedule_type: "weekly",
          schedule_day: 1,
          format: "pdf",
          recipients: "",
        });
        fetchData();
      }
    } catch (error) {
      console.error("Error creating schedule:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "processing":
        return <Badge variant="info">Processing</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reports & Exports</h2>
          <p className="text-muted-foreground">
            Generate and schedule automated reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Schedule New Report</DialogTitle>
                <DialogDescription>
                  Create an automated recurring report
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Report Name</Label>
                  <Input
                    value={newReport.name}
                    onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                    placeholder="Weekly Analytics Report"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={newReport.description}
                    onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                    placeholder="Comprehensive weekly analytics..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Report Type</Label>
                    <Select
                      value={newReport.report_type}
                      onValueChange={(v) => setNewReport({ ...newReport, report_type: v as ReportType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="analytics">Analytics</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="usage">Usage</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="automation">Automation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Schedule</Label>
                    <Select
                      value={newReport.schedule_type}
                      onValueChange={(v) => setNewReport({ ...newReport, schedule_type: v as "daily" | "weekly" | "monthly" | "quarterly" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <Select
                    value={newReport.format}
                    onValueChange={(v) => setNewReport({ ...newReport, format: v as ExportFormat })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Recipients (comma-separated emails)</Label>
                  <Input
                    value={newReport.recipients}
                    onChange={(e) => setNewReport({ ...newReport, recipients: e.target.value })}
                    placeholder="admin@example.com, team@example.com"
                  />
                </div>
                <Button onClick={handleCreateSchedule} className="w-full">
                  Create Scheduled Report
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Quick Export
          </CardTitle>
          <CardDescription>Generate an instant report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {(["analytics", "billing", "usage", "performance", "client", "automation"] as ReportType[]).map((type) => {
              const Icon = reportTypeIcons[type];
              return (
                <Card key={type} className="cursor-pointer hover:border-primary transition-colors">
                  <CardContent className="pt-6 text-center">
                    <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="font-medium capitalize text-sm">{type}</p>
                    <div className="flex gap-1 mt-3 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportNow(type, "pdf")}
                        disabled={isExporting}
                      >
                        <FileText className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportNow(type, "csv")}
                        disabled={isExporting}
                      >
                        <FileSpreadsheet className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="scheduled">
        <TabsList>
          <TabsTrigger value="scheduled">
            <Calendar className="h-4 w-4 mr-2" />
            Scheduled Reports ({scheduledReports.length})
          </TabsTrigger>
          <TabsTrigger value="exports">
            <Download className="h-4 w-4 mr-2" />
            Recent Exports ({recentExports.length})
          </TabsTrigger>
        </TabsList>

        {/* Scheduled Reports */}
        <TabsContent value="scheduled">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : scheduledReports.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No scheduled reports</p>
                  <Button variant="outline" className="mt-4" onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Schedule
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Next Run</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledReports.map((report) => {
                      const TypeIcon = reportTypeIcons[report.report_type];
                      const FormatIcon = formatIcons[report.format];
                      return (
                        <TableRow key={report.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{report.name}</p>
                              {report.description && (
                                <p className="text-xs text-muted-foreground">{report.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TypeIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="capitalize">{report.report_type}</span>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{report.schedule_type}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <FormatIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="uppercase text-xs">{report.format}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {report.next_run_at
                              ? new Date(report.next_run_at).toLocaleDateString()
                              : "Not scheduled"}
                          </TableCell>
                          <TableCell>
                            {report.is_active ? (
                              <Badge variant="success">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Paused</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon">
                                {report.is_active ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Exports */}
        <TabsContent value="exports">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : recentExports.length === 0 ? (
                <div className="text-center py-12">
                  <Download className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No exports yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Export</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentExports.map((exportItem) => {
                      const TypeIcon = reportTypeIcons[exportItem.report_type];
                      const FormatIcon = formatIcons[exportItem.format];
                      return (
                        <TableRow key={exportItem.id}>
                          <TableCell>
                            <p className="font-medium">{exportItem.name}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TypeIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="capitalize">{exportItem.report_type}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <FormatIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="uppercase text-xs">{exportItem.format}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {exportItem.file_size_bytes
                              ? `${(exportItem.file_size_bytes / 1024).toFixed(1)} KB`
                              : "-"}
                          </TableCell>
                          <TableCell>{formatDateTime(exportItem.created_at)}</TableCell>
                          <TableCell>{getStatusBadge(exportItem.status)}</TableCell>
                          <TableCell className="text-right">
                            {exportItem.status === "completed" && exportItem.file_url && (
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            )}
                            {exportItem.status === "processing" && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
