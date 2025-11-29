"use client";

import { useState, useEffect } from "react";
import PortalSidebar from "./portal-sidebar";
import PortalHeader from "./portal-header";
import AIChat from "./ai-chat";
import { SidebarProvider, useSidebar } from "./sidebar-context";
import { cn } from "@/lib/utils";
import type { Client } from "@/types/database";

interface PortalShellProps {
  children: React.ReactNode;
  client: Client;
  pageTitle?: string;
  showChat?: boolean;
  notificationCount?: number;
}

function PortalShellContent({
  children,
  client,
  pageTitle,
  showChat = true,
  notificationCount = 0,
}: PortalShellProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <PortalSidebar
        clientName={client.name}
        companyName={client.company}
        notificationCount={notificationCount}
      />

      {/* Main Content Area */}
      <div className={cn(
        "transition-all duration-300",
        isCollapsed ? "pl-[70px]" : "pl-[260px]"
      )}>
        {/* Header */}
        <PortalHeader
          client={client}
          pageTitle={pageTitle}
          notificationCount={notificationCount}
        />

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>

      {/* AI Chat - only render on client */}
      {showChat && isMounted && <AIChat />}
    </div>
  );
}

export default function PortalShell(props: PortalShellProps) {
  return (
    <SidebarProvider>
      <PortalShellContent {...props} />
    </SidebarProvider>
  );
}
