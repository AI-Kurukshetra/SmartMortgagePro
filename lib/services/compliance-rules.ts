import { calculateTRIDDeadlines, checkTRIDCompliance, dayDiff } from "@/lib/services/trid-calculator";
import type {
  ComplianceCheckRow,
  ComplianceCheckStatus,
  ComplianceEventRow,
  LoanApplicationRow,
  Regulation,
} from "@/types/database.types";

const regulationLabels: Record<Regulation, string> = {
  trid: "TRID",
  respa: "RESPA",
  hmda: "HMDA",
  ecoa: "ECOA",
  fcra: "FCRA",
  glba: "GLBA",
  state: "State",
  ada: "ADA",
};

const warningThresholds: Record<string, number> = {
  "loan_estimate_timing": 1,
  "closing_disclosure_timing": 1,
  "servicing_disclosure": 1,
  "hmda_demographic_review": 5,
  "ecoa_appraisal_notice": 3,
  "fcra_credit_authorization": 2,
  "glba_privacy_notice": 3,
  "state_closing_package_review": 5,
  "ada_accessibility_review": 5,
};

type LoanComplianceSource = Pick<
  LoanApplicationRow,
  | "id"
  | "borrower_name"
  | "property_address"
  | "loan_amount"
  | "priority"
  | "stage"
  | "expected_close_date"
  | "created_at"
>;

type ComplianceEventSource = Pick<
  ComplianceEventRow,
  "id" | "event_type" | "event_date" | "notes" | "performed_by" | "metadata"
>;

export type ComplianceCheckView = {
  id: string;
  regulation: Regulation;
  regulationLabel: string;
  checkName: string;
  status: ComplianceCheckStatus;
  description: string;
  remediation: string | null;
  deadline: string | null;
  resolvedAt: string | null;
  waiverReason: string | null;
  source: "system" | "manual";
};

export type TridTimelineSummary = {
  applicationDate: string;
  closingDate: string | null;
  loanEstimateDeadline: string;
  earliestClosingDate: string;
  closingDisclosureDeadline: string | null;
  warnings: string[];
  violations: string[];
  isCompliant: boolean;
};

function findEvent(events: ComplianceEventSource[], eventType: string) {
  return events
    .filter((event) => event.event_type === eventType)
    .sort((left, right) => left.event_date.localeCompare(right.event_date))
    .at(-1);
}

function getGeneratedStatus({
  checkKey,
  deadline,
  passEvent,
  waived,
  now,
}: {
  checkKey: string;
  deadline: string | null;
  passEvent?: ComplianceEventSource | null;
  waived?: boolean;
  now: Date;
}): ComplianceCheckStatus {
  if (waived) {
    return "waived";
  }

  if (passEvent) {
    return "pass";
  }

  if (!deadline) {
    return "pending";
  }

  const daysRemaining = dayDiff(now, deadline);
  if (daysRemaining < 0) {
    return "violation";
  }

  if (daysRemaining <= (warningThresholds[checkKey] ?? 1)) {
    return "warning";
  }

  return "pending";
}

function createSystemCheck({
  id,
  regulation,
  checkName,
  description,
  remediation,
  deadline,
  status,
}: {
  id: string;
  regulation: Regulation;
  checkName: string;
  description: string;
  remediation: string;
  deadline: string | null;
  status: ComplianceCheckStatus;
}): ComplianceCheckView {
  return {
    id,
    regulation,
    regulationLabel: regulationLabels[regulation],
    checkName,
    status,
    description,
    remediation,
    deadline,
    resolvedAt: null,
    waiverReason: null,
    source: "system",
  };
}

function toView(row: ComplianceCheckRow): ComplianceCheckView {
  return {
    id: row.id,
    regulation: row.regulation,
    regulationLabel: regulationLabels[row.regulation],
    checkName: row.check_name,
    status: row.status,
    description: row.description,
    remediation: row.remediation,
    deadline: row.deadline,
    resolvedAt: row.resolved_at,
    waiverReason: row.waiver_reason,
    source: "manual",
  };
}

