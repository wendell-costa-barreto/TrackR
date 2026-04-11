import { supabase } from "./supabase";
import type { Application, Status } from "../types/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert a Supabase row → our frontend Application shape */
function rowToApp(row: {
  id: string;
  company: string;
  role: string;
  status: string;
  salary: string | null;
  applied_at: string;
logo: string | null;
notes: string | null;
}): Application {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    status: row.status as Status,
    salary: row.salary ?? "—",
    applied: new Date(row.applied_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    logo: row.logo ?? row.company[0].toUpperCase(),
    notes: row.notes ?? "",
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────

/** Fetch all applications for the currently signed-in user */
export async function fetchApplications(): Promise<Application[]> {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("applied_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToApp);
}

/** Insert a new application */
export async function createApplication(
  partial: Omit<Application, "id">
): Promise<Application> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("applications")
    .insert({
      user_id: user.id,
      company: partial.company,
      role: partial.role,
      status: partial.status,
      salary: partial.salary,
      applied_at: new Date().toISOString(),
      logo: partial.logo,
      notes: partial.notes,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToApp(data);
}

/** Update the status of an application */
export async function updateStatus(id: string, status: Status): Promise<void> {
  const { error } = await supabase
    .from("applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

/** Update the notes of an application */
export async function updateNotes(id: string, notes: string): Promise<void> {
  const { error } = await supabase
    .from("applications")
    .update({ notes, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

/** Delete an application by id */
export async function deleteApplication(id: string): Promise<void> {
  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", id);

  if (error) throw error;
}