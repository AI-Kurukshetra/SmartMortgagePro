import { z } from "zod";

export const loanTypeSchema = z.enum(["purchase", "refinance", "heloc", "cash_out_refi"]);
export const occupancyTypeSchema = z.enum([
  "primary_residence",
  "second_home",
  "investment_property",
]);
export const maritalStatusSchema = z.enum(["single", "married", "divorced", "widowed"]);
export const employmentTypeSchema = z.enum([
  "w2_employee",
  "self_employed",
  "retired",
  "other",
]);
export const secondaryIncomeTypeSchema = z.enum([
  "rental",
  "alimony",
  "child_support",
  "social_security",
  "other",
]);
export const assetTypeSchema = z.enum([
  "checking",
  "savings",
  "investment",
  "retirement",
]);
export const downPaymentSourceSchema = z.enum([
  "gift",
  "savings",
  "sale_of_property",
  "equity",
]);
export const liabilityTypeSchema = z.enum([
  "car",
  "student_loan",
  "credit_card",
  "personal_loan",
  "other",
]);
export const propertyTypeSchema = z.enum(["sfr", "condo", "multi_family", "townhome"]);
export const documentCategorySchema = z.enum([
  "income",
  "assets",
  "property",
  "identity",
  "credit",
  "other",
]);
export const documentTypeSchema = z.enum([
  "pay_stub",
  "w2",
  "1099",
  "tax_return",
  "profit_and_loss",
  "bank_statement",
  "investment_statement",
  "retirement_account",
  "purchase_contract",
  "hoa_docs",
  "property_tax_record",
  "government_id",
  "social_security_card",
  "credit_report",
  "explanation_letter",
  "miscellaneous",
]);
export const auditActionSchema = z.enum([
  "upload",
  "view",
  "download",
  "delete",
  "replace",
  "verify_integrity",
  "anchor_complete",
]);
export const blockchainStateSchema = z.enum(["pending", "anchored", "failed"]);
export const checklistStatusSchema = z.enum([
  "not_uploaded",
  "uploaded_pending_review",
  "verified",
  "expired",
  "rejected",
]);
export const loanStageSchema = z.enum([
  "application_received",
  "documents_review",
  "income_verified",
  "underwriting",
  "conditional_approval",
  "clear_to_close",
  "closed",
]);
export const riskTierSchema = z.enum(["prime", "near_prime", "non_prime"]);
export const userRoleSchema = z.enum(["borrower", "loan_officer"]);

export const addressSchema = z.object({
  line1: z.string().min(3, "Address is required."),
  line2: z.string().optional().default(""),
  city: z.string().min(2, "City is required."),
  state: z.string().min(2, "State is required."),
  zip: z.string().min(5, "ZIP code is required."),
  yearsAtAddress: z.number().min(0).max(99),
});

export const borrowerInfoSchema = z.object({
  fullName: z.string().min(2, "Full legal name is required."),
  ssnMasked: z.string().min(11, "Enter a full SSN."),
  ssnHash: z.string().default(""),
  ssnLast4: z.string().length(4).default("0000"),
  dateOfBirth: z.string().min(1, "Date of birth is required."),
  maritalStatus: maritalStatusSchema,
  dependents: z.number().min(0).max(20),
  currentAddress: addressSchema,
  priorAddress: addressSchema.nullable(),
});

export const coBorrowerSchema = borrowerInfoSchema.extend({
  enabled: z.boolean().default(false),
});

export const employmentInfoSchema = z.object({
  employmentType: employmentTypeSchema,
  employerName: z.string().min(2, "Employer name is required."),
  startDate: z.string().min(1, "Start date is required."),
  position: z.string().min(2, "Position is required."),
  baseSalary: z.number().min(0),
  overtime: z.number().min(0),
  bonuses: z.number().min(0),
  commissions: z.number().min(0),
  businessName: z.string().default(""),
  ownershipPercentage: z.number().min(0).max(100),
  twoYearAverageIncome: z.number().min(0),
});

export const incomeSourceSchema = z.object({
  id: z.string(),
  type: secondaryIncomeTypeSchema,
  amount: z.number().min(0),
  description: z.string().min(2),
});

export const assetSchema = z.object({
  id: z.string(),
  type: assetTypeSchema,
  institution: z.string().min(2),
  balance: z.number().min(0),
});

export const liabilitySchema = z.object({
  id: z.string(),
  type: liabilityTypeSchema,
  creditor: z.string().min(2),
  monthlyPayment: z.number().min(0),
  balance: z.number().min(0),
});

export const propertyInfoSchema = z.object({
  propertyAddress: z.string().min(3, "Property address is required."),
  propertyType: propertyTypeSchema,
  yearBuilt: z.number().min(1800).max(2100),
  squareFootage: z.number().min(200),
  hoa: z.boolean(),
  hoaFee: z.number().min(0),
  estimatedTaxes: z.number().min(0),
  estimatedInsurance: z.number().min(0),
  underContract: z.boolean(),
  contractDate: z.string().default(""),
  purchasePrice: z.number().min(0),
});

