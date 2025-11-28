"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Zap,
  Play,
  GitBranch,
  CheckSquare,
  Clock,
  Mail,
  Webhook,
  Database,
  MessageSquare,
  Bell,
  Filter,
  ArrowRight,
  Plus,
  Trash2,
  Settings,
  Save,
  Loader2,
  GripVertical,
  X,
  Calendar,
  MousePointer,
  FileText,
  RefreshCw,
  Code,
  Send,
  UserPlus,
  Target,
  AlertCircle,
  ChevronRight,
  Link as LinkIcon,
  Unlink,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface VisualEditorProps {
  clientId: string;
  existingAutomation?: {
    id: string;
    name: string;
    description?: string;
    automation_trigger?: string;
    result?: {
      automationWorkflow?: {
        steps?: Array<{
          id: number;
          name: string;
          action: string;
          type?: string;
        }>;
      };
    };
  } | null;
}

interface WorkflowNode {
  id: string;
  type: "trigger" | "condition" | "action" | "branch" | "delay";
  name: string;
  description: string;
  icon: React.ElementType;
  config: Record<string, string | number | boolean>;
  position: { x: number; y: number };
  connections: string[];
}

interface NodeTemplate {
  id: string;
  type: WorkflowNode["type"];
  name: string;
  description: string;
  icon: React.ElementType;
  category: string;
  defaultConfig: Record<string, string | number | boolean>;
}

const NODE_TEMPLATES: NodeTemplate[] = [
  // Triggers
  {
    id: "trigger-webhook",
    type: "trigger",
    name: "Webhook Trigger",
    description: "Start when webhook receives data",
    icon: Webhook,
    category: "Triggers",
    defaultConfig: { webhookUrl: "", method: "POST" },
  },
  {
    id: "trigger-schedule",
    type: "trigger",
    name: "Scheduled Trigger",
    description: "Run on a schedule",
    icon: Calendar,
    category: "Triggers",
    defaultConfig: { schedule: "daily", time: "09:00" },
  },
  {
    id: "trigger-manual",
    type: "trigger",
    name: "Manual Trigger",
    description: "Start manually",
    icon: MousePointer,
    category: "Triggers",
    defaultConfig: {},
  },
  {
    id: "trigger-event",
    type: "trigger",
    name: "Event Trigger",
    description: "Start when an event occurs",
    icon: Zap,
    category: "Triggers",
    defaultConfig: { eventType: "new_record" },
  },

  // Conditions
  {
    id: "condition-filter",
    type: "condition",
    name: "Filter",
    description: "Filter data based on conditions",
    icon: Filter,
    category: "Conditions",
    defaultConfig: { field: "", operator: "equals", value: "" },
  },
  {
    id: "condition-branch",
    type: "branch",
    name: "If/Else Branch",
    description: "Split workflow based on condition",
    icon: GitBranch,
    category: "Conditions",
    defaultConfig: { condition: "", trueBranch: "", falseBranch: "" },
  },

  // Actions
  {
    id: "action-email",
    type: "action",
    name: "Send Email",
    description: "Send an email notification",
    icon: Mail,
    category: "Actions",
    defaultConfig: { to: "", subject: "", body: "" },
  },
  {
    id: "action-notification",
    type: "action",
    name: "Send Notification",
    description: "Send a push notification",
    icon: Bell,
    category: "Actions",
    defaultConfig: { title: "", message: "" },
  },
  {
    id: "action-database",
    type: "action",
    name: "Update Database",
    description: "Create or update a record",
    icon: Database,
    category: "Actions",
    defaultConfig: { table: "", operation: "create", data: "{}" },
  },
  {
    id: "action-api",
    type: "action",
    name: "HTTP Request",
    description: "Make an API call",
    icon: Code,
    category: "Actions",
    defaultConfig: { url: "", method: "GET", headers: "{}", body: "{}" },
  },
  {
    id: "action-slack",
    type: "action",
    name: "Send to Slack",
    description: "Post message to Slack channel",
    icon: MessageSquare,
    category: "Actions",
    defaultConfig: { channel: "", message: "" },
  },
  {
    id: "action-task",
    type: "action",
    name: "Create Task",
    description: "Create a new task",
    icon: CheckSquare,
    category: "Actions",
    defaultConfig: { title: "", description: "", priority: "medium" },
  },
  {
    id: "action-document",
    type: "action",
    name: "Generate Document",
    description: "Create a document from template",
    icon: FileText,
    category: "Actions",
    defaultConfig: { template: "", outputFormat: "pdf" },
  },
  {
    id: "action-lead",
    type: "action",
    name: "Create Lead",
    description: "Add a new lead to CRM",
    icon: UserPlus,
    category: "Actions",
    defaultConfig: { name: "", email: "", source: "" },
  },

  // Delays
  {
    id: "delay-wait",
    type: "delay",
    name: "Wait",
    description: "Wait for a specified time",
    icon: Clock,
    category: "Timing",
    defaultConfig: { duration: 5, unit: "minutes" },
  },
  {
    id: "delay-schedule",
    type: "delay",
    name: "Wait Until",
    description: "Wait until specific time",
    icon: Target,
    category: "Timing",
    defaultConfig: { time: "09:00", timezone: "UTC" },
  },
];

