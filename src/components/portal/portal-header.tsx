"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  LogOut,
  Settings,
  User,
  CreditCard,
  ChevronDown,
  Search,
  Command,
} from "lucide-react";
import { logoutPortal } from "@/app/actions/portal-auth";
import type { Client } from "@/types/database";

interface PortalHeaderProps {
  client: Client;
  notificationCount?: number;
  pageTitle?: string;
}

export default function PortalHeader({
  client,
  notificationCount = 0,
  pageTitle,
}: PortalHeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    await logoutPortal();
    router.push("/portal/login");
  }

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left: Page Title or Search */}
        <div className="flex items-center gap-4">
          {pageTitle ? (
            <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search automations, deliverables..."
                className="w-[300px] h-10 pl-10 pr-4 rounded-lg border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-sm"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <Command className="h-3 w-3" />K
              </kbd>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                  >
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[350px]">
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <span className="font-semibold">Notifications</span>
                {notificationCount > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs h-7">
                    Mark all read
                  </Button>
                )}
              </div>
              <div className="py-4 text-center text-sm text-muted-foreground">
                {notificationCount > 0
                  ? `You have ${notificationCount} new notifications`
                  : "No new notifications"}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-10 px-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 flex items-center justify-center">
                  <span className="font-semibold text-violet-700 text-sm">
                    {client.name?.charAt(0) || "C"}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium">{client.name}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2 border-b">
                <p className="font-medium text-sm">{client.name}</p>
                <p className="text-xs text-muted-foreground">{client.email}</p>
                {client.company && (
                  <p className="text-xs text-muted-foreground">{client.company}</p>
                )}
              </div>
              <DropdownMenuItem onClick={() => router.push("/portal/settings")}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/portal/billing")}>
                <CreditCard className="h-4 w-4 mr-2" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/portal/settings")}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-red-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isLoggingOut ? "Logging out..." : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
