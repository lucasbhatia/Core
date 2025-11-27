"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Client } from "@/types/database";

export async function getClients() {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching clients:", error);
    throw new Error(error.message);
  }

  return data as Client[];
}

export async function getClient(id: string) {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Client;
}

export async function createClient(formData: {
  name: string;
  company: string;
  email: string;
  phone?: string;
  notes?: string;
}) {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("clients")
    .insert([
      {
        name: formData.name,
        company: formData.company,
        email: formData.email,
        phone: formData.phone || null,
        notes: formData.notes || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating client:", error);
    throw new Error(error.message);
  }

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return data as Client;
}

export async function updateClient(
  id: string,
  formData: {
    name: string;
    company: string;
    email: string;
    phone?: string;
    notes?: string;
  }
) {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("clients")
    .update({
      name: formData.name,
      company: formData.company,
      email: formData.email,
      phone: formData.phone || null,
      notes: formData.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return data as Client;
}

export async function deleteClient(id: string) {
  const supabase = await createSupabaseClient();

  const { error } = await supabase.from("clients").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/clients");
  revalidatePath("/dashboard");
}