export const governmentMonitoringSchema = z.object({
  ethnicity: z.string().default(""),
  race: z.string().default(""),
  sex: z.string().default(""),
});

export const consentSchema = z.object({
  softCreditPull: z.boolean(),
  creditPull: z.boolean(),
  ecoa: z.boolean(),
  privacyNotice: z.boolean(),
  esignDisclosure: z.boolean(),
});

export const loanApplicationSchema = z.object({
  loanType: loanTypeSchema,
  occupancyType: occupancyTypeSchema,
  estimatedPropertyValue: z.number().positive("Estimated value is required."),
  desiredLoanAmount: z.number().positive("Desired loan amount is required."),
  targetCloseDate: z.string().min(1, "Target close date is required."),
  borrower: borrowerInfoSchema,
  coBorrower: coBorrowerSchema,
  employment: employmentInfoSchema,
  secondaryIncomeSources: z.array(incomeSourceSchema),
  assets: z.array(assetSchema).min(1, "Add at least one asset."),
  downPaymentSource: downPaymentSourceSchema,
  needsGiftLetter: z.boolean(),
  liabilities: z.array(liabilitySchema),
  bankruptcyHistory: z.boolean(),
  bankruptcyDetails: z.string().default(""),
  foreclosureHistory: z.boolean(),
  foreclosureDetails: z.string().default(""),
  judgmentsHistory: z.boolean(),
  judgmentsDetails: z.string().default(""),
  simulatedCreditScore: z.number().min(300).max(850),
  riskTier: riskTierSchema,
  property: propertyInfoSchema,
  consents: consentSchema,
  governmentMonitoring: governmentMonitoringSchema,
});

export const loanDraftSchema = z.object({
  currentStep: z.number().min(0).max(6),
  completedSteps: z.array(z.number().min(0).max(6)),
  lastSavedAt: z.string().nullable(),
  application: loanApplicationSchema,
  submittedLoanId: z.string().nullable(),
  referenceNumber: z.string().nullable(),
});

export const blockchainAnchorSchema = z.object({
  documentId: z.string(),
  fileHash: z.string(),
  keccakHash: z.string(),
  txHash: z.string(),
  blockNumber: z.number(),
  timestamp: z.string(),
  anchoredBy: z.string(),
  status: blockchainStateSchema,
});

export const fraudSignalSchema = z.object({
  detected: z.boolean(),
  label: z.string(),
  severity: z.enum(["low", "medium", "high"]),
});

export const ocrResultSchema = z.object({
  category: documentCategorySchema,
  detectedType: documentTypeSchema,
  confidence: z.number().min(0).max(100),
  extractedFields: z.array(z.string()),
});

export const documentVersionSchema = z.object({
  id: z.string(),
  version: z.number().min(1),
  uploadedAt: z.string(),
  uploader: z.string(),
  fileHash: z.string(),
  txHash: z.string().nullable(),
  blockNumber: z.number().nullable(),
  fileName: z.string(),
});

export const documentSchema = z.object({
  id: z.string(),
  loanId: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  size: z.number().min(1),
  previewUrl: z.string().nullable(),
  uploadedAt: z.string(),
  uploadedBy: z.string(),
  category: documentCategorySchema,
  detectedType: documentTypeSchema,
  confidence: z.number().min(0).max(100),
  extractedFields: z.array(z.string()),
  blockchain: blockchainAnchorSchema.nullable(),
  blockchainStatus: blockchainStateSchema,
  checklistStatus: checklistStatusSchema,
  deleted: z.boolean(),
  deletedReason: z.string().nullable(),
  version: z.number().min(1),
  fraudSignal: fraudSignalSchema,
  integritySeed: z.string(),
  versions: z.array(documentVersionSchema),
});

export const auditEntrySchema = z.object({
  id: z.string(),
  loanId: z.string(),
  timestamp: z.string(),
  action: auditActionSchema,
  documentId: z.string().nullable(),
  documentName: z.string().nullable(),
  user: z.string(),
  ipAddressMasked: z.string(),
  txHash: z.string().nullable(),
});

export const verificationResultSchema = z.object({
  documentId: z.string(),
  matches: z.boolean(),
  checkedAt: z.string(),
  currentHash: z.string(),
  storedHash: z.string(),
});

export const loanStatusSchema = z.object({
  loanId: z.string(),
  referenceNumber: z.string(),
  currentStage: loanStageSchema,
  stageHistory: z.array(
    z.object({
      stage: loanStageSchema,
      completed: z.boolean(),
      completedAt: z.string().nullable(),
      note: z.string(),
    }),
  ),
  outstandingItems: z.array(z.string()),
  completionPercent: z.number().min(0).max(100),
});

export const userSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string().email(),
  role: userRoleSchema,
});

