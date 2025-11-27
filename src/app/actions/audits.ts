"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Audit } from "@/types/database";

export async function getAudits(status?: string) {
  const supabase = await createSupabaseClient();

  let query = supabase
    .from("audits")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching audits:", error);
    throw new Error(error.message);
  }

  return data as Audit[];
}

export async function getAudit(id: string) {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("audits")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Audit;
}

export async function createAudit(formData: {
  client_name: string;
  email: string;
  business_url?: string;
  description?: string;
  status?: "new" | "in-progress" | "completed";
}) {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("audits")
    .insert([
      {
        client_name: formData.client_name,
        email: formData.email,
        business_url: formData.business_url || null,
        description: formData.description || null,
        status: formData.status || "new",
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating audit:", error);
    throw new Error(error.message);
  }

  revalidatePath("/audits");
  revalidatePath("/dashboard");
  return data as Audit;
}

export async function updateAuditStatus(
  id: string,
  status: "new" | "in-progress" | "completed"
) {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("audits")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/audits");
  revalidatePath("/dashboard");
  return data as Audit;
}

export async function deleteAudit(id: string) {
  const supabase = await createSupabaseClient();

  const { error } = await supabase.from("audits").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/audits");
  revalidatePath("/dashboard");
}

export async function convertAuditToProject(auditId: string, clientId: string) {
  const supabase = await createSupabaseClient();

  // Get the audit
  const { data: audit, error: auditError } = await supabase
    .from("audits")
    .select("*")
    .eq("id", auditId)
    .single();

  if (auditError) {
    throw new Error(auditError.message);
  }

  // Create the project
  const { error: projectError } = await supabase.from("projects").insert([
    {
      client_id: clientId,
      title: `Audit Project - ${audit.client_name}`,
      status: "active",
      deliverables: audit.description || "To be defined",
      timeline: "To be determined",
    },
  ]);

  if (projectError) {
    throw new Error(projectError.message);
  }

  // Update audit status to completed
  await supabase
    .from("audits")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", auditId);

  revalidatePath("/audits");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}
