import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { LoanApplicationRow, LoanStage } from "@/types/database.types";

const loanColumns = "id, borrower_name, property_address, loan_amount, stage, priority, expected_close_date, created_at";

export type LoanRecord = Pick<
  LoanApplicationRow,
  | "id"
  | "borrower_name"
  | "property_address"
  | "loan_amount"
  | "stage"
  | "priority"
  | "expected_close_date"
  | "created_at"
>;

function assertNoError(error: { message: string } | null) {
  if (!error) return;
  throw new Error(error.message);
}

export async function listLoans(): Promise<LoanRecord[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("loan_applications")
    .select(loanColumns)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

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
};

export async function createLoan(params: CreateLoanParams): Promise<LoanRecord> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("loan_applications")
    .insert({
      borrower_name: params.borrowerName,
      property_address: params.propertyAddress,
      loan_amount: params.loanAmount,
      stage: "application",
      priority: params.priority ?? "medium",
      expected_close_date: params.expectedCloseDate ?? null,
    })
    .select(loanColumns)
    .single();

  assertNoError(error);
  if (!data) {
    throw new Error("Loan was created but no row was returned.");
  }
  return data;
}

export async function updateLoanStage(loanId: string, stage: LoanStage): Promise<LoanRecord> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("loan_applications")
    .update({ stage })
    .eq("id", loanId)
    .is("deleted_at", null)
    .select(loanColumns)
    .single();

  assertNoError(error);
  if (!data) {
    throw new Error("Stage update succeeded but no row was returned.");
  }
  return data;
}

export async function deleteLoan(loanId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("loan_applications")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", loanId)
    .is("deleted_at", null);

  assertNoError(error);
}
