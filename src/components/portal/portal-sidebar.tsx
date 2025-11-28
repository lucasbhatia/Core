"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Bot,
  FolderOpen,
  BarChart3,
  Settings,
  CreditCard,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Zap,
  Bell,
  HelpCircle,
  Users,
  Sparkles,
} from "lucide-react";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeVariant?: "default" | "secondary" | "destructive";
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

const sidebarGroups: SidebarGroup[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/portal", icon: LayoutDashboard },
      { label: "My Automations", href: "/portal/automations", icon: Bot },
      { label: "Results Library", href: "/portal/deliverables", icon: FolderOpen },
    ],
  },
  {
    title: "Build",
    items: [
      { label: "Create Automation", href: "/portal/builder", icon: PlusCircle, badge: "New" },
      { label: "Templates", href: "/portal/templates", icon: Sparkles },
    ],
  },
  {
    title: "Insights",
    items: [
      { label: "Analytics", href: "/portal/analytics", icon: BarChart3 },
      { label: "Activity", href: "/portal/activity", icon: Bell },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Usage & Billing", href: "/portal/billing", icon: CreditCard },
      { label: "Team", href: "/portal/team", icon: Users },
      { label: "Settings", href: "/portal/settings", icon: Settings },
    ],
  },
];

interface PortalSidebarProps {
  clientName?: string;
  companyName?: string;
  notificationCount?: number;
}

export default function PortalSidebar({
  clientName,
  companyName,
  notificationCount = 0,
}: PortalSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Update notification badge
  const groupsWithBadges = sidebarGroups.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      if (item.href === "/portal/activity" && notificationCount > 0) {
        return { ...item, badge: notificationCount, badgeVariant: "destructive" as const };
      }
      return item;
    }),
  }));

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white border-r transition-all duration-300 flex flex-col",
          isCollapsed ? "w-[70px]" : "w-[260px]"
        )}
      >
        {/* Logo/Brand */}
        <div className="h-16 border-b flex items-center justify-between px-4">
          {!isCollapsed && (
            <Link href="/portal" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-lg">Portal</span>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/portal" className="mx-auto">
              <div className="w-8 h-8 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {groupsWithBadges.map((group) => (
            <div key={group.title} className="mb-6">
              {!isCollapsed && (
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                  {group.title}
                </h4>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href ||
                    (item.href !== "/portal" && pathname.startsWith(item.href));

                  const linkContent = (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                        isActive
                          ? "bg-gradient-to-r from-violet-50 to-indigo-50 text-violet-700"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                        isCollapsed && "justify-center"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "w-5 h-5 flex-shrink-0",
                          isActive ? "text-violet-600" : ""
                        )}
                      />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 font-medium text-sm">{item.label}</span>
                          {item.badge && (
                            <Badge
                              variant={item.badgeVariant || "secondary"}
                              className={cn(
                                "text-xs",
                                item.badgeVariant === "destructive"
                                  ? ""
                                  : "bg-violet-100 text-violet-700"
                              )}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Link>
                  );

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{item.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return <div key={item.href}>{linkContent}</div>;
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Info / Footer */}
        <div className="border-t p-4">
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 flex items-center justify-center">
                <span className="font-semibold text-violet-700">
                  {clientName?.charAt(0) || "C"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{clientName || "Client"}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {companyName || "Company"}
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/portal/settings">
                      <HelpCircle className="w-4 h-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Help & Support</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 flex items-center justify-center mx-auto cursor-pointer">
                  <span className="font-semibold text-violet-700">
                    {clientName?.charAt(0) || "C"}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{clientName || "Client"}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-white shadow-sm hover:bg-gray-100"
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </aside>
    </TooltipProvider>
  );
}
