import { NextResponse } from "next/server";
import { getComplianceDashboard } from "@/lib/services/compliance";
import { assertComplianceLoanAccess } from "@/lib/services/compliance-access";

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export async function GET(
  request: Request,
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

  const format = new URL(request.url).searchParams.get("format") ?? "json";
  if (format === "csv") {
    const csv = [
      "created_at,action,actor,details,source",
      ...dashboard.auditLog.map((entry) =>
        [
          escapeCsv(entry.createdAt),
          escapeCsv(entry.action),
          escapeCsv(entry.actor),
          escapeCsv(entry.details),
          escapeCsv(entry.source),
        ].join(","),
      ),
    ].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="compliance-audit-${loanId}.csv"`,
      },
    });
  }

  return NextResponse.json({ ok: true, auditLog: dashboard.auditLog });
}
