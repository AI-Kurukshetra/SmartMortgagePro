import { DEFAULT_ROLE, isProfileRole, isStaffRole } from "@/lib/auth/roles";
import { createServerClient } from "@/lib/supabase/server";
import type { LoanRecord, LoanStage, ProfileRole } from "@/types/database.types";

const loanColumns =
  "id, borrower_id, loan_officer_id, borrower_name, property_address, loan_amount, stage, priority, expected_close_date, created_at, updated_at";

function assertNoError(error: { message: string } | null) {
  if (!error) return;
  throw new Error(error.message);
}

async function getViewer() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  assertNoError(userError);

  if (!user) {
    return {
      supabase,
      userId: null,
      role: DEFAULT_ROLE,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  assertNoError(profileError);

  const role: ProfileRole = isProfileRole(profile?.role) ? profile.role : DEFAULT_ROLE;
  return {
    supabase,
    userId: user.id,
    role,
  };
}

function assertStaffRole(role: ProfileRole) {
  if (!isStaffRole(role)) {
    throw new Error("Forbidden: staff role required.");
  }
}

export async function listLoans(): Promise<LoanRecord[]> {
  const { supabase, userId, role } = await getViewer();
  if (!userId) {
    return [];
  }

  let query = supabase
    .from("loan_applications")
    .select(loanColumns)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (role === "borrower") {
    query = query.eq("borrower_id", userId);
  } else if (role === "loan_officer") {
    query = query.eq("loan_officer_id", userId);
  } else if (!isStaffRole(role)) {
    query = query.eq("borrower_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    if (error.message.includes("Could not find the table")) {
      return [];
    }
    throw new Error(error.message);
  }

  return (data ?? []) as LoanRecord[];
}

type CreateLoanParams = {
  borrowerName: string;
  propertyAddress: string;
  loanAmount: number;
  priority?: LoanRecord["priority"];
  expectedCloseDate?: string | null;
  borrowerId?: string | null;
  loanOfficerId?: string | null;
};

export async function createLoan(params: CreateLoanParams): Promise<LoanRecord> {
  const { supabase, userId, role } = await getViewer();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  assertStaffRole(role);

  const assignedOfficerId = params.loanOfficerId ?? (role === "loan_officer" ? userId : null);

  const { data, error } = await supabase
    .from("loan_applications")
    .insert({
      borrower_name: params.borrowerName,
      property_address: params.propertyAddress,
      loan_amount: params.loanAmount,
      stage: "application",
      priority: params.priority ?? "medium",
      expected_close_date: params.expectedCloseDate ?? null,
      loan_officer_id: assignedOfficerId,
      borrower_id: params.borrowerId ?? null,
    })
    .select(loanColumns)
    .single();

  assertNoError(error);
  if (!data) {
    throw new Error("Loan was created but no row was returned.");
  }
  return data as LoanRecord;
}

export async function updateLoanStage(loanId: string, stage: LoanStage): Promise<LoanRecord> {
  const { supabase, userId, role } = await getViewer();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  assertStaffRole(role);

  let query = supabase
    .from("loan_applications")
    .update({ stage })
    .eq("id", loanId)
    .is("deleted_at", null);

  if (role === "loan_officer") {
    query = query.eq("loan_officer_id", userId);
  }

  const { data, error } = await query.select(loanColumns).single();
  assertNoError(error);

  if (!data) {
    throw new Error("Stage update succeeded but no row was returned.");
  }

  return data as LoanRecord;
}

export async function deleteLoan(loanId: string): Promise<void> {
  const { supabase, userId, role } = await getViewer();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  assertStaffRole(role);

  let query = supabase
    .from("loan_applications")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", loanId)
    .is("deleted_at", null);

  if (role === "loan_officer") {
    query = query.eq("loan_officer_id", userId);
  }

  const { error } = await query;
  assertNoError(error);
}
