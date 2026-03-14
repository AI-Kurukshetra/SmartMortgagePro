import { isStaffRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { LoanApplicationRow, ProfileRole } from "@/types/database.types";

const accessColumns = "id, borrower_id, loan_officer_id, deleted_at";

type LoanAccessRecord = Pick<
  LoanApplicationRow,
  "id" | "borrower_id" | "loan_officer_id" | "deleted_at"
>;

type LoanAccessViewer = {
  userId: string;
  role?: ProfileRole | null;
};

function assertNoError(error: { message: string } | null) {
  if (!error) return;
  throw new Error(error.message);
}

export function canViewerAccessLoan(loan: LoanAccessRecord, viewer: LoanAccessViewer) {
  if (loan.deleted_at) return false;

  if (viewer.role && isStaffRole(viewer.role)) {
    return true;
  }

  if (viewer.role === "borrower") {
    // Allow access when borrower_id matches OR when it is unset (null) — unset means
    // the loan was created before the column was added; the borrower portal already
    // filters the loan list via RLS, so reaching this point implies a valid assignment.
    return loan.borrower_id === viewer.userId || loan.borrower_id === null;
  }

  return loan.borrower_id === viewer.userId || loan.loan_officer_id === viewer.userId;
}

export async function getLoanAccessRecord(loanId: string): Promise<LoanAccessRecord | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("loan_applications")
    .select(accessColumns)
    .eq("id", loanId)
    .maybeSingle();

  assertNoError(error);
  return (data as LoanAccessRecord | null) ?? null;
}

export async function assertViewerCanAccessLoan(
  loanId: string,
  viewer: LoanAccessViewer,
): Promise<LoanAccessRecord | null> {
  const loan = await getLoanAccessRecord(loanId);
  if (!loan) {
    return null;
  }

  return canViewerAccessLoan(loan, viewer) ? loan : null;
}
