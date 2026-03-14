import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { isStaffRole } from "@/lib/auth/roles";
import { getAuthenticatedViewer } from "@/lib/auth/session";
import { listPipelineLoansForViewer } from "@/lib/services/pipeline";
import { redirect } from "next/navigation";
import type { LoanRecord } from "@/types/database.types";

export async function PipelinePage() {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) {
    redirect("/login");
  }

  if (!viewer.role || !isStaffRole(viewer.role)) {
    redirect("/my-loans");
  }

  const loansPromise = listPipelineLoansForViewer(viewer);
  let bootstrapError: string | undefined;
  let loans: LoanRecord[] = [];

  try {
    loans = await loansPromise;
  } catch (error) {
    bootstrapError =
      error instanceof Error ? error.message : "Dashboard failed to load loan data.";
  }

  return (
    <DashboardClient
      bootstrapError={bootstrapError}
      initialLoans={loans}
      viewer={{
        email: viewer.email,
        fullName: viewer.fullName,
        role: viewer.role,
      }}
    />
  );
}
