import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  checkFeeTolerances,
  getToleranceType,
  type FeeInput,
  type FeeToleranceViolation,
} from "@/lib/services/fee-tolerance-checker";
import type {
  DisclosureFeeRow,
  DisclosureRow,
  DisclosureStatus,
  DisclosureType,
  LoanApplicationRow,
} from "@/types/database.types";

const loanColumns = [
  "id",
  "borrower_name",
  "property_address",
  "loan_amount",
  "priority",
  "stage",
  "expected_close_date",
  "created_at",
  "updated_at",
].join(", ");

const disclosureColumns = [
  "id",
  "loan_id",
  "type",
  "status",
  "version",
  "issued_date",
  "due_date",
  "sent_to_borrower_at",
  "acknowledged_by_borrower_at",
  "acknowledgement_method",
  "fees_snapshot",
  "loan_terms_snapshot",
  "state",
  "file_path",
  "generated_by",
  "supersedes_id",
  "change_of_circumstance_reason",
  "change_of_circumstance_notes",
  "created_at",
  "updated_at",
].join(", ");

const disclosureFeeColumns = [
  "id",
  "disclosure_id",
  "fee_name",
  "fee_category",
  "tolerance_type",
  "le_amount",
  "cd_amount",
].join(", ");

const PLACEHOLDER_TEST_LOAN = "[testLoanId]";
const PLACEHOLDER_VIOLATING_LOAN = "[violatingLoanId]";
const PLACEHOLDER_CD_DISCLOSURE = "[cdDisclosureId]";

export type LoanDisclosureSummary = Pick<
  LoanApplicationRow,
  | "id"
  | "borrower_name"
  | "property_address"
  | "loan_amount"
  | "priority"
  | "stage"
  | "expected_close_date"
  | "created_at"
  | "updated_at"
>;

export type DisclosureRecord = Pick<
  DisclosureRow,
  | "id"
  | "loan_id"
  | "type"
  | "status"
  | "version"
  | "issued_date"
  | "due_date"
  | "sent_to_borrower_at"
  | "acknowledged_by_borrower_at"
  | "acknowledgement_method"
  | "fees_snapshot"
  | "loan_terms_snapshot"
  | "state"
  | "file_path"
  | "supersedes_id"
  | "change_of_circumstance_reason"
  | "change_of_circumstance_notes"
  | "created_at"
  | "updated_at"
>;

export type DisclosureFeeRecord = Pick<
  DisclosureFeeRow,
  "id" | "disclosure_id" | "fee_name" | "fee_category" | "tolerance_type" | "le_amount" | "cd_amount"
>;

export type DisclosureDetail = {
  disclosure: DisclosureRecord;
  fees: DisclosureFeeRecord[];
  comparisonDisclosure: DisclosureRecord | null;
  comparisonFees: DisclosureFeeRecord[];
  toleranceResult: {
    compliant: boolean;
    violations: FeeToleranceViolation[];
  };
};

export const disclosureTypeLabels: Record<DisclosureType, string> = {
  loan_estimate: "Loan Estimate",
  closing_disclosure: "Closing Disclosure",
  intent_to_proceed: "Intent to Proceed",
  adverse_action: "Adverse Action",
  appraisal_notice: "Appraisal Notice",
};

export const disclosureStatusLabels: Record<DisclosureStatus, string> = {
  draft: "Draft",
  generated: "Generated",
  sent: "Sent",
  acknowledged: "Acknowledged",
  expired: "Expired",
  superseded: "Superseded",
};

