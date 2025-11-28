"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Eye, Loader2 } from "lucide-react";

interface ClientPortalActionsProps {
  clientId: string;
  clientEmail: string;
}

export function ClientPortalActions({ clientId, clientEmail }: ClientPortalActionsProps) {
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isDev = process.env.NODE_ENV === "development";

  async function handleSendPortalLink() {
    setIsSendingLink(true);
    setMessage(null);

    try {
      const response = await fetch("/api/portal/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clientEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send portal link");
      }

      setMessage({ type: "success", text: "Portal link sent successfully!" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to send portal link"
      });
    } finally {
      setIsSendingLink(false);
    }
  }

  async function handlePreviewAsClient() {
    setIsPreviewing(true);
    setMessage(null);

    try {
      const response = await fetch("/api/portal/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create preview session");
      }

      // Open portal in new tab
      window.open("/portal", "_blank");
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to preview"
      });
    } finally {
      setIsPreviewing(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </span>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={handleSendPortalLink}
        disabled={isSendingLink}
        className="gap-2"
      >
        {isSendingLink ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        Send Portal Link
      </Button>

      {isDev && (
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviewAsClient}
          disabled={isPreviewing}
          className="gap-2"
        >
          {isPreviewing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          Preview Portal
        </Button>
      )}
    </div>
  );
}
