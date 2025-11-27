"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MoreHorizontal,
  Trash2,
  Eye,
  Search,
  ClipboardList,
  CheckCircle,
  Clock,
  FolderPlus,
  ExternalLink,
} from "lucide-react";
import {
  deleteAudit,
  updateAuditStatus,
  convertAuditToProject,
} from "@/app/actions/audits";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import type { Audit, Client } from "@/types/database";

interface AuditsTableProps {
  initialAudits: Audit[];
  clients: Pick<Client, "id" | "name" | "company">[];
}

export function AuditsTable({ initialAudits, clients }: AuditsTableProps) {
  const [audits, setAudits] = useState(initialAudits);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [auditToDelete, setAuditToDelete] = useState<Audit | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [converting, setConverting] = useState(false);
  const { toast } = useToast();

  const filteredAudits = audits.filter((audit) => {
    const matchesSearch =
      audit.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      audit.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || audit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: audits.length,
    new: audits.filter((a) => a.status === "new").length,
    "in-progress": audits.filter((a) => a.status === "in-progress").length,
    completed: audits.filter((a) => a.status === "completed").length,
  };

  const handleDelete = async () => {
    if (!auditToDelete) return;

    setDeleting(true);
    try {
      await deleteAudit(auditToDelete.id);
      setAudits(audits.filter((a) => a.id !== auditToDelete.id));
      toast({
        title: "Audit deleted",
        description: "The audit request has been successfully deleted.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete the audit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setAuditToDelete(null);
    }
  };

  const handleStatusChange = async (
    auditId: string,
    newStatus: "new" | "in-progress" | "completed"
  ) => {
    try {
      await updateAuditStatus(auditId, newStatus);
      setAudits(
        audits.map((a) => (a.id === auditId ? { ...a, status: newStatus } : a))
      );
      toast({
        title: "Status updated",
        description: `Audit status changed to ${newStatus}.`,
        variant: "success",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConvertToProject = async () => {
    if (!selectedAudit || !selectedClientId) return;

    setConverting(true);
    try {
      await convertAuditToProject(selectedAudit.id, selectedClientId);
      setAudits(
        audits.map((a) =>
          a.id === selectedAudit.id ? { ...a, status: "completed" } : a
        )
      );
      toast({
        title: "Project created",
        description: "The audit has been converted to a project.",
        variant: "success",
      });
      setConvertDialogOpen(false);
      setSelectedAudit(null);
      setSelectedClientId("");
    } catch {
      toast({
        title: "Error",
        description: "Failed to convert to project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConverting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge variant="warning">New</Badge>;
      case "in-progress":
        return <Badge variant="info">In Progress</Badge>;
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 mb-6">
            <Tabs
              value={statusFilter}
              onValueChange={setStatusFilter}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="gap-2">
                  All
                  <Badge variant="secondary" className="ml-1">
                    {statusCounts.all}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="new" className="gap-2">
                  New
                  <Badge variant="warning" className="ml-1">
                    {statusCounts.new}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="in-progress" className="gap-2">
                  In Progress
                  <Badge variant="info" className="ml-1">
                    {statusCounts["in-progress"]}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="completed" className="gap-2">
                  Completed
                  <Badge variant="success" className="ml-1">
                    {statusCounts.completed}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search audits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {filteredAudits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <ClipboardList className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "No audits found matching your filters."
                  : "No audit requests yet."}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Business URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAudits.map((audit) => (
                    <TableRow key={audit.id}>
                      <TableCell className="font-medium">
                        {audit.client_name}
                      </TableCell>
                      <TableCell>{audit.email}</TableCell>
                      <TableCell>
                        {audit.business_url ? (
                          <a
                            href={audit.business_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            {new URL(audit.business_url).hostname}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(audit.status)}</TableCell>
                      <TableCell>{formatDate(audit.created_at)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAudit(audit);
                                setViewDialogOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(audit.id, "in-progress")
                              }
                              disabled={audit.status === "in-progress"}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Mark In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(audit.id, "completed")
                              }
                              disabled={audit.status === "completed"}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark Completed
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAudit(audit);
                                setConvertDialogOpen(true);
                              }}
                            >
                              <FolderPlus className="mr-2 h-4 w-4" />
                              Convert to Project
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setAuditToDelete(audit);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Audit Request Details</DialogTitle>
            <DialogDescription>
              Submitted on{" "}
              {selectedAudit && formatDate(selectedAudit.created_at)}
            </DialogDescription>
          </DialogHeader>
          {selectedAudit && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Client Name</Label>
                <p className="font-medium">{selectedAudit.client_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{selectedAudit.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Business URL</Label>
                <p className="font-medium">
                  {selectedAudit.business_url || "Not provided"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="font-medium whitespace-pre-wrap">
                  {selectedAudit.description || "No description provided"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div className="mt-1">{getStatusBadge(selectedAudit.status)}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Convert to Project Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Project</DialogTitle>
            <DialogDescription>
              Select a client to create a project for this audit request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Client</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} ({client.company})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConvertDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConvertToProject}
              disabled={!selectedClientId || converting}
            >
              {converting ? "Converting..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Audit Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this audit request from{" "}
              {auditToDelete?.client_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
