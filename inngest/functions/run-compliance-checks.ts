import { getComplianceDashboard } from "@/lib/services/compliance";

export async function runComplianceChecksForLoan(loanId: string) {
  return getComplianceDashboard(loanId);
}
