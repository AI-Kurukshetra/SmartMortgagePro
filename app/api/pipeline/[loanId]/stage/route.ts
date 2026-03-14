import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isStaffRole } from "@/lib/auth/roles";
import { getAuthenticatedViewer } from "@/lib/auth/session";
import { getPipelineLoanById, updatePipelineLoanStage } from "@/lib/services/pipeline";
import type { LoanStage } from "@/types/database.types";

const stageUpdateSchema = z.object({
  stage: z.enum(
    ["application", "processing", "underwriting", "approved", "closing"] satisfies [
      LoanStage,
      ...LoanStage[],
    ],
  ),
});

const loanIdSchema = z.string().uuid();

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ error: "You do not have access to this loan." }, { status: 403 });
}

export async function PATCH(
  request: Request,
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

  const body = await request.json().catch(() => null);
  const parsedBody = stageUpdateSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid stage update payload." }, { status: 400 });
  }

  const loan = await getPipelineLoanById(parsedLoanId.data);
  if (!loan || loan.deleted_at) {
    return NextResponse.json({ error: "Loan not found." }, { status: 404 });
  }

  const updatedLoan = await updatePipelineLoanStage(
    parsedLoanId.data,
    parsedBody.data.stage,
    viewer,
  );
  if (!updatedLoan) {
    return forbidden();
  }

  revalidatePath("/dashboard");
  revalidatePath("/pipeline");
  return NextResponse.json({ loan: updatedLoan }, { status: 200 });
}
