import { NextResponse } from "next/server";
import { assertViewerCanAccessLoan } from "@/lib/services/loan-access";
import { getCurrentViewerSession } from "@/lib/services/viewer-session";
import {
  getDisclosureDetail,
  getLoanDisclosureSummary,
} from "@/lib/services/disclosures";

export async function GET(
  _request: Request,
  context: { params: Promise<{ loanId: string; disclosureId: string }> },
) {
  const { loanId, disclosureId } = await context.params;
  const { user, role } = await getCurrentViewerSession();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const access = await assertViewerCanAccessLoan(loanId, {
    userId: user.id,
    role,
  });

  if (!access) {
    return NextResponse.json({ ok: false, error: "Loan not found." }, { status: 404 });
  }

  try {
    const loan = await getLoanDisclosureSummary(loanId);
    if (!loan) {
      return NextResponse.json({ ok: false, error: "Loan not found." }, { status: 404 });
    }

    const detail = await getDisclosureDetail(loanId, disclosureId);
    if (!detail) {
      return NextResponse.json(
        { ok: false, error: "Disclosure not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        loan,
        detail,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unable to load the disclosure detail.",
      },
      { status: 500 },
    );
  }
}
