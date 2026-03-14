import type {
  DocCategory,
  DocumentRow,
  LoanApplicationRow,
  LoanPriority,
  LoanStage,
} from "@/types/database.types";

export const DOCUMENT_BUCKET = "documents";
export const MAX_DOCUMENT_SIZE_BYTES = 50 * 1024 * 1024;
export const ALLOWED_DOCUMENT_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
export const ALLOWED_DOCUMENT_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"] as const;

export type DocumentRecord = Pick<
  DocumentRow,
  | "id"
  | "loan_id"
  | "uploaded_by"
  | "category"
  | "file_name"
  | "file_size"
  | "mime_type"
  | "storage_path"
  | "status"
  | "rejection_reason"
  | "expires_at"
  | "version"
  | "created_at"
  | "updated_at"
>;

export type LoanDocumentSummary = Pick<
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

export type ChecklistItem = {
  category: DocCategory;
  label: string;
  description: string;
  required: boolean;
};

export function getDocumentChecklist(loan: LoanDocumentSummary): ChecklistItem[] {
  const requiresTaxReturn = loan.loan_amount >= 650000 || loan.priority === "high";
  const requiresEmploymentLetter =
    loan.stage === "processing" ||
    loan.stage === "underwriting" ||
    loan.stage === "approved" ||
    loan.stage === "closing";

  return [
    {
      category: "pay_stub",
      label: "Pay Stub",
      description: "Most recent 30 days of income statements.",
      required: true,
    },
    {
      category: "w2",
      label: "W-2",
      description: "Latest annual wage statement for income verification.",
      required: true,
    },
    {
      category: "bank_statement",
      label: "Bank Statement",
      description: "Two months of statements for assets and reserves.",
      required: true,
    },
    {
      category: "id_document",
      label: "Government ID",
      description: "Driver license, passport, or other photo identification.",
      required: true,
    },
    {
      category: "tax_return",
      label: "Tax Return",
      description: "Requested for higher-balance or expedited files.",
      required: requiresTaxReturn,
    },
    {
      category: "employment_letter",
      label: "Employment Letter",
      description: "Needed once the file reaches processing or underwriting.",
      required: requiresEmploymentLetter,
    },
    {
      category: "other",
      label: "Other Supporting Docs",
      description: "Use for HOA, insurance, disclosures, or special conditions.",
      required: false,
    },
  ];
}

export function formatDocumentCategory(category: DocCategory) {
  switch (category) {
    case "pay_stub":
      return "Pay Stub";
    case "w2":
      return "W-2";
    case "bank_statement":
      return "Bank Statement";
    case "tax_return":
      return "Tax Return";
    case "id_document":
      return "Government ID";
    case "employment_letter":
      return "Employment Letter";
    case "other":
      return "Other";
    default:
      return category;
  }
}

export function formatLoanStage(stage: LoanStage) {
  switch (stage) {
    case "application":
      return "Application";
    case "processing":
      return "Processing";
    case "underwriting":
      return "Underwriting";
    case "approved":
      return "Approved";
    case "closing":
      return "Closing";
    default:
      return stage;
  }
}

export function formatLoanPriority(priority: LoanPriority) {
  switch (priority) {
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    default:
      return priority;
  }
}