const NODE_COLORS = {
  trigger: "bg-green-100 border-green-300 text-green-700",
  condition: "bg-blue-100 border-blue-300 text-blue-700",
  action: "bg-violet-100 border-violet-300 text-violet-700",
  branch: "bg-amber-100 border-amber-300 text-amber-700",
  delay: "bg-gray-100 border-gray-300 text-gray-700",
};

const NODE_ICON_COLORS = {
  trigger: "bg-green-500",
  condition: "bg-blue-500",
  action: "bg-violet-500",
  branch: "bg-amber-500",
  delay: "bg-gray-500",
};

export default function VisualEditor({ clientId, existingAutomation }: VisualEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [automationName, setAutomationName] = useState(existingAutomation?.name || "New Automation");
  const [automationDescription, setAutomationDescription] = useState(existingAutomation?.description || "");
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTemplate, setDraggedTemplate] = useState<NodeTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  // Initialize with existing automation steps if editing
  useEffect(() => {
    if (existingAutomation?.result?.automationWorkflow?.steps) {
      const steps = existingAutomation.result.automationWorkflow.steps;
      const initialNodes: WorkflowNode[] = steps.map((step, index) => ({
        id: `node-${Date.now()}-${index}`,
        type: step.type as WorkflowNode["type"] || "action",
        name: step.name,
        description: step.action,
        icon: determineIcon(step.type || "action"),
        config: {},
        position: { x: 100 + (index % 3) * 280, y: 100 + Math.floor(index / 3) * 150 },
        connections: index < steps.length - 1 ? [`node-${Date.now()}-${index + 1}`] : [],
      }));
      setNodes(initialNodes);
    }
  }, [existingAutomation]);

  function determineIcon(type: string) {
    switch (type) {
      case "trigger":
        return Zap;
      case "condition":
        return Filter;
      case "branch":
        return GitBranch;
      case "delay":
        return Clock;
      default:
        return CheckSquare;
    }
  }

  const handleDragStart = (template: NodeTemplate) => {
    setDraggedTemplate(template);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setDraggedTemplate(null);
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedTemplate || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type: draggedTemplate.type,
      name: draggedTemplate.name,
      description: draggedTemplate.description,
      icon: draggedTemplate.icon,
      config: { ...draggedTemplate.defaultConfig },
      position: { x, y },
      connections: [],
    };

    setNodes([...nodes, newNode]);
    setSelectedNode(newNode);
    handleDragEnd();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleNodeClick = (node: WorkflowNode) => {
    if (connectingFrom) {
      // Create connection
      if (connectingFrom !== node.id) {
        setNodes(nodes.map((n) => {
          if (n.id === connectingFrom) {
            return {
              ...n,
              connections: [...new Set([...n.connections, node.id])],
            };
          }
          return n;
        }));
      }
      setConnectingFrom(null);
    } else {
      setSelectedNode(node);
    }
  };

  const handleNodeDrag = (nodeId: string, e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const startNodeX = node.position.x;
    const startNodeY = node.position.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      setNodes(nodes.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            position: {
              x: Math.max(0, startNodeX + deltaX),
              y: Math.max(0, startNodeY + deltaY),
            },
          };
        }
        return n;
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(nodes.filter((n) => n.id !== nodeId).map((n) => ({
      ...n,
      connections: n.connections.filter((c) => c !== nodeId),
    })));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const handleUpdateNodeConfig = (key: string, value: string | number | boolean) => {
    if (!selectedNode) return;

    setNodes(nodes.map((n) => {
      if (n.id === selectedNode.id) {
        return {
          ...n,
          config: { ...n.config, [key]: value },
        };
      }
      return n;
    }));

    setSelectedNode({
      ...selectedNode,
      config: { ...selectedNode.config, [key]: value },
    });
  };

  const handleStartConnection = (nodeId: string) => {
    setConnectingFrom(nodeId);
    setSelectedNode(null);
  };

  const handleRemoveConnection = (fromId: string, toId: string) => {
    setNodes(nodes.map((n) => {
      if (n.id === fromId) {
        return {
          ...n,
          connections: n.connections.filter((c) => c !== toId),
        };
      }
      return n;
    }));
  };

  const handleSave = async () => {
    if (nodes.length === 0) {
      toast({
        title: "Cannot save",
        description: "Add at least one node to your automation",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Convert nodes to workflow steps
      const steps = nodes.map((node, index) => ({
        id: index + 1,
        name: node.name,
        action: node.description,
        type: node.type,
        config: node.config,
      }));

      const response = await fetch("/api/portal/automation/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: automationName,
          description: automationDescription,
          trigger: nodes.find((n) => n.type === "trigger")?.name.toLowerCase().replace(" ", "_") || "manual",
          workflow: { steps },
        }),
      });

      if (response.ok) {
        toast({
          title: "Automation saved",
          description: "Your automation has been saved successfully",
        });
        router.push("/portal/automations");
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save automation",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const groupedTemplates = NODE_TEMPLATES.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, NodeTemplate[]>);

  // Render connections between nodes
  const renderConnections = () => {
    const lines: JSX.Element[] = [];

    nodes.forEach((node) => {
      node.connections.forEach((targetId) => {
        const target = nodes.find((n) => n.id === targetId);
        if (!target) return;

        const startX = node.position.x + 120;
        const startY = node.position.y + 40;
        const endX = target.position.x;
        const endY = target.position.y + 40;

        // Create curved path
        const midX = (startX + endX) / 2;

        lines.push(
          <svg
            key={`${node.id}-${targetId}`}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ zIndex: 0 }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#8b5cf6" />
              </marker>
            </defs>
            <path
              d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
              stroke="#8b5cf6"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead)"
              className="cursor-pointer hover:stroke-red-500"
              onClick={() => handleRemoveConnection(node.id, targetId)}
              style={{ pointerEvents: "stroke" }}
            />
          </svg>
        );
      });
    });

    return lines;
  };

  return (
    <div className="h-[calc(100vh-140px)] flex">
      {/* Left Sidebar - Node Palette */}
      <div className="w-72 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-lg">Workflow Nodes</h3>
          <p className="text-xs text-muted-foreground">Drag nodes to canvas</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {Object.entries(groupedTemplates).map(([category, templates]) => (
              <div key={category}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {category}
                </h4>
                <div className="space-y-2">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      draggable
                      onDragStart={() => handleDragStart(template)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "p-3 rounded-lg border-2 border-dashed cursor-grab transition-all",
                        "hover:border-violet-300 hover:bg-violet-50/50",
                        NODE_COLORS[template.type]
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", NODE_ICON_COLORS[template.type])}>
                          <template.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{template.name}</p>
                          <p className="text-xs text-muted-foreground">{template.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-14 border-b bg-white flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Input
              value={automationName}
              onChange={(e) => setAutomationName(e.target.value)}
              className="font-semibold text-lg border-none p-0 h-auto focus-visible:ring-0 w-64"
              placeholder="Automation name"
            />
            <Badge variant="outline" className="text-muted-foreground">
              {nodes.length} nodes
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {connectingFrom && (
              <Badge variant="secondary" className="mr-2">
                <LinkIcon className="w-3 h-3 mr-1" />
                Click a node to connect
                <button
                  onClick={() => setConnectingFrom(null)}
                  className="ml-2 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || nodes.length === 0}
              className="bg-gradient-to-r from-violet-600 to-indigo-600"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Automation
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className={cn(
            "flex-1 relative overflow-auto bg-gray-50",
            "bg-[radial-gradient(circle,#e5e7eb_1px,transparent_1px)]",
            "[background-size:20px_20px]",
            isDragging && "bg-violet-50/30"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => {
            setSelectedNode(null);
            setConnectingFrom(null);
          }}
        >
          {/* Render connection lines */}
          {renderConnections()}

          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-violet-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Start building your automation</h3>
                <p className="text-muted-foreground max-w-sm">
                  Drag nodes from the left panel to create your workflow. Connect them to define the flow.
                </p>
              </div>
            </div>
          )}

          {/* Nodes */}
          {nodes.map((node) => (
            <div
              key={node.id}
              className={cn(
                "absolute w-60 rounded-xl border-2 bg-white shadow-sm cursor-move transition-all",
                selectedNode?.id === node.id && "ring-2 ring-violet-500 ring-offset-2",
                connectingFrom === node.id && "ring-2 ring-blue-500",
                NODE_COLORS[node.type]
              )}
              style={{
                left: node.position.x,
                top: node.position.y,
                zIndex: selectedNode?.id === node.id ? 10 : 1,
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleNodeClick(node);
              }}
              onMouseDown={(e) => {
                if ((e.target as HTMLElement).closest(".no-drag")) return;
                handleNodeDrag(node.id, e);
              }}
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", NODE_ICON_COLORS[node.type])}>
                      <node.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{node.name}</p>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {node.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 no-drag">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartConnection(node.id);
                      }}
                      className="p-1 rounded hover:bg-gray-200 transition-colors"
                      title="Connect to another node"
                    >
                      <LinkIcon className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNode(node.id);
                      }}
                      className="p-1 rounded hover:bg-red-100 hover:text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{node.description}</p>
                {node.connections.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Connected to {node.connections.length} node(s)
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Sidebar - Node Configuration */}
      {selectedNode && (
        <div className="w-80 border-l bg-white flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Configure Node</h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedNode(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", NODE_ICON_COLORS[selectedNode.type])}>
                  <selectedNode.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">{selectedNode.name}</p>
                  <Badge variant="secondary" className="capitalize">
                    {selectedNode.type}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Node Name</Label>
                  <Input
                    value={selectedNode.name}
                    onChange={(e) => {
                      setNodes(nodes.map((n) =>
                        n.id === selectedNode.id ? { ...n, name: e.target.value } : n
                      ));
                      setSelectedNode({ ...selectedNode, name: e.target.value });
                    }}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={selectedNode.description}
                    onChange={(e) => {
                      setNodes(nodes.map((n) =>
                        n.id === selectedNode.id ? { ...n, description: e.target.value } : n
                      ));
                      setSelectedNode({ ...selectedNode, description: e.target.value });
                    }}
                    className="mt-1"
                    rows={2}
                  />
                </div>

                {/* Dynamic configuration based on node type */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm mb-3">Configuration</h4>

                  {Object.entries(selectedNode.config).map(([key, value]) => (
                    <div key={key} className="mb-3">
                      <Label className="capitalize">{key.replace(/_/g, " ")}</Label>
                      {typeof value === "boolean" ? (
                        <Select
                          value={value ? "true" : "false"}
                          onValueChange={(v) => handleUpdateNodeConfig(key, v === "true")}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : key.includes("body") || key.includes("data") || key.includes("message") ? (
                        <Textarea
                          value={String(value)}
                          onChange={(e) => handleUpdateNodeConfig(key, e.target.value)}
                          className="mt-1 font-mono text-sm"
                          rows={4}
                          placeholder={`Enter ${key}...`}
                        />
                      ) : (
                        <Input
                          value={String(value)}
                          onChange={(e) => handleUpdateNodeConfig(key, e.target.value)}
                          className="mt-1"
                          placeholder={`Enter ${key}...`}
                          type={typeof value === "number" ? "number" : "text"}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Connections */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm mb-3">Connections</h4>
                  {selectedNode.connections.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No connections yet</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedNode.connections.map((connectionId) => {
                        const connectedNode = nodes.find((n) => n.id === connectionId);
                        if (!connectedNode) return null;
                        return (
                          <div
                            key={connectionId}
                            className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
                          >
                            <div className="flex items-center gap-2">
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{connectedNode.name}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveConnection(selectedNode.id, connectionId)}
                              className="text-muted-foreground hover:text-red-600"
                            >
                              <Unlink className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => handleStartConnection(selectedNode.id)}
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Add Connection
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
          <div className="p-4 border-t">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => handleDeleteNode(selectedNode.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Node
            </Button>
          </div>
        </div>
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Automation Settings</DialogTitle>
            <DialogDescription>
              Configure your automation settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Automation Name</Label>
              <Input
                id="name"
                value={automationName}
                onChange={(e) => setAutomationName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={automationDescription}
                onChange={(e) => setAutomationDescription(e.target.value)}
                className="mt-1"
                rows={3}
                placeholder="Describe what this automation does..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowSettings(false)}>Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