function mergeChecks(generated: ComplianceCheckView[], manualRows: ComplianceCheckRow[]) {
  const manualMap = new Map(
    manualRows.map((row) => [`${row.regulation}:${row.check_name.toLowerCase()}`, row]),
  );
  const used = new Set<string>();

  const merged = generated.map((check) => {
    const key = `${check.regulation}:${check.checkName.toLowerCase()}`;
    const match = manualMap.get(key);
    if (!match) {
      return check;
    }

    used.add(match.id);
    return toView(match);
  });

  for (const row of manualRows) {
    if (!used.has(row.id)) {
      merged.push(toView(row));
    }
  }

  return merged.sort((left, right) => {
    const severityOrder: Record<ComplianceCheckStatus, number> = {
      violation: 0,
      warning: 1,
      pending: 2,
      waived: 3,
      pass: 4,
    };

    const statusCompare = severityOrder[left.status] - severityOrder[right.status];
    if (statusCompare !== 0) {
      return statusCompare;
    }

    const leftDeadline = left.deadline ?? "9999-12-31";
    const rightDeadline = right.deadline ?? "9999-12-31";
    return leftDeadline.localeCompare(rightDeadline);
  });
}

export function getRegulationLabel(regulation: Regulation) {
  return regulationLabels[regulation];
}

