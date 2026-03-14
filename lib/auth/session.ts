import { createServerClient } from "@/lib/supabase/server";
import { DEFAULT_ROLE, isProfileRole } from "@/lib/auth/roles";
import type { ProfileRole } from "@/types/database.types";

export type AuthenticatedViewer = {
  userId: string;
  email: string | null;
  fullName: string | null;
  role: ProfileRole | null;
};

export async function getAuthenticatedViewer(): Promise<AuthenticatedViewer | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const fallbackName =
    typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
  const safeRole: ProfileRole =
    !error && isProfileRole(profile?.role) ? profile.role : DEFAULT_ROLE;

  return {
    userId: user.id,
    email: user.email ?? null,
    fullName: !error ? profile?.full_name ?? fallbackName : fallbackName,
    role: safeRole,
  };
}
