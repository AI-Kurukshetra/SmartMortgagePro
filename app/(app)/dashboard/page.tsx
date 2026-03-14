import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { listLoans } from "@/lib/services/loans";
import type { LoanRecord } from "@/lib/services/loans";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let loans: LoanRecord[] = [];
  let bootstrapError: string | undefined;

  try {
    loans = await listLoans();
  } catch (error) {
    bootstrapError =
      error instanceof Error
        ? error.message
        : "Dashboard failed to load loan data.";
  }

  return <DashboardClient initialLoans={loans} bootstrapError={bootstrapError} />;
}
