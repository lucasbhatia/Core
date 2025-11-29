"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  CheckCircle,
  XCircle,
  Edit3,
  Sparkles,
  Bot,
  Zap,
  Clock,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Loader2,
  CheckCheck,
  RefreshCw,
  Inbox,
  AlertTriangle,
  FileText,
  ChevronDown,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface ReviewQueuePageProps {
  clientId: string;
  clientName: string;
}

interface ReviewItem {
  id: string;
  item_type: "ai_action" | "agent_task" | "automation";
  sub_type: string;
  entity_type: string;
  entity_id: string;
  entity_title?: string;
  title?: string;
  content?: string;
  output_content?: string;
  review_status: string;
  created_at: string;
  agent_name?: string;
  agent_roster_id?: string;
  action_type?: string;
  trigger_type?: string;
}

interface ReviewStats {
  pending_ai_actions: number;
  pending_agent_tasks: number;
  pending_automations: number;
  total_pending: number;
}

export default function ReviewQueuePage({ clientId, clientName }: ReviewQueuePageProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    pending_ai_actions: 0,
    pending_agent_tasks: 0,
    pending_automations: 0,
    total_pending: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());

  // Dialog states
  const [viewItem, setViewItem] = useState<ReviewItem | null>(null);
  const [editItem, setEditItem] = useState<ReviewItem | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [rejectItem, setRejectItem] = useState<ReviewItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [bulkAction, setBulkAction] = useState<"approve" | "reject" | null>(null);

  // Fetch review queue
  const fetchReviewQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const itemType = activeTab === "all" ? "" : activeTab;
      const response = await fetch(
        `/api/ai-actions/review?clientId=${clientId}&itemType=${itemType}&reviewStatus=pending`
      );

      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error("Failed to fetch review queue:", error);
      toast({
        title: "Error",
        description: "Failed to load review queue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [clientId, activeTab, toast, stats]);

  useEffect(() => {
    fetchReviewQueue();
  }, [fetchReviewQueue]);

  // Handle single item review
  const handleReviewAction = async (
    item: ReviewItem,
    action: "approve" | "reject" | "edit",
    extras?: { editedContent?: string; rejectionReason?: string }
  ) => {
    setProcessingItems((prev) => new Set(prev).add(item.id));

    try {
      const response = await fetch("/api/ai-actions/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          itemType: item.item_type,
          action,
          editedContent: extras?.editedContent,
          rejectionReason: extras?.rejectionReason,
        }),
      });

      if (response.ok) {
        toast({
          title: `Item ${action}ed`,
          description: `Successfully ${action}ed "${item.entity_title || item.title}"`,
        });
        fetchReviewQueue();
        setSelectedItems((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to process review");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process review",
        variant: "destructive",
      });
    } finally {
      setProcessingItems((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
      setEditItem(null);
      setRejectItem(null);
      setEditedContent("");
      setRejectionReason("");
    }
  };

  // Handle bulk review
  const handleBulkReview = async (action: "approve" | "reject") => {
    if (selectedItems.size === 0) return;

    const itemsToProcess = items.filter((item) => selectedItems.has(item.id));
    setProcessingItems(new Set(itemsToProcess.map((i) => i.id)));

    try {
      const response = await fetch("/api/ai-actions/review", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemsToProcess.map((item) => ({
            itemId: item.id,
            itemType: item.item_type,
          })),
          action,
          rejectionReason: action === "reject" ? rejectionReason : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: `Bulk ${action} complete`,
          description: `${data.summary.successful} of ${data.summary.total} items ${action}ed`,
        });
        fetchReviewQueue();
        setSelectedItems(new Set());
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to process bulk review");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process bulk review",
        variant: "destructive",
      });
    } finally {
      setProcessingItems(new Set());
      setBulkAction(null);
      setRejectionReason("");
    }
  };

  // Toggle item selection
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Select all visible items
  const selectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map((i) => i.id)));
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (item.entity_title || "").toLowerCase().includes(query) ||
      (item.title || "").toLowerCase().includes(query) ||
      (item.agent_name || "").toLowerCase().includes(query) ||
      item.sub_type?.toLowerCase().includes(query)
    );
  });

  // Get icon for item type
  const getItemIcon = (item: ReviewItem) => {
    switch (item.item_type) {
      case "ai_action":
        return <Sparkles className="h-4 w-4 text-violet-600" />;
      case "agent_task":
        return <Bot className="h-4 w-4 text-blue-600" />;
      case "automation":
        return <Zap className="h-4 w-4 text-amber-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Get badge color for item type
  const getItemBadge = (item: ReviewItem) => {
    switch (item.item_type) {
      case "ai_action":
        return "bg-violet-100 text-violet-700 border-violet-200";
      case "agent_task":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "automation":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Review Queue</h1>
          <p className="text-muted-foreground">
            Review and approve AI-generated content before it goes live
          </p>
        </div>
        <Button onClick={fetchReviewQueue} variant="outline" disabled={isLoading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pending</p>
                <p className="text-2xl font-bold">{stats.total_pending}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <Inbox className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Actions</p>
                <p className="text-2xl font-bold text-violet-600">{stats.pending_ai_actions}</p>
              </div>
              <div className="p-3 bg-violet-100 rounded-full">
                <Sparkles className="h-5 w-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Agent Tasks</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pending_agent_tasks}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Bot className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Automations</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pending_automations}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <Zap className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedItems.size} selected
            </span>
            <Button
              size="sm"
              onClick={() => setBulkAction("approve")}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkAction("reject")}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject All
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All
            {stats.total_pending > 0 && (
              <Badge variant="secondary" className="ml-2">
                {stats.total_pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ai_action">
            AI Actions
            {stats.pending_ai_actions > 0 && (
              <Badge variant="secondary" className="ml-2">
                {stats.pending_ai_actions}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="agent_task">
            Agent Tasks
            {stats.pending_agent_tasks > 0 && (
              <Badge variant="secondary" className="ml-2">
                {stats.pending_agent_tasks}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="automation">
            Automations
            {stats.pending_automations > 0 && (
              <Badge variant="secondary" className="ml-2">
                {stats.pending_automations}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading review queue...</p>
              </CardContent>
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCheck className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">All caught up!</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {searchQuery
                    ? "No items match your search"
                    : "There are no items waiting for review. New AI-generated content will appear here."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                    onCheckedChange={selectAll}
                  />
                  <span className="text-sm text-muted-foreground">
                    {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""} pending review
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="divide-y">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors",
                          selectedItems.has(item.id) && "bg-blue-50"
                        )}
                      >
                        <Checkbox
                          checked={selectedItems.has(item.id)}
                          onCheckedChange={() => toggleItemSelection(item.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "p-2 rounded-lg",
                                item.item_type === "ai_action" && "bg-violet-100",
                                item.item_type === "agent_task" && "bg-blue-100",
                                item.item_type === "automation" && "bg-amber-100"
                              )}>
                                {getItemIcon(item)}
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {item.entity_title || item.title || "Untitled"}
                                </p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <Badge variant="outline" className={cn("text-xs", getItemBadge(item))}>
                                    {item.item_type === "ai_action" && "AI Action"}
                                    {item.item_type === "agent_task" && "Agent Task"}
                                    {item.item_type === "automation" && "Automation"}
                                  </Badge>
                                  {item.agent_name && (
                                    <Badge variant="secondary" className="text-xs">
                                      {item.agent_name}
                                    </Badge>
                                  )}
                                  {item.sub_type && (
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {item.sub_type}
                                    </Badge>
                                  )}
                                </div>
                                {(item.content || item.output_content) && (
                                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                    {(item.content || item.output_content || "").slice(0, 150)}...
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setViewItem(item)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleReviewAction(item, "approve")}
                                disabled={processingItems.has(item.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {processingItems.has(item.id) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    setEditItem(item);
                                    setEditedContent(item.content || item.output_content || "");
                                  }}>
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Edit & Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setRejectItem(item)}
                                    className="text-red-600"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          {viewItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getItemIcon(viewItem)}
                  {viewItem.entity_title || viewItem.title}
                </DialogTitle>
                <DialogDescription>
                  Review the content below and decide whether to approve, edit, or reject.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={getItemBadge(viewItem)}>
                  {viewItem.item_type.replace("_", " ")}
                </Badge>
                {viewItem.agent_name && (
                  <Badge variant="secondary">{viewItem.agent_name}</Badge>
                )}
                <Badge variant="outline" className="capitalize">{viewItem.sub_type}</Badge>
              </div>
              <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-gray-50">
                <pre className="whitespace-pre-wrap text-sm font-sans">
                  {viewItem.content || viewItem.output_content || "No content available"}
                </pre>
              </ScrollArea>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setRejectItem(viewItem)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button variant="outline" onClick={() => {
                  setEditItem(viewItem);
                  setEditedContent(viewItem.content || viewItem.output_content || "");
                  setViewItem(null);
                }}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={() => {
                    handleReviewAction(viewItem, "approve");
                    setViewItem(null);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-2xl">
          {editItem && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Content</DialogTitle>
                <DialogDescription>
                  Make your changes below. The edited version will be saved and approved.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditItem(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleReviewAction(editItem, "edit", { editedContent })}
                  disabled={processingItems.has(editItem.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processingItems.has(editItem.id) ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Save & Approve
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <AlertDialog open={!!rejectItem} onOpenChange={() => setRejectItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Reject Item
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will reject "{rejectItem?.entity_title || rejectItem?.title}". Optionally provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Rejection reason (optional)"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-[100px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => rejectItem && handleReviewAction(rejectItem, "reject", { rejectionReason })}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Action Dialog */}
      <AlertDialog open={!!bulkAction} onOpenChange={() => setBulkAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction === "approve" ? "Approve All Selected" : "Reject All Selected"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will {bulkAction} {selectedItems.size} item{selectedItems.size !== 1 ? "s" : ""}.
              {bulkAction === "reject" && " Optionally provide a reason."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {bulkAction === "reject" && (
            <Textarea
              placeholder="Rejection reason (optional)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkAction && handleBulkReview(bulkAction)}
              className={bulkAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {bulkAction === "approve" ? "Approve All" : "Reject All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
