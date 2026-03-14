import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isStaffRole } from "@/lib/auth/roles";
import { getAuthenticatedViewer } from "@/lib/auth/session";
import { archivePipelineLoan, getPipelineLoanById } from "@/lib/services/pipeline";

const loanIdSchema = z.string().uuid();

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ error: "You do not have access to this loan." }, { status: 403 });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ loanId: string }> },
) {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) {
    return unauthorized();
  }

  if (!viewer.role || !isStaffRole(viewer.role)) {
    return forbidden();
  }

  const { loanId } = await context.params;
  const parsedLoanId = loanIdSchema.safeParse(loanId);
  if (!parsedLoanId.success) {
    return NextResponse.json({ error: "Invalid loan id." }, { status: 400 });
  }

  const loan = await getPipelineLoanById(parsedLoanId.data);
  if (!loan || loan.deleted_at) {
    return NextResponse.json({ error: "Loan not found." }, { status: 404 });
  }

  const archived = await archivePipelineLoan(parsedLoanId.data, viewer);
  if (!archived) {
    return forbidden();
  }

  revalidatePath("/dashboard");
  revalidatePath("/pipeline");
  return NextResponse.json({ ok: true }, { status: 200 });
}
