import { redirect, notFound } from "next/navigation";
import { getPortalSession } from "@/app/actions/portal-auth";
import { getSystemBuild } from "@/app/actions/system-builds";
import SystemPortalClient from "./system-portal-client";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ action?: string }>;
}

export default async function SystemPortalPage({ params, searchParams }: PageProps) {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  const { id } = await params;
  const { action } = await searchParams;

  try {
    const system = await getSystemBuild(id);

    // Verify client has access to this system
    if (system.client_id !== session.clientId) {
      notFound();
    }

    return (
      <SystemPortalClient
        system={system}
        client={session.client}
        activeActionId={action}
      />
    );
  } catch (error) {
    notFound();
  }
}
