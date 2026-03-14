import { pipelineStageLabels, pipelineStages } from "@/lib/pipeline";
import {
  formatDocumentCategory,
  getDocumentChecklist,
  type DocumentRecord,
  type LoanDocumentSummary,
} from "@/lib/documents/shared";
import { listDocumentsByLoanId } from "@/lib/services/documents";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { DocCategory, LoanApplicationRow, LoanStage } from "@/types/database.types";

const borrowerLoanColumns = [
  "id",
  "borrower_id",
  "borrower_name",
  "property_address",
  "loan_amount",
  "stage",
  "priority",
  "expected_close_date",
  "created_at",
  "updated_at",
].join(", ");

const documentListColumns = [
  "id",
  "loan_id",
  "uploaded_by",
  "category",
  "file_name",
  "file_size",
  "mime_type",
  "storage_path",
  "status",
  "rejection_reason",
  "expires_at",
  "version",
  "created_at",
  "updated_at",
].join(", ");

const oneDayMs = 1000 * 60 * 60 * 24;

type BorrowerLoanBase = Pick<
  LoanApplicationRow,
  | "id"
  | "borrower_id"
  | "borrower_name"
  | "property_address"
  | "loan_amount"
  | "stage"
  | "priority"
  | "expected_close_date"
  | "created_at"
  | "updated_at"
>;

export type StatusMilestone = {
  key: LoanStage;
  label: string;
  description: string;
  state: "complete" | "current" | "upcoming";
};

export type BorrowerActionItem = {
  id: string;
  title: string;
  description: string;
  tone: "critical" | "attention" | "info" | "success";
  ctaLabel?: string;
  ctaHref?: string;
};

export type LoanTimelineItem = {
  id: string;
  title: string;
  description: string;
  occurredAt: string;
  tone: "default" | "success" | "warning";
};

export type BorrowerLoanSummary = BorrowerLoanBase & {
  uploadedDocumentCount: number;
  openActionCount: number;
  progressPercent: number;
  statusLabel: string;
};

export type BorrowerLoanStatusDetail = {
  loan: BorrowerLoanSummary;
  documents: DocumentRecord[];
  milestones: StatusMilestone[];
  actionItems: BorrowerActionItem[];
  timeline: LoanTimelineItem[];
  requiredDocumentCount: number;
  verifiedDocumentCount: number;
  missingDocumentCount: number;
};

function getStageDescription(stage: LoanStage) {
  switch (stage) {
    case "application":
      return "Your application is in and your loan team is confirming the basics.";
    case "processing":
      return "Documents and disclosures are being reviewed for completeness.";
    case "underwriting":
      return "Underwriting is reviewing income, assets, and property details.";
    case "approved":
      return "The file is approved with final conditions and closing prep underway.";
    case "closing":
      return "Closing logistics are in motion and final signatures are next.";
    default:
      return pipelineStageLabels[stage];
  }
}

function getDaysUntilClose(expectedCloseDate: string | null) {
  if (!expectedCloseDate) return null;
  const distance = new Date(expectedCloseDate).getTime() - Date.now();
  return Math.ceil(distance / oneDayMs);
}

function getLatestDocumentsByCategory(documents: DocumentRecord[]) {
  const latest = new Map<DocCategory, DocumentRecord>();

  for (const document of documents) {
    if (!latest.has(document.category)) {
      latest.set(document.category, document);
    }
  }

  return latest;
}

function buildMilestones(stage: LoanStage): StatusMilestone[] {
  const currentIndex = pipelineStages.indexOf(stage);

  return pipelineStages.map((item, index) => ({
    key: item,
    label: pipelineStageLabels[item],
    description: getStageDescription(item),
    state: index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming",
  }));
}

function buildActionItems(
  loan: LoanDocumentSummary,
  documents: DocumentRecord[],
): BorrowerActionItem[] {
  const checklist = getDocumentChecklist(loan);
  const latestDocuments = getLatestDocumentsByCategory(documents);
  const items: BorrowerActionItem[] = [];

  for (const item of checklist) {
    if (!item.required) continue;
    const document = latestDocuments.get(item.category);

    if (!document) {
      items.push({
        id: `missing-${item.category}`,
        title: `Upload ${item.label}`,
        description: item.description,
        tone: "attention",
        ctaLabel: "Open document portal",
        ctaHref: `/my-loans/${loan.id}/documents`,
      });
      continue;
    }

    if (document.status === "rejected") {
      items.push({
        id: `rejected-${document.id}`,
        title: `Replace ${item.label}`,
        description:
          document.rejection_reason ??
          `${item.label} needs a clearer copy or an updated version before your file can move.`,
        tone: "critical",
        ctaLabel: "Upload replacement",
        ctaHref: `/my-loans/${loan.id}/documents`,
      });
    }
  }

  const daysUntilClose = getDaysUntilClose(loan.expected_close_date);
  if (daysUntilClose !== null && daysUntilClose <= 7) {
    items.push({
      id: "close-date-watch",
      title: daysUntilClose < 0 ? "Closing date needs review" : "Review your closing timeline",
      description:
        daysUntilClose < 0
          ? "Your target close date has passed. Reach out to your loan team for the updated plan."
          : "You are within a week of the target close date. Make sure requested items are completed quickly.",
      tone: daysUntilClose < 0 ? "critical" : "info",
    });
  }

  if (!items.length) {
    items.push({
      id: "all-clear",
      title: "No borrower tasks right now",
      description: "Your loan team has everything they need at the moment.",
      tone: "success",
    });
  }

  return items;
}

