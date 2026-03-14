import { isStaffRole } from "@/lib/auth/roles";
import type { AuthenticatedViewer } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { LoanApplicationRow, LoanPriority, LoanRecord, LoanStage } from "@/types/database.types";

const pipelineLoanColumns = [
  "id",
  "borrower_id",
  "loan_officer_id",
  "borrower_name",
  "property_address",
  "loan_amount",
  "stage",
  "priority",
  "expected_close_date",
  "created_at",
  "updated_at",
  "deleted_at",
].join(", ");

const pipelineLoanPublicColumns = [
  "id",
  "borrower_name",
  "property_address",
  "loan_amount",
  "stage",
  "priority",
  "expected_close_date",
  "created_at",
  "updated_at",
].join(", ");

export type PipelineLoanRecord = Pick<
  LoanApplicationRow,
  | "id"
  | "borrower_id"
  | "loan_officer_id"
  | "borrower_name"
  | "property_address"
  | "loan_amount"
  | "stage"
  | "priority"
  | "expected_close_date"
  | "created_at"
  | "updated_at"
  | "deleted_at"
>;

type CreatePipelineLoanParams = {
  borrowerName: string;
  expectedCloseDate?: string | null;
  loanAmount: number;
  priority?: LoanPriority;
  propertyAddress: string;
};

function assertNoError(error: { message: string } | null) {
  if (!error) return;
  throw new Error(error.message);
}

function isMissingLoanAssignments(error: { message: string } | null) {
  if (!error) return false;
  return (
    error.message.includes('column "borrower_id" does not exist') ||
    error.message.includes('column "loan_officer_id" does not exist')
  );
}

function canManagePipelineLoan(loan: PipelineLoanRecord, viewer: AuthenticatedViewer) {
  if (!viewer.role || !isStaffRole(viewer.role) || loan.deleted_at) {
    return false;
  }

  if (viewer.role === "loan_officer") {
    return !loan.loan_officer_id || loan.loan_officer_id === viewer.userId;
  }

  return true;
}

async function listActiveLoansFallback(): Promise<LoanRecord[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("loan_applications")
    .select(pipelineLoanPublicColumns)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error?.message.includes("Could not find the table")) {
    return [];
  }

  assertNoError(error);
  return (data ?? []) as unknown as LoanRecord[];
}

export async function listPipelineLoansForViewer(
  viewer: AuthenticatedViewer,
): Promise<LoanRecord[]> {
  if (!viewer.role || !isStaffRole(viewer.role)) {
    return [];
  }

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("loan_applications")
    .select(pipelineLoanColumns)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (viewer.role === "loan_officer") {
    query = query.or(`loan_officer_id.eq.${viewer.userId},loan_officer_id.is.null`);
  }

  const { data, error } = await query;
  if (isMissingLoanAssignments(error)) {
    return listActiveLoansFallback();
  }

  if (error?.message.includes("Could not find the table")) {
    return [];
  }

  assertNoError(error);
  return ((data ?? []) as unknown as PipelineLoanRecord[]).map<LoanRecord>((loan) => ({
    id: loan.id,
    borrower_name: loan.borrower_name,
    property_address: loan.property_address,
    loan_amount: loan.loan_amount,
    stage: loan.stage,
    priority: loan.priority,
    expected_close_date: loan.expected_close_date,
    created_at: loan.created_at,
    updated_at: loan.updated_at,
  }));
}

export async function getPipelineLoanById(loanId: string): Promise<PipelineLoanRecord | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("loan_applications")
    .select(pipelineLoanColumns)
    .eq("id", loanId)
    .maybeSingle();

  if (isMissingLoanAssignments(error)) {
    const fallback = await supabase
      .from("loan_applications")
      .select(`${pipelineLoanPublicColumns}, deleted_at`)
      .eq("id", loanId)
      .maybeSingle();

    assertNoError(fallback.error);
    if (!fallback.data) {
      return null;
    }

    return {
      ...(fallback.data as unknown as Omit<PipelineLoanRecord, "borrower_id" | "loan_officer_id">),
      borrower_id: null,
      loan_officer_id: null,
    };
  }

  assertNoError(error);
  return (data as PipelineLoanRecord | null) ?? null;
}

export async function createPipelineLoan(
  viewer: AuthenticatedViewer,
  params: CreatePipelineLoanParams,
): Promise<LoanRecord> {
  if (!viewer.role || !isStaffRole(viewer.role)) {
    throw new Error("Only staff users can create pipeline loans.");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("loan_applications")
    .insert({
      borrower_name: params.borrowerName,
      expected_close_date: params.expectedCloseDate ?? null,
      loan_amount: params.loanAmount,
      loan_officer_id: viewer.role === "loan_officer" ? viewer.userId : null,
      priority: params.priority ?? "medium",
      property_address: params.propertyAddress,
      stage: "application",
    })
    .select(pipelineLoanPublicColumns)
    .single();

  if (isMissingLoanAssignments(error)) {
    const fallback = await supabase
      .from("loan_applications")
      .insert({
        borrower_name: params.borrowerName,
        expected_close_date: params.expectedCloseDate ?? null,
        loan_amount: params.loanAmount,
        priority: params.priority ?? "medium",
        property_address: params.propertyAddress,
        stage: "application",
      })
      .select(pipelineLoanPublicColumns)
      .single();

    assertNoError(fallback.error);
    if (!fallback.data) {
      throw new Error("Loan was created but no row was returned.");
    }

    return fallback.data as unknown as LoanRecord;
  }

  assertNoError(error);
  if (!data) {
    throw new Error("Loan was created but no row was returned.");
  }

  return data as unknown as LoanRecord;
}

export async function updatePipelineLoanStage(
  loanId: string,
  stage: LoanStage,
  viewer: AuthenticatedViewer,
): Promise<LoanRecord | null> {
  const loan = await getPipelineLoanById(loanId);
  if (!loan || !canManagePipelineLoan(loan, viewer)) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("loan_applications")
    .update({ stage })
    .eq("id", loanId)
    .is("deleted_at", null)
    .select(pipelineLoanPublicColumns)
    .single();

  assertNoError(error);
  return (data as LoanRecord | null) ?? null;
}

export async function archivePipelineLoan(
  loanId: string,
  viewer: AuthenticatedViewer,
): Promise<boolean> {
  const loan = await getPipelineLoanById(loanId);
  if (!loan || !canManagePipelineLoan(loan, viewer)) {
    return false;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("loan_applications")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", loanId)
    .is("deleted_at", null);

  assertNoError(error);
  return true;
}
