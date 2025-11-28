"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plug,
  Plus,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Settings,
  Trash2,
  Loader2,
  Zap,
  Database,
  CreditCard,
  Mail,
  Clock,
  Cloud,
  Link2,
  Webhook,
  Key,
  Activity,
} from "lucide-react";
import type { Integration, IntegrationStatus } from "@/types/database";

interface IntegrationWithStats extends Integration {
  recentStats: {
    success: number;
    failed: number;
    total: number;
  };
}

const providerIcons: Record<string, React.ElementType> = {
  stripe: CreditCard,
  airtable: Database,
  n8n: Zap,
  slack: Cloud,
  zapier: Zap,
  hubspot: Activity,
  salesforce: Cloud,
  google: Cloud,
  resend: Mail,
  inngest: Clock,
  custom: Plug,
};

const providerColors: Record<string, string> = {
  stripe: "bg-purple-500",
  airtable: "bg-blue-500",
  n8n: "bg-orange-500",
  slack: "bg-pink-500",
  zapier: "bg-orange-600",
  hubspot: "bg-orange-500",
  salesforce: "bg-blue-600",
  google: "bg-red-500",
  resend: "bg-black",
  inngest: "bg-green-500",
  custom: "bg-gray-500",
};

const AVAILABLE_INTEGRATIONS = [
  { id: "stripe", name: "Stripe", description: "Payment processing and billing", type: "api" as const },
  { id: "airtable", name: "Airtable", description: "Database and spreadsheet platform", type: "api" as const },
  { id: "n8n", name: "n8n", description: "Workflow automation platform", type: "webhook" as const },
  { id: "slack", name: "Slack", description: "Team communication", type: "oauth" as const },
  { id: "zapier", name: "Zapier", description: "App integration platform", type: "webhook" as const },
  { id: "hubspot", name: "HubSpot", description: "CRM and marketing", type: "api" as const },
  { id: "salesforce", name: "Salesforce", description: "Enterprise CRM", type: "oauth" as const },
  { id: "google", name: "Google Workspace", description: "Gmail, Drive, Calendar", type: "oauth" as const },
  { id: "custom", name: "Custom Webhook", description: "Connect any service via webhook", type: "webhook" as const },
];

export default function IntegrationsHub() {
  const [integrations, setIntegrations] = useState<IntegrationWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const fetchIntegrations = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`/api/admin/integrations?${params}`);
      const data = await response.json();
      setIntegrations(data.integrations || []);
    } catch (error) {
      console.error("Error fetching integrations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, [statusFilter]);

  const filteredIntegrations = integrations.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.provider.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: IntegrationStatus) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: IntegrationStatus) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "inactive":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const activeCount = integrations.filter((i) => i.status === "active").length;
  const errorCount = integrations.filter((i) => i.status === "error").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integrations Hub</h2>
          <p className="text-muted-foreground">
            Connect and manage third-party services
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Integration</DialogTitle>
              <DialogDescription>
                Connect a new service to your platform
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {AVAILABLE_INTEGRATIONS.map((integration) => {
                const Icon = providerIcons[integration.id] || Plug;
                return (
                  <button
                    key={integration.id}
                    onClick={() => setSelectedProvider(integration.id)}
                    className={`p-4 rounded-lg border text-left transition-colors hover:border-primary ${
                      selectedProvider === integration.id ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${providerColors[integration.id]} text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{integration.name}</p>
                        <p className="text-xs text-muted-foreground">{integration.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedProvider && (
              <div className="mt-4 p-4 border rounded-lg space-y-4">
                <div className="space-y-2">
                  <Label>Integration Name</Label>
                  <Input placeholder="My Integration" />
                </div>
                <div className="space-y-2">
                  <Label>API Key / Token</Label>
                  <Input type="password" placeholder="Enter your API key" />
                </div>
                <Button className="w-full">Connect Integration</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Integrations</p>
                <p className="text-2xl font-bold">{integrations.length}</p>
              </div>
              <Plug className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-500">{activeCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold text-red-500">{errorCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">API Calls (24h)</p>
                <p className="text-2xl font-bold">
                  {integrations.reduce((sum, i) => sum + i.recentStats.total, 0)}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search integrations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchIntegrations} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Integrations List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredIntegrations.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Plug className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No integrations found</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Integration
            </Button>
          </div>
        ) : (
          filteredIntegrations.map((integration) => {
            const Icon = providerIcons[integration.provider] || Plug;
            return (
              <Card key={integration.id} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 ${
                  integration.status === "active" ? "bg-green-500" :
                  integration.status === "error" ? "bg-red-500" :
                  "bg-gray-300"
                }`} />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${providerColors[integration.provider] || "bg-gray-500"} text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{integration.name}</CardTitle>
                        <CardDescription className="text-xs">{integration.provider}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(integration.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {integration.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {integration.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Sync</span>
                      <span>
                        {integration.last_sync_at
                          ? new Date(integration.last_sync_at).toLocaleDateString()
                          : "Never"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">API Calls (24h)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">{integration.recentStats.success}</span>
                        <span>/</span>
                        <span className="text-red-500">{integration.recentStats.failed}</span>
                      </div>
                    </div>

                    {integration.last_error && (
                      <div className="p-2 bg-red-500/10 rounded text-xs text-red-500">
                        {integration.last_error}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="h-4 w-4 mr-1" />
                        Configure
                      </Button>
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
