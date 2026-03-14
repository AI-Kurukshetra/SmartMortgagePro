import { NextResponse } from "next/server";
import { assertViewerCanAccessLoan } from "@/lib/services/loan-access";
import { createBulkDocumentDownloadUrls } from "@/lib/services/documents";
import { getCurrentViewerSession } from "@/lib/services/viewer-session";
import { bulkDocumentDownloadSchema } from "@/lib/validations/documents";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ loanId: string }> },
) {
  const { loanId } = await params;
  const { user, role } = await getCurrentViewerSession();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const access = await assertViewerCanAccessLoan(loanId, {
    userId: user.id,
    role,
  });

  if (!access) {
    return NextResponse.json(
      { ok: false, error: "You do not have access to this loan." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = bulkDocumentDownloadSchema.safeParse({
    ...body,
    loanId,
  });

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid bulk download request." }, { status: 400 });
  }

  try {
    const downloads = await createBulkDocumentDownloadUrls(parsed.data.loanId);
    return NextResponse.json({ ok: true, downloads }, { status: 200 });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not prepare bulk downloads." },
      { status: 500 },
    );
  }
}
