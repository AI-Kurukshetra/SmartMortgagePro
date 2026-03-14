import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { assertViewerCanAccessLoan } from "@/lib/services/loan-access";
import {
  createDocumentRecord,
  getDocumentChecklist,
  getLoanDocumentSummary,
  listDocumentsByLoanId,
} from "@/lib/services/documents";
import { getCurrentViewerSession } from "@/lib/services/viewer-session";
import { createDocumentSchema } from "@/lib/validations/documents";

function unauthorizedResponse() {
  return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
}

function forbiddenResponse() {
  return NextResponse.json({ ok: false, error: "You do not have access to this loan." }, { status: 403 });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ loanId: string }> },
) {
  const { loanId } = await params;
  const { user, role } = await getCurrentViewerSession();

  if (!user) {
    return unauthorizedResponse();
  }

  const access = await assertViewerCanAccessLoan(loanId, {
    userId: user.id,
    role,
  });

  if (!access) {
    return forbiddenResponse();
  }

  const loan = await getLoanDocumentSummary(loanId);
  if (!loan) {
    return NextResponse.json({ ok: false, error: "Loan not found." }, { status: 404 });
  }

  const documents = await listDocumentsByLoanId(loanId);

  return NextResponse.json(
    {
      ok: true,
      loan,
      checklist: getDocumentChecklist(loan),
      documents,
    },
    { status: 200 },
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ loanId: string }> },
) {
  const { loanId } = await params;
  const { user, role } = await getCurrentViewerSession();

  if (!user) {
    return unauthorizedResponse();
  }

  const access = await assertViewerCanAccessLoan(loanId, {
    userId: user.id,
    role,
  });

  if (!access) {
    return forbiddenResponse();
  }

  const body = await request.json().catch(() => null);
  const parsed = createDocumentSchema.safeParse({
    ...body,
    loanId,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Please provide a valid supported file under 50MB." },
      { status: 400 },
    );
  }

  try {
    const document = await createDocumentRecord({
      ...parsed.data,
      uploadedBy: user.id,
      status: "processing",
    });

    revalidatePath(`/loans/${loanId}/documents`);
    revalidatePath(`/my-loans/${loanId}`);
    revalidatePath("/my-loans");

    return NextResponse.json({ ok: true, document }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not save the document record.",
      },
      { status: 500 },
    );
  }
}
