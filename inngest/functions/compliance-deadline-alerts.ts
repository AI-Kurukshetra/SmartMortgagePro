import { getComplianceDashboard } from "@/lib/services/compliance";
import { listLoans } from "@/lib/services/loans";

export async function collectComplianceDeadlineAlerts() {
  const loans = await listLoans();
  const dashboards = await Promise.all(loans.map((loan) => getComplianceDashboard(loan.id)));

  return dashboards
    .flatMap((dashboard) => {
      if (!dashboard) {
        return [];
      }

      if (dashboard.overview.violation === 0 && dashboard.overview.warning === 0) {
        return [];
      }

      return [
        {
          loanId: dashboard.loan.id,
          borrowerName: dashboard.loan.borrower_name,
          warnings: dashboard.overview.warning,
          violations: dashboard.overview.violation,
          nextDeadline: dashboard.overview.nextDeadline,
        },
      ];
    })
    .sort((left, right) => {
      const leftDate = left.nextDeadline ?? "9999-12-31";
      const rightDate = right.nextDeadline ?? "9999-12-31";
      return leftDate.localeCompare(rightDate);
    });
}