export type LoanType = z.infer<typeof loanTypeSchema>;
export type OccupancyType = z.infer<typeof occupancyTypeSchema>;
export type BorrowerInfo = z.infer<typeof borrowerInfoSchema>;
export type CoBorrower = z.infer<typeof coBorrowerSchema>;
export type CoeBorrower = CoBorrower;
export type EmploymentInfo = z.infer<typeof employmentInfoSchema>;
export type IncomeSource = z.infer<typeof incomeSourceSchema>;
export type Asset = z.infer<typeof assetSchema>;
export type Liability = z.infer<typeof liabilitySchema>;
export type PropertyInfo = z.infer<typeof propertyInfoSchema>;
export type LoanApplication = z.infer<typeof loanApplicationSchema>;
export type LoanDraft = z.infer<typeof loanDraftSchema>;
export type Document = z.infer<typeof documentSchema>;
export type DocumentVersion = z.infer<typeof documentVersionSchema>;
export type DocumentCategory = z.infer<typeof documentCategorySchema>;
export type BlockchainAnchor = z.infer<typeof blockchainAnchorSchema>;
export type AuditEntry = z.infer<typeof auditEntrySchema>;
export type VerificationResult = z.infer<typeof verificationResultSchema>;
export type LoanStatus = z.infer<typeof loanStatusSchema>;
export type LoanStage = z.infer<typeof loanStageSchema>;
export type User = z.infer<typeof userSchema>;
export type OCRResult = z.infer<typeof ocrResultSchema>;
export type FraudSignal = z.infer<typeof fraudSignalSchema>;

export const SMART_MORTGAGE_STAGE_ORDER: LoanStage[] = [
  "application_received",
  "documents_review",
  "income_verified",
  "underwriting",
  "conditional_approval",
  "clear_to_close",
  "closed",
];

export const DEFAULT_LOAN_APPLICATION: LoanApplication = {
  loanType: "purchase",
  occupancyType: "primary_residence",
  estimatedPropertyValue: 450000,
  desiredLoanAmount: 360000,
  targetCloseDate: "",
  borrower: {
    fullName: "",
    ssnMasked: "",
    ssnHash: "",
    ssnLast4: "0000",
    dateOfBirth: "",
    maritalStatus: "single",
    dependents: 0,
    currentAddress: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      zip: "",
      yearsAtAddress: 0,
    },
    priorAddress: null,
  },
  coBorrower: {
    enabled: false,
    fullName: "",
    ssnMasked: "",
    ssnHash: "",
    ssnLast4: "0000",
    dateOfBirth: "",
    maritalStatus: "single",
    dependents: 0,
    currentAddress: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      zip: "",
      yearsAtAddress: 0,
    },
    priorAddress: null,
  },
  employment: {
    employmentType: "w2_employee",
    employerName: "",
    startDate: "",
    position: "",
    baseSalary: 0,
    overtime: 0,
    bonuses: 0,
    commissions: 0,
    businessName: "",
    ownershipPercentage: 0,
    twoYearAverageIncome: 0,
  },
  secondaryIncomeSources: [],
  assets: [
    {
      id: "asset-1",
      type: "checking",
      institution: "",
      balance: 0,
    },
  ],
  downPaymentSource: "savings",
  needsGiftLetter: false,
  liabilities: [],
  bankruptcyHistory: false,
  bankruptcyDetails: "",
  foreclosureHistory: false,
  foreclosureDetails: "",
  judgmentsHistory: false,
  judgmentsDetails: "",
  simulatedCreditScore: 0,
  riskTier: "prime",
  property: {
    propertyAddress: "",
    propertyType: "sfr",
    yearBuilt: 2000,
    squareFootage: 1800,
    hoa: false,
    hoaFee: 0,
    estimatedTaxes: 0,
    estimatedInsurance: 0,
    underContract: false,
    contractDate: "",
    purchasePrice: 0,
  },
  consents: {
    softCreditPull: false,
    creditPull: false,
    ecoa: false,
    privacyNotice: false,
    esignDisclosure: false,
  },
  governmentMonitoring: {
    ethnicity: "",
    race: "",
    sex: "",
  },
};

export const DEFAULT_LOAN_DRAFT: LoanDraft = {
  currentStep: 0,
  completedSteps: [],
  lastSavedAt: null,
  application: DEFAULT_LOAN_APPLICATION,
  submittedLoanId: null,
  referenceNumber: null,
};

export const REQUIRED_DOCUMENT_TYPES: Record<LoanType, Array<{ label: string; type: string }>> = {
  purchase: [
    { label: "Purchase Contract", type: "purchase_contract" },
    { label: "Pay Stubs", type: "pay_stub" },
    { label: "Bank Statements", type: "bank_statement" },
    { label: "Government ID", type: "government_id" },
  ],
  refinance: [
    { label: "Mortgage Statement", type: "miscellaneous" },
    { label: "W-2", type: "w2" },
    { label: "Tax Returns", type: "tax_return" },
    { label: "Government ID", type: "government_id" },
  ],
  heloc: [
    { label: "Property Tax Records", type: "property_tax_record" },
    { label: "Profit & Loss", type: "profit_and_loss" },
    { label: "Investment Statements", type: "investment_statement" },
    { label: "Government ID", type: "government_id" },
  ],
  cash_out_refi: [
    { label: "Pay Stubs", type: "pay_stub" },
    { label: "Tax Returns", type: "tax_return" },
    { label: "Credit Explanation Letters", type: "explanation_letter" },
    { label: "Government ID", type: "government_id" },
  ],
};
