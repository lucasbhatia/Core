"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Settings,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Key,
  Globe,
  Mail,
  Calendar,
  MessageSquare,
  Database,
  CreditCard,
  FileSpreadsheet,
  Loader2,
  Plug,
  Unplug,
  AlertCircle,
  Clock,
  Zap,
  ArrowRight,
  MoreVertical,
  Trash2,
  Edit,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface IntegrationsPageProps {
  clientId: string;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: "communication" | "productivity" | "crm" | "finance" | "storage" | "marketing";
  status: "connected" | "disconnected" | "error";
  lastSync?: string;
  config?: Record<string, string>;
  features?: string[];
  popular?: boolean;
}

const AVAILABLE_INTEGRATIONS: Integration[] = [
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Sync events and schedule automations based on calendar events",
    icon: <Calendar className="w-6 h-6 text-blue-500" />,
    category: "productivity",
    status: "disconnected",
    features: ["Event sync", "Automated scheduling", "Meeting reminders"],
    popular: true,
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Send and receive emails, trigger automations on new messages",
    icon: <Mail className="w-6 h-6 text-red-500" />,
    category: "communication",
    status: "disconnected",
    features: ["Send emails", "Email triggers", "Attachment handling"],
    popular: true,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send messages and notifications to Slack channels",
    icon: <MessageSquare className="w-6 h-6 text-purple-500" />,
    category: "communication",
    status: "disconnected",
    features: ["Channel messages", "Direct messages", "Notifications"],
    popular: true,
  },
  {
    id: "notion",
    name: "Notion",
    description: "Create and update Notion pages and databases",
    icon: <FileSpreadsheet className="w-6 h-6 text-gray-800" />,
    category: "productivity",
    status: "disconnected",
    features: ["Database sync", "Page creation", "Content updates"],
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description: "Sync leads, contacts, and opportunities with Salesforce CRM",
    icon: <Database className="w-6 h-6 text-blue-600" />,
    category: "crm",
    status: "disconnected",
    features: ["Lead sync", "Contact management", "Opportunity tracking"],
    popular: true,
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Connect your HubSpot CRM for marketing and sales automation",
    icon: <Database className="w-6 h-6 text-orange-500" />,
    category: "crm",
    status: "disconnected",
    features: ["Contact sync", "Deal management", "Email tracking"],
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    description: "Read and write data to Google Sheets spreadsheets",
    icon: <FileSpreadsheet className="w-6 h-6 text-green-500" />,
    category: "productivity",
    status: "disconnected",
    features: ["Data sync", "Row creation", "Spreadsheet updates"],
    popular: true,
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Process payments and manage subscriptions",
    icon: <CreditCard className="w-6 h-6 text-indigo-500" />,
    category: "finance",
    status: "disconnected",
    features: ["Payment processing", "Subscription management", "Invoice generation"],
  },
  {
    id: "airtable",
    name: "Airtable",
    description: "Sync data with Airtable bases and tables",
    icon: <Database className="w-6 h-6 text-teal-500" />,
    category: "productivity",
    status: "disconnected",
    features: ["Record sync", "Base management", "View filtering"],
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Manage email lists and campaigns",
    icon: <Mail className="w-6 h-6 text-yellow-600" />,
    category: "marketing",
    status: "disconnected",
    features: ["List management", "Campaign creation", "Subscriber sync"],
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect to thousands of apps through Zapier",
    icon: <Zap className="w-6 h-6 text-orange-500" />,
    category: "productivity",
    status: "disconnected",
    features: ["App connections", "Zap triggers", "Multi-step workflows"],
  },
  {
    id: "webhook",
    name: "Custom Webhook",
    description: "Send and receive data via custom webhooks",
    icon: <Globe className="w-6 h-6 text-gray-600" />,
    category: "productivity",
    status: "disconnected",
    features: ["Custom endpoints", "Data transformation", "Authentication"],
  },
];

const CATEGORIES = [
  { id: "all", label: "All Integrations" },
  { id: "communication", label: "Communication" },
  { id: "productivity", label: "Productivity" },
  { id: "crm", label: "CRM" },
  { id: "finance", label: "Finance" },
  { id: "marketing", label: "Marketing" },
];

