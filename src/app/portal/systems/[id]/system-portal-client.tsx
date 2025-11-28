"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Client, SystemBuild, SystemAction, ActionField, SystemActivity } from "@/types/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Zap,
  PlusCircle,
  BarChart3,
  Send,
  MessageSquare,
  Loader2,
  CheckCircle,
  Clock,
  Activity,
} from "lucide-react";
import Link from "next/link";

interface SystemPortalClientProps {
  system: SystemBuild;
  client: Client;
  activeActionId?: string;
}

// Icon mapping
const actionIcons: Record<string, React.ReactNode> = {
  "plus-circle": <PlusCircle className="w-5 h-5" />,
  "bar-chart": <BarChart3 className="w-5 h-5" />,
  "send": <Send className="w-5 h-5" />,
  "message-square": <MessageSquare className="w-5 h-5" />,
  "zap": <Zap className="w-5 h-5" />,
  form: <PlusCircle className="w-5 h-5" />,
  dashboard: <BarChart3 className="w-5 h-5" />,
  trigger: <Send className="w-5 h-5" />,
  ai_chat: <MessageSquare className="w-5 h-5" />,
};

function getIcon(iconName: string, type: string) {
  return actionIcons[iconName] || actionIcons[type] || <Zap className="w-5 h-5" />;
}

export default function SystemPortalClient({
  system,
  client,
  activeActionId,
}: SystemPortalClientProps) {
  const router = useRouter();
  const actions = (system.actions || []) as SystemAction[];
  const [selectedAction, setSelectedAction] = useState<SystemAction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [recentActivity, setRecentActivity] = useState<SystemActivity[]>([]);

  // Open action if provided in URL
  useEffect(() => {
    if (activeActionId) {
      const action = actions.find((a) => a.id === activeActionId);
      if (action) {
        setSelectedAction(action);
        setIsDialogOpen(true);
      }
    }
  }, [activeActionId, actions]);

  function handleActionClick(action: SystemAction) {
    setSelectedAction(action);
    setIsDialogOpen(true);
  }

  function handleDialogClose() {
    setIsDialogOpen(false);
    setSelectedAction(null);
    // Remove action from URL
    router.push(`/portal/systems/${system.id}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <Link
              href="/portal"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{system.title}</h1>
              <p className="text-muted-foreground mt-1 max-w-2xl">
                {system.result?.systemOverview || system.prompt}
              </p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Active
            </Badge>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Actions Panel */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Available Actions</CardTitle>
                <CardDescription>
                  Click an action to use this system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {actions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-muted-foreground">
                      Actions are being configured for this system.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {actions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleActionClick(action)}
                        className="flex items-start gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left group"
                      >
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:shadow">
                          {getIcon(action.icon, action.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{action.label}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {action.description}
                          </p>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {action.type === "form" && "Input Form"}
                            {action.type === "dashboard" && "View Data"}
                            {action.type === "trigger" && "Quick Action"}
                            {action.type === "ai_chat" && "AI Assistant"}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Activity Feed */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p>No activity yet</p>
                    <p className="text-xs mt-1">Use an action to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex gap-3 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                        <div>
                          <p>{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedAction && (
            <ActionHandler
              action={selectedAction}
              system={system}
              client={client}
              onClose={handleDialogClose}
              onSuccess={(activity) => {
                setRecentActivity((prev) => [activity, ...prev].slice(0, 10));
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ActionHandlerProps {
  action: SystemAction;
  system: SystemBuild;
  client: Client;
  onClose: () => void;
  onSuccess: (activity: SystemActivity) => void;
}

function ActionHandler({ action, system, client, onClose, onSuccess }: ActionHandlerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    data?: Record<string, unknown>;
  } | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/portal/execute-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemId: system.id,
          clientId: client.id,
          actionId: action.id,
          actionType: action.type,
          aiPrompt: action.aiPrompt,
          data: formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: data.message, data: data.result });
        onSuccess({
          id: crypto.randomUUID(),
          system_id: system.id,
          client_id: client.id,
          action_type: action.type,
          description: `${action.label} completed successfully`,
          metadata: formData,
          created_at: new Date().toISOString(),
        });
      } else {
        setResult({ success: false, message: data.error || "Action failed" });
      }
    } catch (error) {
      setResult({ success: false, message: "Something went wrong" });
    } finally {
      setIsLoading(false);
    }
  }

  // Show result screen
  if (result) {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <Zap className="w-5 h-5 text-red-600" />
            )}
            {result.success ? "Success!" : "Error"}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className={result.success ? "text-green-700" : "text-red-700"}>
            {result.message}
          </p>
          {result.data && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">AI Response:</p>
              <div className="text-sm whitespace-pre-wrap">
                {typeof result.data === "string"
                  ? result.data
                  : JSON.stringify(result.data, null, 2)}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => {
              setResult(null);
              setFormData({});
            }}
          >
            Do Another
          </Button>
        </div>
      </>
    );
  }

  // Form action
  if (action.type === "form" && action.fields) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{action.label}</DialogTitle>
          <DialogDescription>{action.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {action.fields.map((field) => (
            <FormField
              key={field.name}
              field={field}
              value={formData[field.name] || ""}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, [field.name]: value }))
              }
            />
          ))}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </form>
      </>
    );
  }

  // Trigger action (one-click)
  if (action.type === "trigger") {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{action.label}</DialogTitle>
          <DialogDescription>{action.description}</DialogDescription>
        </DialogHeader>
        <div className="py-6 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground mb-6">
            Click the button below to execute this action.
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Execute
                </>
              )}
            </Button>
          </div>
        </div>
      </>
    );
  }

  // AI Chat action
  if (action.type === "ai_chat") {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{action.label}</DialogTitle>
          <DialogDescription>{action.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="message">Your Message</Label>
            <Textarea
              id="message"
              placeholder="Type your request here..."
              rows={4}
              value={formData.message || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, message: e.target.value }))
              }
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </form>
      </>
    );
  }

  // Dashboard action (shows data)
  if (action.type === "dashboard") {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{action.label}</DialogTitle>
          <DialogDescription>{action.description}</DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Dashboard view coming soon.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              This will show your {action.dataSource || "data"} analytics.
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </>
    );
  }

  return null;
}

interface FormFieldProps {
  field: ActionField;
  value: string;
  onChange: (value: string) => void;
}

function FormField({ field, value, onChange }: FormFieldProps) {
  const commonProps = {
    id: field.name,
    name: field.name,
    placeholder: field.placeholder,
    required: field.required,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {field.type === "textarea" ? (
        <Textarea {...commonProps} rows={3} />
      ) : field.type === "select" && field.options ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input {...commonProps} type={field.type} />
      )}
    </div>
  );
}
