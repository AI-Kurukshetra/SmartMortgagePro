import { createServerClient } from "@/lib/supabase/server";
import { DEFAULT_ROLE, isProfileRole } from "@/lib/auth/roles";
import type { ProfileRole } from "@/types/database.types";

export async function getCurrentViewerSession() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      role: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role: ProfileRole = isProfileRole(profile?.role) ? profile.role : DEFAULT_ROLE;

  return {
    supabase,
    user,
    role,
  };
}