export default function IntegrationsPage({ clientId }: IntegrationsPageProps) {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>(AVAILABLE_INTEGRATIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");

  // Simulate loading connected integrations
  useEffect(() => {
    // Load from localStorage or API
    const saved = localStorage.getItem(`integrations-${clientId}`);
    if (saved) {
      try {
        const savedIntegrations = JSON.parse(saved) as Record<string, { status: string; lastSync: string }>;
        setIntegrations((prev) =>
          prev.map((integration) => {
            const savedData = savedIntegrations[integration.id];
            if (savedData) {
              return {
                ...integration,
                status: savedData.status as Integration["status"],
                lastSync: savedData.lastSync,
              };
            }
            return integration;
          })
        );
      } catch (e) {
        console.error("Failed to load integrations:", e);
      }
    }
  }, [clientId]);

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch =
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const connectedIntegrations = integrations.filter((i) => i.status === "connected");
  const popularIntegrations = integrations.filter((i) => i.popular);

  const handleConnect = async (integration: Integration) => {
    setSelectedIntegration(integration);
    setConfigDialogOpen(true);
  };

  const handleDisconnect = async (integrationId: string) => {
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === integrationId
          ? { ...i, status: "disconnected" as const, lastSync: undefined }
          : i
      )
    );

    // Save to localStorage
    const savedData: Record<string, { status: string; lastSync?: string }> = {};
    integrations.forEach((i) => {
      if (i.id === integrationId) {
        savedData[i.id] = { status: "disconnected" };
      } else if (i.status === "connected") {
        savedData[i.id] = { status: i.status, lastSync: i.lastSync };
      }
    });
    localStorage.setItem(`integrations-${clientId}`, JSON.stringify(savedData));

    toast({
      title: "Integration disconnected",
      description: `${integrations.find((i) => i.id === integrationId)?.name} has been disconnected.`,
    });
  };

  const handleSaveConnection = async () => {
    if (!selectedIntegration) return;

    setConnecting(selectedIntegration.id);

    // Simulate API connection
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === selectedIntegration.id
          ? { ...i, status: "connected" as const, lastSync: new Date().toISOString() }
          : i
      )
    );

    // Save to localStorage
    const savedData: Record<string, { status: string; lastSync: string }> = {};
    integrations.forEach((i) => {
      if (i.id === selectedIntegration.id) {
        savedData[i.id] = { status: "connected", lastSync: new Date().toISOString() };
      } else if (i.status === "connected") {
        savedData[i.id] = { status: i.status, lastSync: i.lastSync || "" };
      }
    });
    localStorage.setItem(`integrations-${clientId}`, JSON.stringify(savedData));

    setConnecting(null);
    setConfigDialogOpen(false);
    setApiKey("");

    toast({
      title: "Integration connected",
      description: `${selectedIntegration.name} has been connected successfully.`,
    });
  };

  const handleSync = async (integrationId: string) => {
    setConnecting(integrationId);

    // Simulate sync
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === integrationId
          ? { ...i, lastSync: new Date().toISOString() }
          : i
      )
    );

    setConnecting(null);

    toast({
      title: "Sync complete",
      description: "Integration data has been synced.",
    });
  };

  const renderIntegrationCard = (integration: Integration, showActions = true) => (
    <Card
      key={integration.id}
      className={cn(
        "transition-all hover:shadow-md",
        integration.status === "connected" && "border-green-200 bg-green-50/30"
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              {integration.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{integration.name}</h3>
                {integration.status === "connected" && (
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                )}
                {integration.status === "error" && (
                  <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Error
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{integration.description}</p>
              {integration.features && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {integration.features.slice(0, 3).map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              )}
              {integration.status === "connected" && integration.lastSync && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last synced {formatDistanceToNow(new Date(integration.lastSync), { addSuffix: true })}
                </p>
              )}
            </div>
          </div>
          {showActions && (
            <div className="flex items-center gap-2">
              {integration.status === "connected" ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSync(integration.id)}
                    disabled={connecting === integration.id}
                  >
                    {connecting === integration.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleConnect(integration)}>
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSync(integration.id)}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync Now
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDisconnect(integration.id)}
                        className="text-red-600"
                      >
                        <Unplug className="w-4 h-4 mr-2" />
                        Disconnect
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button onClick={() => handleConnect(integration)}>
                  <Plug className="w-4 h-4 mr-2" />
                  Connect
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">
            Connect your favorite tools to power your automations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1">
            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
            {connectedIntegrations.length} connected
          </Badge>
        </div>
      </div>

      {/* Connected Integrations Summary */}
      {connectedIntegrations.length > 0 && (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Connected Integrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {connectedIntegrations.map((integration) => (
                <div
                  key={integration.id}
                  className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border"
                >
                  {integration.icon}
                  <span className="font-medium text-sm">{integration.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="flex-wrap h-auto gap-1">
            {CATEGORIES.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Popular Integrations */}
      {selectedCategory === "all" && searchQuery === "" && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Popular Integrations
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {popularIntegrations.map((integration) => renderIntegrationCard(integration))}
          </div>
        </div>
      )}

      {/* All Integrations */}
      <div>
        {(selectedCategory !== "all" || searchQuery !== "") && (
          <h2 className="text-lg font-semibold mb-4">
            {selectedCategory === "all" ? "Search Results" : `${CATEGORIES.find((c) => c.id === selectedCategory)?.label}`}
          </h2>
        )}
        {selectedCategory === "all" && searchQuery === "" && (
          <h2 className="text-lg font-semibold mb-4">All Integrations</h2>
        )}

        {filteredIntegrations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No integrations found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredIntegrations
              .filter((i) => selectedCategory === "all" && searchQuery === "" ? !i.popular : true)
              .map((integration) => renderIntegrationCard(integration))}
          </div>
        )}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedIntegration?.icon}
              Connect {selectedIntegration?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedIntegration?.status === "connected"
                ? "Update your integration settings"
                : "Enter your credentials to connect this integration"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="api-key" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                API Key
              </Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter your API key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Your API key is encrypted and stored securely.
              </p>
            </div>

            {selectedIntegration?.features && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-2">Features included:</p>
                <ul className="space-y-1">
                  {selectedIntegration.features.map((feature) => (
                    <li key={feature} className="text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-4 bg-blue-50 rounded-lg flex items-start gap-3">
              <ExternalLink className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Need help?</p>
                <p className="text-xs text-blue-700">
                  Check our documentation for step-by-step setup instructions.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveConnection}
              disabled={!apiKey.trim() || connecting === selectedIntegration?.id}
              className="bg-gradient-to-r from-violet-600 to-indigo-600"
            >
              {connecting === selectedIntegration?.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Plug className="w-4 h-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
