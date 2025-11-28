import { redirect } from "next/navigation";
import { getPortalSession } from "@/app/actions/portal-auth";
import PortalShell from "@/components/portal/portal-shell";
import AutomationBuilder from "./automation-builder";

interface BuilderPageProps {
  searchParams: Promise<{
    template?: string;
    prompt?: string;
    name?: string;
  }>;
}

export default async function BuilderPage({ searchParams }: BuilderPageProps) {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  const params = await searchParams;

  return (
    <PortalShell client={session.client} pageTitle="Create Automation" showChat={false}>
      <AutomationBuilder
        clientId={session.clientId}
        templateId={params.template}
        templatePrompt={params.prompt}
        templateName={params.name}
      />
    </PortalShell>
  );
}
