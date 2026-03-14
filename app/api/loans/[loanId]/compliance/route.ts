import { NextResponse } from "next/server";
import { getComplianceDashboard } from "@/lib/services/compliance";
import { assertComplianceLoanAccess } from "@/lib/services/compliance-access";

export async function GET(
  _request: Request,
  context: { params: Promise<{ loanId: string }> },
) {
  const { loanId } = await context.params;
  const access = await assertComplianceLoanAccess(loanId);

  if (!access.allowed) {
    return NextResponse.json(
      { ok: false, error: access.reason === "unauthorized" ? "Unauthorized" : "Forbidden" },
      { status: access.reason === "unauthorized" ? 401 : 403 },
    );
  }

  const dashboard = await getComplianceDashboard(loanId);
  if (!dashboard) {
    return NextResponse.json({ ok: false, error: "Loan not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, dashboard });
}