const syntheticLoans: LoanDisclosureSummary[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    borrower_name: "Avery Johnson",
    property_address: "1204 W Fulton St, Chicago, IL 60607",
    loan_amount: 525000,
    priority: "medium",
    stage: "application",
    expected_close_date: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10),
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    borrower_name: "Sofia Carter",
    property_address: "87 Pine Brook Rd, Austin, TX 78704",
    loan_amount: 780000,
    priority: "high",
    stage: "underwriting",
    expected_close_date: new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10),
    created_at: new Date(Date.now() - 11 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

function hasDisclosureStorage() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function isMissingDisclosureTable(error: { message: string } | null) {
  if (!error) return false;
  return (
    error.message.includes("Could not find the table") ||
    error.message.includes('relation "disclosures" does not exist') ||
    error.message.includes('relation "disclosure_fees" does not exist')
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function assertNoError(error: { message: string } | null) {
  if (!error) return;
  throw new Error(error.message);
}

function toMiddayDate(value: string) {
  return new Date(`${value}T12:00:00Z`);
}

export function businessDays(date: Date, days: number): Date {
  let count = 0;
  const next = new Date(date);
  const direction = days >= 0 ? 1 : -1;
  const total = Math.abs(days);

  while (count < total) {
    next.setUTCDate(next.getUTCDate() + direction);
    const day = next.getUTCDay();
    if (day !== 0 && day !== 6) {
      count += 1;
    }
  }

  return next;
}

export function calculateTRIDDeadlines(applicationDate: Date, closingDate: Date) {
  return {
    leDeadline: businessDays(applicationDate, 3),
    earliestClosing: businessDays(applicationDate, 7),
    cdDeadline: businessDays(closingDate, -3),
  };
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getLoanState(loan: LoanDisclosureSummary) {
  const segments = loan.property_address.split(",");
  return segments[1]?.trim().split(" ").pop() ?? "IL";
}

function buildBaseFees(loan: LoanDisclosureSummary) {
  const origination = Math.round(loan.loan_amount * 0.0024);
  const underwriting = loan.priority === "high" ? 925 : 895;
  const recording = loan.loan_amount > 600000 ? 240 : 180;
  const flood = loan.priority === "high" ? 60 : 45;
  const prepaid = Math.round(loan.loan_amount * 0.0012);

  const le = [
    { name: "Origination Fee", category: "Origination Charges", amount: origination },
    { name: "Underwriting Fee", category: "Underwriting Fee", amount: underwriting },
    { name: "Recording Fees", category: "Recording Fees", amount: recording },
    {
      name: "Flood Certification",
      category: "Required Third-Party Services (shopping list)",
      amount: flood,
    },
    { name: "Prepaid Interest", category: "Prepaids", amount: prepaid },
  ] satisfies FeeInput[];

  const cd = le.map((fee) => ({ ...fee }));
  cd[1] = { ...cd[1], amount: underwriting + (loan.priority === "high" ? 35 : 0) };
  cd[2] = { ...cd[2], amount: Math.round(recording * 1.15) };
  cd[3] = { ...cd[3], amount: Math.round(flood * 1.25) };
  cd[4] = { ...cd[4], amount: prepaid + 40 };

  return { le, cd };
}

function buildSyntheticDisclosures(loan: LoanDisclosureSummary) {
  const applicationDate = new Date(loan.created_at);
  const closingDate = loan.expected_close_date
    ? toMiddayDate(loan.expected_close_date)
    : businessDays(applicationDate, 30);
  const deadlines = calculateTRIDDeadlines(applicationDate, closingDate);
  const { le, cd } = buildBaseFees(loan);

  const items: Array<{ disclosure: DisclosureRecord; fees: DisclosureFeeRecord[] }> = [
    {
      disclosure: {
        id: `${loan.id}-le-v1`,
        loan_id: loan.id,
        type: "loan_estimate",
        status: "acknowledged",
        version: 1,
        issued_date: addDays(applicationDate, 1).toISOString(),
        due_date: deadlines.leDeadline.toISOString(),
        sent_to_borrower_at: addDays(applicationDate, 1).toISOString(),
        acknowledged_by_borrower_at: addDays(applicationDate, 2).toISOString(),
        acknowledgement_method: "esigned",
        fees_snapshot: { count: le.length, mode: "initial" },
        loan_terms_snapshot: { loanAmount: loan.loan_amount, stage: loan.stage, state: getLoanState(loan) },
        state: getLoanState(loan),
        file_path: `disclosures/${loan.id}/loan-estimate-v1.pdf`,
        supersedes_id: null,
        change_of_circumstance_reason: null,
        change_of_circumstance_notes: null,
        created_at: applicationDate.toISOString(),
        updated_at: addDays(applicationDate, 1).toISOString(),
      },
      fees: le.map((fee, index) => ({
        id: `${loan.id}-le-fee-${index + 1}`,
        disclosure_id: `${loan.id}-le-v1`,
        fee_name: fee.name,
        fee_category: fee.category,
        tolerance_type: getToleranceType(fee.category),
        le_amount: fee.amount,
        cd_amount: fee.amount,
      })),
    },
    {
      disclosure: {
        id: `${loan.id}-cd-v1`,
        loan_id: loan.id,
        type: "closing_disclosure",
        status: loan.priority === "high" ? "generated" : "sent",
        version: 1,
        issued_date: addDays(closingDate, -5).toISOString(),
        due_date: deadlines.cdDeadline.toISOString(),
        sent_to_borrower_at: loan.priority === "high" ? null : addDays(closingDate, -4).toISOString(),
        acknowledged_by_borrower_at: null,
        acknowledgement_method: null,
        fees_snapshot: { count: cd.length, mode: "closing" },
        loan_terms_snapshot: { loanAmount: loan.loan_amount, stage: loan.stage, state: getLoanState(loan) },
        state: getLoanState(loan),
        file_path: `disclosures/${loan.id}/closing-disclosure-v1.pdf`,
        supersedes_id: null,
        change_of_circumstance_reason: loan.priority === "high" ? "Rate lock adjustment" : null,
        change_of_circumstance_notes:
          loan.priority === "high" ? "Updated underwriting conditions increased recording fees." : null,
        created_at: addDays(applicationDate, 2).toISOString(),
        updated_at: addDays(applicationDate, 3).toISOString(),
      },
      fees: cd.map((fee, index) => ({
        id: `${loan.id}-cd-fee-${index + 1}`,
        disclosure_id: `${loan.id}-cd-v1`,
        fee_name: fee.name,
        fee_category: fee.category,
        tolerance_type: getToleranceType(fee.category),
        le_amount: le[index]?.amount ?? null,
        cd_amount: fee.amount,
      })),
    },
  ];

  return items;
}

function getSyntheticLoanByIdentifier(loanId: string) {
  if (loanId === PLACEHOLDER_VIOLATING_LOAN) return syntheticLoans[1];
  if (loanId === PLACEHOLDER_TEST_LOAN) return syntheticLoans[0];
  return syntheticLoans.find((loan) => loan.id === loanId) ?? null;
}

async function listLoansFromDb(): Promise<LoanDisclosureSummary[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("loan_applications")
    .select(loanColumns)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  assertNoError(error);
  return ((data ?? []) as unknown) as LoanDisclosureSummary[];
}

async function resolveLoanSummary(loanId: string): Promise<LoanDisclosureSummary | null> {
  if (!hasDisclosureStorage()) {
    return getSyntheticLoanByIdentifier(loanId);
  }

  try {
    const loans = await listLoansFromDb();
    if (!loans.length) return getSyntheticLoanByIdentifier(loanId);
    if (loanId === PLACEHOLDER_VIOLATING_LOAN) {
      return loans.find((loan) => loan.priority === "high") ?? loans[0];
    }
    if (loanId === PLACEHOLDER_TEST_LOAN || !isUuid(loanId)) {
      return loans[0];
    }
    return loans.find((loan) => loan.id === loanId) ?? null;
  } catch {
    return getSyntheticLoanByIdentifier(loanId);
  }
}

export async function getLoanDisclosureSummary(loanId: string) {
  return resolveLoanSummary(loanId);
}

async function listDisclosureFees(disclosureIds: string[]) {
  if (!disclosureIds.length || !hasDisclosureStorage()) return [];

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("disclosure_fees")
      .select(disclosureFeeColumns)
      .in("disclosure_id", disclosureIds);

    if (isMissingDisclosureTable(error)) return [];
    assertNoError(error);
    return ((data ?? []) as unknown) as DisclosureFeeRecord[];
  } catch {
    return [];
  }
}

export async function listDisclosuresByLoanId(loanId: string) {
  const loan = await resolveLoanSummary(loanId);
  if (!loan) return [];

  if (!hasDisclosureStorage() || !isUuid(loan.id)) {
    return buildSyntheticDisclosures(loan).map((item) => item.disclosure);
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("disclosures")
      .select(disclosureColumns)
      .eq("loan_id", loan.id)
      .order("created_at", { ascending: false });

    if (isMissingDisclosureTable(error)) {
      return buildSyntheticDisclosures(loan).map((item) => item.disclosure);
    }

    assertNoError(error);
    const records = ((data ?? []) as unknown) as DisclosureRecord[];
    return records.length ? records : buildSyntheticDisclosures(loan).map((item) => item.disclosure);
  } catch {
    return buildSyntheticDisclosures(loan).map((item) => item.disclosure);
  }
}

async function getDisclosureFeesWithFallback(
  loan: LoanDisclosureSummary,
  disclosure: DisclosureRecord,
) {
  if (!hasDisclosureStorage() || !isUuid(disclosure.id)) {
    return (
      buildSyntheticDisclosures(loan).find((item) => item.disclosure.id === disclosure.id)?.fees ?? []
    );
  }

  const fees = await listDisclosureFees([disclosure.id]);
  if (fees.length) return fees.filter((fee) => fee.disclosure_id === disclosure.id);

  return (
    buildSyntheticDisclosures(loan).find((item) => item.disclosure.id === disclosure.id)?.fees ?? []
  );
}

function resolveDisclosureFromList(disclosures: DisclosureRecord[], disclosureId: string) {
  if (disclosureId === PLACEHOLDER_CD_DISCLOSURE) {
    return disclosures.find((item) => item.type === "closing_disclosure") ?? disclosures[0] ?? null;
  }
  return disclosures.find((item) => item.id === disclosureId) ?? null;
}

export async function getDisclosureDetail(loanId: string, disclosureId: string): Promise<DisclosureDetail | null> {
  const loan = await resolveLoanSummary(loanId);
  if (!loan) return null;

  const disclosures = await listDisclosuresByLoanId(loan.id);
  const disclosure = resolveDisclosureFromList(disclosures, disclosureId);
  if (!disclosure) return null;

  const fees = await getDisclosureFeesWithFallback(loan, disclosure);
  const comparisonDisclosure =
    disclosure.type === "closing_disclosure"
      ? disclosures.find((item) => item.type === "loan_estimate") ?? null
      : null;
  const comparisonFees = comparisonDisclosure
    ? await getDisclosureFeesWithFallback(loan, comparisonDisclosure)
    : [];

  const toleranceResult = comparisonDisclosure
    ? checkFeeTolerances(
        comparisonFees.map((fee) => ({
          name: fee.fee_name,
          category: fee.fee_category,
          amount: Number(fee.le_amount ?? fee.cd_amount ?? 0),
        })),
        fees.map((fee) => ({
          name: fee.fee_name,
          category: fee.fee_category,
          amount: Number(fee.cd_amount ?? fee.le_amount ?? 0),
        })),
      )
    : { compliant: true, violations: [] };

  return {
    disclosure,
    fees,
    comparisonDisclosure,
    comparisonFees,
    toleranceResult,
  };
}

export function formatDisclosureType(type: DisclosureType) {
  return disclosureTypeLabels[type];
}

export function formatDisclosureStatus(status: DisclosureStatus) {
  return disclosureStatusLabels[status];
}

export function formatDisclosureDate(value: string | null) {
  if (!value) return "Not scheduled";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDisclosureDateTime(value: string | null) {
  if (!value) return "Pending";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

type GenerateDisclosureParams = {
  loanId: string;
  type: DisclosureType;
  generatedBy?: string | null;
  supersedesId?: string | null;
  changeReason?: string | null;
  changeNotes?: string | null;
};

export async function generateDisclosure(params: GenerateDisclosureParams): Promise<DisclosureRecord> {
  const loan = await resolveLoanSummary(params.loanId);
  if (!loan) {
    throw new Error("Loan not found.");
  }

  const existing = await listDisclosuresByLoanId(loan.id);
  const version =
    existing.filter((item) => item.type === params.type).reduce((max, item) => Math.max(max, item.version), 0) +
    1;

  const applicationDate = new Date(loan.created_at);
  const closingDate = loan.expected_close_date
    ? toMiddayDate(loan.expected_close_date)
    : businessDays(applicationDate, 30);
  const deadlines = calculateTRIDDeadlines(applicationDate, closingDate);
  const dueDate =
    params.type === "loan_estimate"
      ? deadlines.leDeadline
      : params.type === "closing_disclosure"
        ? deadlines.cdDeadline
        : addDays(applicationDate, 1);
  const now = new Date().toISOString();
  const { le, cd } = buildBaseFees(loan);
  const selectedFees = params.type === "closing_disclosure" ? cd : le;

  if (!hasDisclosureStorage() || !isUuid(loan.id)) {
    const disclosureId = `${loan.id}-${params.type}-v${version}`;
    return {
      id: disclosureId,
      loan_id: loan.id,
      type: params.type,
      status: "generated",
      version,
      issued_date: now,
      due_date: dueDate.toISOString(),
      sent_to_borrower_at: null,
      acknowledged_by_borrower_at: null,
      acknowledgement_method: null,
      fees_snapshot: { count: selectedFees.length, generatedAt: now },
      loan_terms_snapshot: { loanAmount: loan.loan_amount, stage: loan.stage },
      state: getLoanState(loan),
      file_path: `disclosures/${loan.id}/${params.type}-v${version}.pdf`,
      supersedes_id: params.supersedesId ?? null,
      change_of_circumstance_reason: params.changeReason ?? null,
      change_of_circumstance_notes: params.changeNotes ?? null,
      created_at: now,
      updated_at: now,
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("disclosures")
    .insert({
      loan_id: loan.id,
      type: params.type,
      status: "generated",
      version,
      issued_date: now,
      due_date: dueDate.toISOString(),
      fees_snapshot: { count: selectedFees.length, generatedAt: now },
      loan_terms_snapshot: { loanAmount: loan.loan_amount, stage: loan.stage },
      state: getLoanState(loan),
      file_path: `disclosures/${loan.id}/${params.type}-v${version}.pdf`,
      generated_by: params.generatedBy ?? null,
      supersedes_id: params.supersedesId ?? null,
      change_of_circumstance_reason: params.changeReason ?? null,
      change_of_circumstance_notes: params.changeNotes ?? null,
    })
    .select(disclosureColumns)
    .single();

  if (isMissingDisclosureTable(error)) {
    return {
      id: `${loan.id}-${params.type}-v${version}`,
      loan_id: loan.id,
      type: params.type,
      status: "generated",
      version,
      issued_date: now,
      due_date: dueDate.toISOString(),
      sent_to_borrower_at: null,
      acknowledged_by_borrower_at: null,
      acknowledgement_method: null,
      fees_snapshot: { count: selectedFees.length, generatedAt: now },
      loan_terms_snapshot: { loanAmount: loan.loan_amount, stage: loan.stage },
      state: getLoanState(loan),
      file_path: `disclosures/${loan.id}/${params.type}-v${version}.pdf`,
      supersedes_id: params.supersedesId ?? null,
      change_of_circumstance_reason: params.changeReason ?? null,
      change_of_circumstance_notes: params.changeNotes ?? null,
      created_at: now,
      updated_at: now,
    };
  }

  assertNoError(error);
  if (!data) {
    throw new Error("Disclosure was created but no row was returned.");
  }

  const inserted = data as unknown as DisclosureRecord;
  const { error: feeError } = await supabase.from("disclosure_fees").insert(
    selectedFees.map((fee) => ({
      disclosure_id: inserted.id,
      fee_name: fee.name,
      fee_category: fee.category,
      tolerance_type: getToleranceType(fee.category),
      le_amount: params.type === "closing_disclosure" ? le.find((item) => item.name === fee.name)?.amount ?? null : fee.amount,
      cd_amount: params.type === "closing_disclosure" ? fee.amount : fee.amount,
    })),
  );

  assertNoError(feeError);
  return inserted;
}
