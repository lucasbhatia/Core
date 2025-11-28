"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  Cpu,
  BarChart3,
  Activity,
  History,
  Plug,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const mainNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "AI Workspace", href: "/workspace", icon: Sparkles },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Audit Requests", href: "/audits", icon: ClipboardList },
];

const toolsNav = [
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Integrations", href: "/integrations", icon: Plug },
  { name: "Reports", href: "/reports", icon: FileText },
];

const systemNav = [
  { name: "System Health", href: "/system-health", icon: Activity },
  { name: "Audit Log", href: "/audit-log", icon: History },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-background"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col transition-transform duration-300 lg:translate-x-0",
          "sidebar-themed border-r",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-[hsl(var(--sidebar-border))]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--sidebar-accent))]">
            <Cpu className="h-5 w-5 text-[hsl(var(--sidebar-bg))]" />
          </div>
          <div>
            <h1 className="text-lg font-bold">CoreOS Hub</h1>
            <p className="text-xs opacity-70">Core Automations</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {/* Main Section */}
          <div className="space-y-1">
            {mainNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-bg))] shadow-lg"
                      : "opacity-80 hover:opacity-100 hover:bg-[hsl(var(--sidebar-accent)/0.1)]"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Tools Section */}
          <div className="mt-6">
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider opacity-50">
              Tools
            </p>
            <div className="space-y-1">
              {toolsNav.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-bg))] shadow-lg"
                        : "opacity-80 hover:opacity-100 hover:bg-[hsl(var(--sidebar-accent)/0.1)]"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* System Section */}
          <div className="mt-6">
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider opacity-50">
              System
            </p>
            <div className="space-y-1">
              {systemNav.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-bg))] shadow-lg"
                        : "opacity-80 hover:opacity-100 hover:bg-[hsl(var(--sidebar-accent)/0.1)]"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="border-t border-[hsl(var(--sidebar-border))]" />

        {/* User section */}
        <div className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 opacity-80 hover:opacity-100 hover:bg-[hsl(var(--sidebar-accent)/0.1)]"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </aside>
    </>
  );
}
