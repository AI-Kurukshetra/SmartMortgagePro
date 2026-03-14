import { notFound } from "next/navigation";
import { ComplianceDashboardClient } from "@/components/compliance/compliance-dashboard-client";
import { getComplianceDashboard } from "@/lib/services/compliance";

export const dynamic = "force-dynamic";

export default async function LoanCompliancePage({
  params,
}: {
  params: Promise<{ loanId: string }>;
}) {
  const { loanId } = await params;
  const dashboard = await getComplianceDashboard(loanId);

  if (!dashboard) {
    notFound();
  }

  return <ComplianceDashboardClient dashboard={dashboard} />;
}