function buildTimeline(loan: BorrowerLoanBase, documents: DocumentRecord[]): LoanTimelineItem[] {
  const items: LoanTimelineItem[] = [
    {
      id: "loan-created",
      title: "Application received",
      description: "Your loan file was created and entered the processing pipeline.",
      occurredAt: loan.created_at,
      tone: "default",
    },
    {
      id: "loan-stage",
      title: `${pipelineStageLabels[loan.stage]} stage active`,
      description: getStageDescription(loan.stage),
      occurredAt: loan.updated_at,
      tone: loan.stage === "approved" || loan.stage === "closing" ? "success" : "default",
    },
  ];

  for (const document of documents.slice(0, 5)) {
    items.push({
      id: `document-${document.id}`,
      title: `${formatDocumentCategory(document.category)} ${document.status}`,
      description:
        document.status === "rejected"
          ? document.rejection_reason ?? "Your loan team requested a replacement for this document."
          : `${document.file_name} was added to your file.`,
      occurredAt: document.created_at,
      tone:
        document.status === "rejected"
          ? "warning"
          : document.status === "verified"
            ? "success"
            : "default",
    });
  }

  return items.toSorted(
    (left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
  );
}

function buildSummary(loan: BorrowerLoanBase, documents: DocumentRecord[]): BorrowerLoanSummary {
  const actionItems = buildActionItems(loan, documents);
  const stageIndex = pipelineStages.indexOf(loan.stage);
  const milestoneProgress = ((stageIndex + 1) / pipelineStages.length) * 65;
  const checklist = getDocumentChecklist(loan);
  const latestDocuments = getLatestDocumentsByCategory(documents);
  const requiredItems = checklist.filter((item) => item.required);
  const satisfiedRequired = requiredItems.filter((item) => {
    const document = latestDocuments.get(item.category);
    return document && document.status !== "rejected";
  }).length;
  const documentProgress = requiredItems.length ? (satisfiedRequired / requiredItems.length) * 35 : 35;

  return {
    ...loan,
    uploadedDocumentCount: documents.length,
    openActionCount: actionItems.filter((item) => item.tone !== "success").length,
    progressPercent: Math.round(milestoneProgress + documentProgress),
    statusLabel: pipelineStageLabels[loan.stage],
  };
}

async function listDocumentsForLoanMap(loanIds: string[]) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("documents")
    .select(documentListColumns)
    .in("loan_id", loanIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    if (
      error.message.includes('relation "documents" does not exist') ||
      error.message.includes("Could not find the table")
    ) {
      return new Map<string, DocumentRecord[]>();
    }

    throw new Error(error.message);
  }

  const grouped = new Map<string, DocumentRecord[]>();
  for (const row of ((data ?? []) as unknown as DocumentRecord[])) {
    const current = grouped.get(row.loan_id) ?? [];
    current.push(row);
    grouped.set(row.loan_id, current);
  }

  return grouped;
}

export async function listBorrowerLoans(userId: string): Promise<BorrowerLoanSummary[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("loan_applications")
    .select(borrowerLoanColumns)
    .eq("borrower_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message.includes("borrower_id")) {
      throw new Error("Borrower loan assignments are missing. Run the latest database migrations.");
    }

    throw new Error(error.message);
  }

  const loans = (data ?? []) as unknown as BorrowerLoanBase[];
  if (!loans.length) {
    return [];
  }

  const documentMap = await listDocumentsForLoanMap(loans.map((loan) => loan.id));
  return loans.map((loan) => buildSummary(loan, documentMap.get(loan.id) ?? []));
}

export async function getBorrowerLoanStatusDetail(
  loanId: string,
  userId: string,
): Promise<BorrowerLoanStatusDetail | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("loan_applications")
    .select(borrowerLoanColumns)
    .eq("id", loanId)
    .eq("borrower_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    if (error.message.includes("borrower_id")) {
      throw new Error("Borrower loan assignments are missing. Run the latest database migrations.");
    }

    throw new Error(error.message);
  }

  const loan = data as BorrowerLoanBase | null;
  if (!loan) {
    return null;
  }

  const documents = await listDocumentsByLoanId(loanId);
  const checklist = getDocumentChecklist(loan);
  const latestDocuments = getLatestDocumentsByCategory(documents);

  return {
    loan: buildSummary(loan, documents),
    documents,
    milestones: buildMilestones(loan.stage),
    actionItems: buildActionItems(loan, documents),
    timeline: buildTimeline(loan, documents),
    requiredDocumentCount: checklist.filter((item) => item.required).length,
    verifiedDocumentCount: Array.from(latestDocuments.values()).filter(
      (document) => document.status === "verified",
    ).length,
    missingDocumentCount: checklist.filter(
      (item) => item.required && !latestDocuments.has(item.category),
    ).length,
  };
}
