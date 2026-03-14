import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedViewer } from "@/lib/auth/session";
import { getBorrowerLoanStatusDetail } from "@/lib/services/borrower-status";

export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  loanId: z.string().uuid(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ loanId: string }> },
) {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (viewer.role && viewer.role !== "borrower") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid loan id." }, { status: 400 });
  }

  try {
    const detail = await getBorrowerLoanStatusDetail(parsed.data.loanId, viewer.userId);
    if (!detail) {
      return NextResponse.json({ error: "Loan not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, ...detail }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Loan status could not be loaded.",
      },
      { status: 500 },
    );
  }
}
