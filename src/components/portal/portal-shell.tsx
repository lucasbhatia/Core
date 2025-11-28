"use client";

import { useState, useEffect } from "react";
import PortalSidebar from "./portal-sidebar";
import PortalHeader from "./portal-header";
import AIChat from "./ai-chat";
import type { Client } from "@/types/database";

interface PortalShellProps {
  children: React.ReactNode;
  client: Client;
  pageTitle?: string;
  showChat?: boolean;
  notificationCount?: number;
}

export default function PortalShell({
  children,
  client,
  pageTitle,
  showChat = true,
  notificationCount = 0,
}: PortalShellProps) {
  const [isMounted, setIsMounted] = useState(false);

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
      <div className="pl-[260px] transition-all duration-300">
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
