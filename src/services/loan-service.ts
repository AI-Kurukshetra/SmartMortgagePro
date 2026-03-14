import { addDays, formatISO, isAfter, parseISO } from "date-fns";
import {
  buildReferenceNumber,
  createMockDelay,
  createUuid,
  persistJson,
  readJson,
  STORAGE_KEYS,
} from "@/src/services/mock-service-utils";
import {
  DEFAULT_LOAN_DRAFT,
  SMART_MORTGAGE_STAGE_ORDER,
  type LoanApplication,
  type LoanDraft,
  type LoanStatus,
} from "@/src/types/smart-mortgage";

type StoredSubmission = {
  loanId: string;
  referenceNumber: string;
  submittedAt: string;
  application: LoanApplication;
};

function getStoredSubmission() {
  return readJson<StoredSubmission | null>(STORAGE_KEYS.submission, null);
}

function setStoredSubmission(submission: StoredSubmission) {
  persistJson(STORAGE_KEYS.submission, submission);
}

export const mockLoanService = {
  async saveDraft(draft: LoanDraft): Promise<void> {
    await createMockDelay(350, 600);
    persistJson(STORAGE_KEYS.draft, {
      ...draft,
      lastSavedAt: formatISO(new Date()),
    });
  },

  async getDraft(): Promise<LoanDraft | null> {
    await createMockDelay(300, 550);
    return readJson<LoanDraft | null>(STORAGE_KEYS.draft, null);
  },

  async clearDraft() {
    await createMockDelay(200, 400);
    persistJson(STORAGE_KEYS.draft, DEFAULT_LOAN_DRAFT);
  },

  async submitApplication(
    data: LoanApplication,
  ): Promise<{ loanId: string; referenceNumber: string }> {
    await createMockDelay(1000, 1400);
    const loanId = createUuid("loan");
    const referenceNumber = buildReferenceNumber();
    setStoredSubmission({
      loanId,
      referenceNumber,
      submittedAt: formatISO(new Date()),
      application: data,
    });
    persistJson(STORAGE_KEYS.draft, {
      ...DEFAULT_LOAN_DRAFT,
      submittedLoanId: loanId,
      referenceNumber,
      application: data,
      lastSavedAt: formatISO(new Date()),
    });
    return { loanId, referenceNumber };
  },

  async getLoanStatus(loanId: string): Promise<LoanStatus> {
    await createMockDelay(500, 900);
    const submission = getStoredSubmission();
    if (!submission || submission.loanId !== loanId) {
      return {
        loanId,
        referenceNumber: "PENDING-0000",
        currentStage: "application_received",
        stageHistory: SMART_MORTGAGE_STAGE_ORDER.map((stage, index) => ({
          stage,
          completed: index === 0,
          completedAt: index === 0 ? formatISO(new Date()) : null,
          note: "Awaiting borrower activity.",
        })),
        outstandingItems: ["Complete the digital application."],
        completionPercent: 8,
      };
    }

    const submittedAt = parseISO(submission.submittedAt);
    const now = new Date();
    const milestones = SMART_MORTGAGE_STAGE_ORDER.map((stage, index) => {
      const completedAt = addDays(submittedAt, index * 2);
      const completed = isAfter(now, completedAt);
      return {
        stage,
        completed,
        completedAt: completed ? formatISO(completedAt) : null,
        note: [
          "Application package received and queued.",
          "Document package reviewed against checklist.",
          "Income validation and borrower profile confirmed.",
          "File underwriter conditions and automated rules evaluated.",
          "Conditional approval issued to borrower.",
          "Clear to close package assembled.",
          "Loan closed and archived.",
        ][index],
      };
    });

    const currentStage =
      milestones.find((item) => !item.completed)?.stage ?? "closed";
    const completionPercent = Math.round(
      (milestones.filter((item) => item.completed).length / milestones.length) * 100,
    );

    return {
      loanId,
      referenceNumber: submission.referenceNumber,
      currentStage,
      stageHistory: milestones,
      outstandingItems:
        currentStage === "documents_review"
          ? ["Upload any missing documents from the vault.", "Review OCR classification warnings."]
          : currentStage === "underwriting"
            ? ["Respond to any underwriting conditions.", "Monitor compliance updates."]
            : currentStage === "clear_to_close"
              ? ["Review final disclosures.", "Confirm closing schedule."]
              : ["Application submitted successfully."],
      completionPercent,
    };
  },

  getSubmissionSync() {
    return getStoredSubmission();
  },
};
