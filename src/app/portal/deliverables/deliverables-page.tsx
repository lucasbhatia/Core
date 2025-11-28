"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Search,
  Filter,
  Eye,
  Download,
  Copy,
  CheckCheck,
  MoreVertical,
  Archive,
  BarChart3,
  FileCode,
  Presentation,
  FolderOpen,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

interface Deliverable {
  id: string;
  name: string;
  description?: string;
  file_type: string;
  category?: string;
  content?: string;
  file_url?: string;
  status: string;
  created_at: string;
}

interface DeliverablesPageProps {
  deliverables: Deliverable[];
}

const categoryIcons: Record<string, React.ElementType> = {
  report: BarChart3,
  document: FileText,
  analysis: BarChart3,
  presentation: Presentation,
  code: FileCode,
  data: FileCode,
  general: FileText,
};

export default function DeliverablesPage({ deliverables }: DeliverablesPageProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [copied, setCopied] = useState(false);

  // Filter deliverables
  const filteredDeliverables = deliverables.filter((d) => {
    if (d.status === "archived") return false;
    if (searchQuery && !d.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter !== "all" && d.category !== categoryFilter) return false;
    return true;
  });

  // Get unique categories
  const categories = [...new Set(deliverables.map((d) => d.category).filter(Boolean))];

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  }

  async function handleArchive(id: string) {
    try {
      const response = await fetch(`/api/portal/deliverables/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast({ title: "Deliverable archived" });
        window.location.reload();
      }
    } catch {
      toast({ title: "Error archiving", variant: "destructive" });
    }
  }

  // Group by category for display
  const groupedDeliverables = filteredDeliverables.reduce((acc, d) => {
    const cat = d.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(d);
    return acc;
  }, {} as Record<string, Deliverable[]>);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search deliverables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat || ""}>
                <span className="capitalize">{cat}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Deliverables</p>
                <p className="text-2xl font-bold">{filteredDeliverables.length}</p>
              </div>
              <FileText className="w-8 h-8 text-violet-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
              <FolderOpen className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">
                  {deliverables.filter((d) => {
                    const date = new Date(d.created_at);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deliverables by Category */}
      {filteredDeliverables.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {searchQuery || categoryFilter !== "all"
                ? "No matching deliverables"
                : "No deliverables yet"}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery || categoryFilter !== "all"
                ? "Try adjusting your filters"
                : "Results from your automations will appear here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedDeliverables).map(([category, items]) => {
            const Icon = categoryIcons[category] || FileText;
            return (
              <div key={category}>
                <h3 className="font-medium mb-4 flex items-center gap-2 capitalize">
                  <Icon className="w-5 h-5 text-violet-600" />
                  {category}
                  <Badge variant="secondary">{items.length}</Badge>
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((deliverable) => {
                    const CategoryIcon = categoryIcons[deliverable.category || "general"] || FileText;
                    return (
                      <Card key={deliverable.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                                <CategoryIcon className="w-5 h-5 text-violet-600" />
                              </div>
                              <div className="min-w-0">
                                <CardTitle className="text-sm truncate">
                                  {deliverable.name}
                                </CardTitle>
                                {deliverable.description && (
                                  <CardDescription className="text-xs line-clamp-1">
                                    {deliverable.description}
                                  </CardDescription>
                                )}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedDeliverable(deliverable)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                {deliverable.content && (
                                  <DropdownMenuItem onClick={() => copyToClipboard(deliverable.content!)}>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy
                                  </DropdownMenuItem>
                                )}
                                {deliverable.file_url && (
                                  <DropdownMenuItem asChild>
                                    <a href={deliverable.file_url} download>
                                      <Download className="w-4 h-4 mr-2" />
                                      Download
                                    </a>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleArchive(deliverable.id)}
                                  className="text-destructive"
                                >
                                  <Archive className="w-4 h-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(deliverable.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                            <Badge variant="outline" className="text-xs capitalize">
                              {deliverable.status}
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-3"
                            onClick={() => setSelectedDeliverable(deliverable)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Content
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!selectedDeliverable} onOpenChange={() => setSelectedDeliverable(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          {selectedDeliverable && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedDeliverable.name}</DialogTitle>
                <DialogDescription>{selectedDeliverable.description}</DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="capitalize">
                  {selectedDeliverable.category || "general"}
                </Badge>
                <Badge variant="secondary">{selectedDeliverable.status}</Badge>
              </div>
              <div className="h-[400px] w-full rounded-md border p-4 overflow-auto bg-gray-50">
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {selectedDeliverable.content || "No content available"}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    selectedDeliverable.content && copyToClipboard(selectedDeliverable.content)
                  }
                >
                  {copied ? <CheckCheck className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                {selectedDeliverable.file_url && (
                  <Button asChild>
                    <a href={selectedDeliverable.file_url} download>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
