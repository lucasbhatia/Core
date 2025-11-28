"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Client, SystemBuild, SystemAction } from "@/types/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutPortal } from "@/app/actions/portal-auth";
import {
  LogOut,
  Settings,
  Zap,
  PlusCircle,
  BarChart3,
  Send,
  MessageSquare,
  ChevronRight,
  Building2,
  User,
} from "lucide-react";
import Link from "next/link";

interface PortalDashboardProps {
  client: Client;
  systems: SystemBuild[];
}

// Icon mapping for action types
const actionIcons: Record<string, React.ReactNode> = {
  form: <PlusCircle className="w-5 h-5" />,
  dashboard: <BarChart3 className="w-5 h-5" />,
  trigger: <Send className="w-5 h-5" />,
  ai_chat: <MessageSquare className="w-5 h-5" />,
};

// Get icon by name or fallback
function getActionIcon(iconName: string, type: string) {
  const iconMap: Record<string, React.ReactNode> = {
    "plus-circle": <PlusCircle className="w-5 h-5" />,
    "bar-chart": <BarChart3 className="w-5 h-5" />,
    "send": <Send className="w-5 h-5" />,
    "message-square": <MessageSquare className="w-5 h-5" />,
    "zap": <Zap className="w-5 h-5" />,
  };
  return iconMap[iconName] || actionIcons[type] || <Zap className="w-5 h-5" />;
}

export default function PortalDashboard({ client, systems }: PortalDashboardProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    await logoutPortal();
    router.push("/portal/login");
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-lg">Client Portal</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="hidden sm:inline">{client.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-medium">{client.name}</p>
                  <p className="text-muted-foreground">{client.email}</p>
                </div>
                <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  {isLoggingOut ? "Logging out..." : "Log out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {client.name.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Access your automation systems below
          </p>
        </div>

        {/* Company Info */}
        <Card className="mb-8">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">{client.company}</p>
              <p className="text-sm text-muted-foreground">{client.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Systems Grid */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Your Systems</h2>
        </div>

        {systems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">No Systems Yet</h3>
              <p className="text-muted-foreground">
                Your automation systems will appear here once they&apos;re ready.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {systems.map((system) => (
              <SystemCard key={system.id} system={system} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SystemCard({ system }: { system: SystemBuild }) {
  const actions = (system.actions || []) as SystemAction[];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{system.title}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {system.result?.systemOverview || system.prompt}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {actions.length > 0 ? (
          <div className="space-y-2">
            {actions.slice(0, 3).map((action) => (
              <Link
                key={action.id}
                href={`/portal/systems/${system.id}?action=${action.id}`}
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center shadow-sm">
                    {getActionIcon(action.icon, action.type)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </Link>
            ))}
            {actions.length > 3 && (
              <Link
                href={`/portal/systems/${system.id}`}
                className="block text-center text-sm text-primary hover:underline pt-2"
              >
                View all {actions.length} actions
              </Link>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <p>System is being configured...</p>
            <Link
              href={`/portal/systems/${system.id}`}
              className="text-primary hover:underline"
            >
              View Details
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
