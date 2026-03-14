import { NextResponse } from "next/server";
import { isStaffRole } from "@/lib/auth/roles";
import { getCurrentComplianceViewer } from "@/lib/services/compliance-access";
import { collectComplianceDeadlineAlerts } from "@/inngest/functions/compliance-deadline-alerts";

export async function GET() {
  const viewer = await getCurrentComplianceViewer();

  if (!viewer) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!isStaffRole(viewer.role)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const alerts = await collectComplianceDeadlineAlerts();
  return NextResponse.json({ ok: true, alerts });
}
