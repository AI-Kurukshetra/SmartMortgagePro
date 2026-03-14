import { DEFAULT_ROLE, isProfileRole, isStaffRole } from "@/lib/auth/roles";
import { assertViewerCanAccessLoan } from "@/lib/services/loan-access";
import { createServerClient } from "@/lib/supabase/server";
import type { ProfileRole } from "@/types/database.types";

export type ComplianceViewer = {
  userId: string;
  email: string | null;
  fullName: string;
  role: ProfileRole;
};

export async function getCurrentComplianceViewer(): Promise<ComplianceViewer | null> {
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

  if (error) {
    throw new Error(error.message);
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    fullName: profile?.full_name?.trim() || user.email || "Unknown user",
    role: isProfileRole(profile?.role) ? profile.role : DEFAULT_ROLE,
  };
}

export async function assertComplianceLoanAccess(
  loanId: string,
  options?: {
    requireStaff?: boolean;
  },
) {
  const viewer = await getCurrentComplianceViewer();
  if (!viewer) {
    return { viewer: null, allowed: false as const, reason: "unauthorized" as const };
  }

  if (options?.requireStaff && !isStaffRole(viewer.role)) {
    return { viewer, allowed: false as const, reason: "forbidden" as const };
  }

  const loan = await assertViewerCanAccessLoan(loanId, {
    userId: viewer.userId,
    role: viewer.role,
  });

  if (!loan) {
    return { viewer, allowed: false as const, reason: "forbidden" as const };
  }

  return {
    viewer,
    loan,
    allowed: true as const,
  };
}
