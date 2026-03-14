import { NextResponse } from "next/server";
import { buildDisclosureReminderPayload } from "@/inngest/functions/disclosure-reminder";
import { isStaffRole } from "@/lib/auth/roles";
import { assertViewerCanAccessLoan } from "@/lib/services/loan-access";
import { getCurrentViewerSession } from "@/lib/services/viewer-session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ loanId: string }> },
) {
  const { loanId } = await context.params;
  const { user, role } = await getCurrentViewerSession();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  if (!role || !isStaffRole(role)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const access = await assertViewerCanAccessLoan(loanId, {
    userId: user.id,
    role,
  });

  if (!access) {
    return NextResponse.json({ ok: false, error: "Loan not found." }, { status: 404 });
  }

  try {
    const reminders = await buildDisclosureReminderPayload(loanId);
    return NextResponse.json(
      {
        ok: true,
        reminders,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unable to build disclosure reminders.",
      },
      { status: 500 },
    );
  }
}