export function buildComplianceChecks({
  loan,
  checks,
  events,
  now = new Date(),
}: {
  loan: LoanComplianceSource;
  checks: ComplianceCheckRow[];
  events: ComplianceEventSource[];
  now?: Date;
}) {
  const trid = checkTRIDCompliance({
    applicationDate: loan.created_at,
    closingDate: loan.expected_close_date,
    leIssuedDate: findEvent(events, "loan_estimate_issued")?.event_date ?? null,
    cdIssuedDate: findEvent(events, "closing_disclosure_issued")?.event_date ?? null,
    now,
  });

  const deadlines = calculateTRIDDeadlines(loan.created_at, loan.expected_close_date);
  const closingDate = deadlines.closingDate;
  const initialDisclosureDeadline = deadlines.leDeadline;
  const hmdaDeadline = closingDate ?? deadlines.earliestClosing;
  const appraisalDeadline = closingDate ?? deadlines.earliestClosing;
  const fcraDeadline = deadlines.leDeadline;
  const privacyDeadline = closingDate ?? deadlines.earliestClosing;
  const stateDeadline = closingDate ?? deadlines.earliestClosing;
  const adaDeadline = closingDate ?? deadlines.earliestClosing;

  const generated: ComplianceCheckView[] = [
    createSystemCheck({
      id: "system-trid-loan-estimate-timing",
      regulation: "trid",
      checkName: "Loan Estimate Timing",
      description: "Issue the Loan Estimate within three business days of the application date.",
      remediation: "Document the Loan Estimate issuance event or review if a corrected disclosure is required.",
      deadline: deadlines.leDeadline,
      status: getGeneratedStatus({
        checkKey: "loan_estimate_timing",
        deadline: deadlines.leDeadline,
        passEvent: findEvent(events, "loan_estimate_issued"),
        now,
      }),
    }),
    createSystemCheck({
      id: "system-trid-closing-disclosure-timing",
      regulation: "trid",
      checkName: "Closing Disclosure Timing",
      description: "Deliver the Closing Disclosure at least three business days before the scheduled closing.",
      remediation: "Update the closing date or issue the Closing Disclosure before the waiting period expires.",
      deadline: deadlines.cdDeadline,
      status: getGeneratedStatus({
        checkKey: "closing_disclosure_timing",
        deadline: deadlines.cdDeadline,
        passEvent: findEvent(events, "closing_disclosure_issued"),
        now,
      }),
    }),
    createSystemCheck({
      id: "system-respa-servicing-disclosure",
      regulation: "respa",
      checkName: "Initial Servicing Disclosure",
      description: "Provide the servicing disclosure package within three business days of application intake.",
      remediation: "Send the servicing disclosure package and attach the delivery event to the compliance log.",
      deadline: initialDisclosureDeadline,
      status: getGeneratedStatus({
        checkKey: "servicing_disclosure",
        deadline: initialDisclosureDeadline,
        passEvent: findEvent(events, "respa_servicing_disclosure_sent"),
        now,
      }),
    }),
    createSystemCheck({
      id: "system-hmda-demographic-review",
      regulation: "hmda",
      checkName: "HMDA Demographic Review",
      description: "Validate Government Monitoring Information and application demographic completeness before closing.",
      remediation: "Review HMDA data capture and log a demographic review event before the file closes.",
      deadline: hmdaDeadline,
      status: getGeneratedStatus({
        checkKey: "hmda_demographic_review",
        deadline: hmdaDeadline,
        passEvent: findEvent(events, "hmda_demographics_reviewed"),
        now,
      }),
    }),
    createSystemCheck({
      id: "system-ecoa-appraisal-notice",
      regulation: "ecoa",
      checkName: "Appraisal / Adverse Action Notice",
      description: "Track appraisal notice or adverse action delivery before underwriting completion.",
      remediation: "Record either an appraisal notice or adverse action event to clear ECOA review.",
      deadline: appraisalDeadline,
      status: getGeneratedStatus({
        checkKey: "ecoa_appraisal_notice",
        deadline: appraisalDeadline,
        passEvent:
          findEvent(events, "ecoa_appraisal_notice_sent") ??
          findEvent(events, "ecoa_adverse_action_sent"),
        now,
      }),
    }),
    createSystemCheck({
      id: "system-fcra-credit-authorization",
      regulation: "fcra",
      checkName: "Credit Authorization",
      description: "Confirm borrower authorization before pulling or refreshing a credit report.",
      remediation: "Capture credit consent and record the FCRA authorization event.",
      deadline: fcraDeadline,
      status: getGeneratedStatus({
        checkKey: "fcra_credit_authorization",
        deadline: fcraDeadline,
        passEvent: findEvent(events, "fcra_credit_authorized"),
        now,
      }),
    }),
    createSystemCheck({
      id: "system-glba-privacy-notice",
      regulation: "glba",
      checkName: "Privacy Notice Delivery",
      description: "Provide the GLBA privacy notice before the file reaches closing readiness.",
      remediation: "Send the privacy notice and log the delivery confirmation.",
      deadline: privacyDeadline,
      status: getGeneratedStatus({
        checkKey: "glba_privacy_notice",
        deadline: privacyDeadline,
        passEvent: findEvent(events, "glba_privacy_notice_sent"),
        now,
      }),
    }),
    createSystemCheck({
      id: "system-state-closing-package-review",
      regulation: "state",
      checkName: "State Closing Package Review",
      description: "Review state-specific closing package obligations and lender overlays prior to closing.",
      remediation: "Complete the state-specific review checklist and record the review event.",
      deadline: stateDeadline,
      status: getGeneratedStatus({
        checkKey: "state_closing_package_review",
        deadline: stateDeadline,
        passEvent: findEvent(events, "state_package_reviewed"),
        now,
      }),
    }),
    createSystemCheck({
      id: "system-ada-accessibility-review",
      regulation: "ada",
      checkName: "Accessibility Delivery Review",
      description: "Confirm borrower-facing disclosures and portals remain accessible for digital delivery.",
      remediation: "Document accessibility review completion before the closing package is finalized.",
      deadline: adaDeadline,
      status: getGeneratedStatus({
        checkKey: "ada_accessibility_review",
        deadline: adaDeadline,
        passEvent: findEvent(events, "ada_accessibility_reviewed"),
        now,
      }),
    }),
  ];

  return {
    checks: mergeChecks(generated, checks),
    trid: {
      applicationDate: deadlines.applicationDate,
      closingDate,
      loanEstimateDeadline: deadlines.leDeadline,
      earliestClosingDate: deadlines.earliestClosing,
      closingDisclosureDeadline: deadlines.cdDeadline,
      warnings: trid.warnings,
      violations: trid.violations,
      isCompliant: trid.isCompliant,
    } satisfies TridTimelineSummary,
  };
}
