import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildComplianceChecks, type ComplianceCheckView, type TridTimelineSummary } from "@/lib/services/compliance-rules";
import type {
  ComplianceAuditLogRow,
  ComplianceCheckRow,
  ComplianceCheckStatus,
  ComplianceEventRow,
  LoanApplicationRow,
  Regulation,
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

const complianceCheckColumns = [
  "id",
  "loan_id",
  "regulation",
  "check_name",
  "status",
  "description",
  "remediation",
  "deadline",
  "resolved_at",
  "resolved_by",
  "waived_by",
  "waiver_reason",
  "created_at",
  "updated_at",
].join(", ");

const complianceEventColumns = [
  "id",
  "loan_id",
  "event_type",
  "event_date",
  "performed_by",
  "notes",
  "metadata",
].join(", ");

const complianceAuditColumns = [
  "id",
  "loan_id",
  "action",
  "performed_by",
  "details",
  "ip_address",
  "created_at",
].join(", ");

export type LoanComplianceSummary = Pick<
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

export type ComplianceAuditEntry = {
  id: string;
  action: string;
  actor: string;
  createdAt: string;
  details: string;
  source: "audit" | "event" | "system";
};

export type ComplianceOverview = {
  total: number;
  pass: number;
  warning: number;
  violation: number;
  pending: number;
  waived: number;
  nextDeadline: string | null;
};

export type ComplianceDashboardData = {
  loan: LoanComplianceSummary;
  checks: ComplianceCheckView[];
  trid: TridTimelineSummary;
  overview: ComplianceOverview;
  auditLog: ComplianceAuditEntry[];
  bootstrapWarnings: string[];
};

type CreateComplianceCheckParams = {
  loanId: string;
  regulation: Regulation;
  checkName: string;
  description: string;
  remediation?: string | null;
  deadline?: string | null;
  createdBy: string;
  status?: ComplianceCheckStatus;
};

type CreateComplianceEventParams = {
  loanId: string;
  eventType: string;
  eventDate?: string;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  performedBy: string;
};

type UpdateComplianceCheckStatusParams = {
  loanId: string;
  checkId: string;
  status: ComplianceCheckStatus;
  performedBy: string;
  waiverReason?: string | null;
};

function assertNoError(error: { message: string } | null) {
  if (!error) {
    return;
  }

  throw new Error(error.message);
}

function assertComplianceStorageAvailable(tableName: string, error: { message: string } | null) {
  if (isMissingTable(error, tableName)) {
    throw new Error("Compliance tables are not migrated yet.");
  }

  assertNoError(error);
}

function isMissingTable(error: { message: string } | null, tableName: string) {
  if (!error) {
    return false;
  }

  return (
    error.message.includes("Could not find the table") ||
    error.message.includes(`relation "${tableName}" does not exist`)
  );
}

function actorLabel(actor: string | null) {
  return actor ? `User ${actor.slice(0, 8)}` : "System";
}

function stringifyDetails(details: Record<string, unknown> | null) {
  if (!details) {
    return "No structured details recorded.";
  }

  const parts = Object.entries(details)
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${String(value)}`);

  return parts.length ? parts.join(" • ") : "No structured details recorded.";
}

function summarizeEvent(event: Pick<ComplianceEventRow, "event_type" | "notes" | "metadata">) {
  if (event.notes?.trim()) {
    return event.notes.trim();
  }

  if (event.metadata && Object.keys(event.metadata).length > 0) {
    return stringifyDetails(event.metadata);
  }

  return "Workflow event recorded.";
}

function buildSyntheticAuditLog({
  loan,
  checks,
  events,
}: {
  loan: LoanComplianceSummary;
  checks: ComplianceCheckRow[];
  events: ComplianceEventRow[];
}) {
  const entries: ComplianceAuditEntry[] = [
    {
      id: `loan-created-${loan.id}`,
      action: "Loan application created",
      actor: "System",
      createdAt: loan.created_at,
      details: `Stage ${loan.stage} opened for ${loan.borrower_name}.`,
      source: "system",
    },
  ];

  for (const event of events) {
    entries.push({
      id: `event-${event.id}`,
      action: event.event_type.replaceAll("_", " "),
      actor: actorLabel(event.performed_by),
      createdAt: event.event_date,
      details: summarizeEvent(event),
      source: "event",
    });
  }

  for (const check of checks) {
    if (check.waiver_reason && check.waived_by) {
      entries.push({
        id: `waiver-${check.id}`,
        action: `${check.check_name} waived`,
        actor: actorLabel(check.waived_by),
        createdAt: check.updated_at,
        details: check.waiver_reason,
        source: "system",
      });
    } else if (check.resolved_at) {
      entries.push({
        id: `resolved-${check.id}`,
        action: `${check.check_name} resolved`,
        actor: actorLabel(check.resolved_by),
        createdAt: check.resolved_at,
        details: check.description,
        source: "system",
      });
    }
  }

  return entries.toSorted((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function buildOverview(checks: ComplianceCheckView[]): ComplianceOverview {
  const counts = checks.reduce(
    (accumulator, check) => {
      accumulator.total += 1;
      accumulator[check.status] += 1;
      return accumulator;
    },
    {
      total: 0,
      pass: 0,
      warning: 0,
      violation: 0,
      pending: 0,
      waived: 0,
    } satisfies Record<ComplianceCheckStatus | "total", number>,
  );

  const nextDeadline =
    checks
      .filter((check) => check.status !== "pass" && check.status !== "waived" && check.deadline)
      .map((check) => check.deadline)
      .sort()
      .at(0) ?? null;

  return {
    ...counts,
    nextDeadline,
  };
}

function toAuditEntries(rows: ComplianceAuditLogRow[]) {
  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    actor: actorLabel(row.performed_by),
    createdAt: row.created_at,
    details: stringifyDetails(row.details),
    source: "audit" as const,
  }));
}

async function insertAuditEntry({
  loanId,
  action,
  performedBy,
  details,
}: {
  loanId: string;
  action: string;
  performedBy: string | null;
  details?: Record<string, unknown> | null;
}) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("compliance_audit_log").insert({
    loan_id: loanId,
    action,
    performed_by: performedBy,
    details: details ?? null,
  });

  assertComplianceStorageAvailable("compliance_audit_log", error);
}

export async function getComplianceDashboard(loanId: string): Promise<ComplianceDashboardData | null> {
  const supabase = createSupabaseAdminClient();
  const { data: loan, error: loanError } = await supabase
    .from("loan_applications")
    .select(loanColumns)
    .eq("id", loanId)
    .is("deleted_at", null)
    .maybeSingle();

  assertNoError(loanError);

  if (!loan) {
    return null;
  }

  const loanSummary = loan as unknown as LoanComplianceSummary;

  const [checkResult, eventResult, auditResult] = await Promise.all([
    supabase
      .from("compliance_checks")
      .select(complianceCheckColumns)
      .eq("loan_id", loanId)
      .order("deadline", { ascending: true, nullsFirst: false }),
    supabase
      .from("compliance_events")
      .select(complianceEventColumns)
      .eq("loan_id", loanId)
      .order("event_date", { ascending: false }),
    supabase
      .from("compliance_audit_log")
      .select(complianceAuditColumns)
      .eq("loan_id", loanId)
      .order("created_at", { ascending: false }),
  ]);

  const bootstrapWarnings: string[] = [];

  const checks = isMissingTable(checkResult.error, "compliance_checks")
    ? (() => {
        bootstrapWarnings.push("Compliance tables are not migrated yet. Showing rule-based checks only.");
        return [] as ComplianceCheckRow[];
      })()
    : (((assertNoError(checkResult.error), checkResult.data ?? []) as unknown) as ComplianceCheckRow[]);

  const events = isMissingTable(eventResult.error, "compliance_events")
    ? [] as ComplianceEventRow[]
    : (((assertNoError(eventResult.error), eventResult.data ?? []) as unknown) as ComplianceEventRow[]);

  const auditRows = isMissingTable(auditResult.error, "compliance_audit_log")
    ? [] as ComplianceAuditLogRow[]
    : (((assertNoError(auditResult.error), auditResult.data ?? []) as unknown) as ComplianceAuditLogRow[]);

  const { checks: mergedChecks, trid } = buildComplianceChecks({
    loan: loanSummary,
    checks,
    events,
  });

  const auditLog = auditRows.length
    ? toAuditEntries(auditRows)
    : buildSyntheticAuditLog({
        loan: loanSummary,
        checks,
        events,
      });

  return {
    loan: loanSummary,
    checks: mergedChecks,
    trid,
    overview: buildOverview(mergedChecks),
    auditLog,
    bootstrapWarnings,
  };
}

export async function createComplianceCheck(
  params: CreateComplianceCheckParams,
): Promise<ComplianceCheckRow> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("compliance_checks")
    .insert({
      loan_id: params.loanId,
      regulation: params.regulation,
      check_name: params.checkName,
      status: params.status ?? "pending",
      description: params.description,
      remediation: params.remediation ?? null,
      deadline: params.deadline ?? null,
    })
    .select(complianceCheckColumns)
    .single();

  assertComplianceStorageAvailable("compliance_checks", error);

  if (!data) {
    throw new Error("Compliance check was created but no row was returned.");
  }

  const createdCheck = data as unknown as ComplianceCheckRow;

  await insertAuditEntry({
    loanId: params.loanId,
    action: "compliance_check_created",
    performedBy: params.createdBy,
    details: {
      check_id: createdCheck.id,
      regulation: createdCheck.regulation,
      check_name: createdCheck.check_name,
      status: createdCheck.status,
    },
  });

  return createdCheck;
}

export async function createComplianceEvent(
  params: CreateComplianceEventParams,
): Promise<ComplianceEventRow> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("compliance_events")
    .insert({
      loan_id: params.loanId,
      event_type: params.eventType,
      event_date: params.eventDate ?? new Date().toISOString(),
      performed_by: params.performedBy,
      notes: params.notes ?? null,
      metadata: params.metadata ?? null,
    })
    .select(complianceEventColumns)
    .single();

  assertComplianceStorageAvailable("compliance_events", error);

  if (!data) {
    throw new Error("Compliance event was created but no row was returned.");
  }

  const createdEvent = data as unknown as ComplianceEventRow;

  await insertAuditEntry({
    loanId: params.loanId,
    action: "compliance_event_created",
    performedBy: params.performedBy,
    details: {
      event_id: createdEvent.id,
      event_type: createdEvent.event_type,
      event_date: createdEvent.event_date,
    },
  });

  return createdEvent;
}

export async function updateComplianceCheckStatus(
  params: UpdateComplianceCheckStatusParams,
): Promise<ComplianceCheckRow> {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const updatePayload: Record<string, string | null> & { status: ComplianceCheckStatus } = {
    status: params.status,
    resolved_at: null,
    resolved_by: null,
    waived_by: null,
    waiver_reason: null,
  };

  if (params.status === "pass") {
    updatePayload.resolved_at = now;
    updatePayload.resolved_by = params.performedBy;
  }

  if (params.status === "waived") {
    updatePayload.waived_by = params.performedBy;
    updatePayload.waiver_reason = params.waiverReason ?? null;
  }

  const { data, error } = await supabase
    .from("compliance_checks")
    .update(updatePayload)
    .eq("id", params.checkId)
    .eq("loan_id", params.loanId)
    .select(complianceCheckColumns)
    .single();

  assertComplianceStorageAvailable("compliance_checks", error);

  if (!data) {
    throw new Error("Compliance check update succeeded but no row was returned.");
  }

  const updatedCheck = data as unknown as ComplianceCheckRow;

  await insertAuditEntry({
    loanId: params.loanId,
    action: "compliance_check_status_updated",
    performedBy: params.performedBy,
    details: {
      check_id: updatedCheck.id,
      status: updatedCheck.status,
      waived_by: updatedCheck.waived_by,
      waiver_reason: updatedCheck.waiver_reason,
      resolved_at: updatedCheck.resolved_at,
    },
  });

  return updatedCheck;
}
