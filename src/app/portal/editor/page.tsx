import { redirect } from "next/navigation";
import { getPortalSession, getClientAutomations } from "@/app/actions/portal-auth";
import PortalShell from "@/components/portal/portal-shell";
import VisualEditor from "./visual-editor";

interface EditorPageProps {
  searchParams: Promise<{
    automationId?: string;
  }>;
}

export default async function EditorPage({ searchParams }: EditorPageProps) {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  const params = await searchParams;
  const automations = await getClientAutomations(session.clientId);

  // Find existing automation if editing
  const existingAutomation = params.automationId
    ? automations?.find((a) => a.id === params.automationId)
    : null;

  return (
    <PortalShell client={session.client} pageTitle="Visual Editor" showChat={false}>
      <VisualEditor
        clientId={session.clientId}
        existingAutomation={existingAutomation}
      />
    </PortalShell>
  );
}
