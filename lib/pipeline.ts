import type { LoanRecord, LoanStage, ProfileRole } from "@/types/database.types";

export const pipelineStages: LoanStage[] = [
  "application",
  "processing",
  "underwriting",
  "approved",
  "closing",
];

export const pipelineStageLabels: Record<LoanStage, string> = {
  application: "Application",
  processing: "Processing",
  underwriting: "Underwriting",
  approved: "Approved",
  closing: "Closing",
};

export type PipelineViewer = {
  email?: string | null;
  fullName?: string | null;
  role?: ProfileRole | null;
};

const millisecondsInDay = 1000 * 60 * 60 * 24;

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatShortDate(value: string | null) {
  if (!value) return "No close date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function getDaysInStage(loan: Pick<LoanRecord, "created_at" | "updated_at">) {
  const stageDate = loan.updated_at || loan.created_at;
  const age = Date.now() - new Date(stageDate).getTime();
  return Math.max(0, Math.floor(age / millisecondsInDay));
}

export function getOutstandingTaskCount(loan: LoanRecord) {
  let total = {
    application: 2,
    processing: 3,
    underwriting: 4,
    approved: 2,
    closing: 1,
  }[loan.stage];

  if (loan.priority === "high") total += 1;
  if (loan.expected_close_date && getDaysUntilClose(loan.expected_close_date) <= 10) total += 1;

  return total;
}

export function getDaysUntilClose(expectedCloseDate: string) {
  const distance = new Date(expectedCloseDate).getTime() - Date.now();
  return Math.ceil(distance / millisecondsInDay);
}

export function getHealthTone(daysInStage: number) {
  if (daysInStage > 14) return "critical";
  if (daysInStage > 7) return "attention";
  return "stable";
}

export function getCloseTone(expectedCloseDate: string | null) {
  if (!expectedCloseDate) return "neutral";

  const days = getDaysUntilClose(expectedCloseDate);
  if (days < 0) return "critical";
  if (days <= 7) return "attention";
  return "stable";
}

export function isTeamViewRole(role?: ProfileRole | null) {
  return role === "admin" || role === "processor" || role === "underwriter";
}
