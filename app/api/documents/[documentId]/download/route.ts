import { NextResponse } from "next/server";
import { assertViewerCanAccessLoan } from "@/lib/services/loan-access";
import { createDocumentDownloadUrl } from "@/lib/services/documents";
import { getCurrentViewerSession } from "@/lib/services/viewer-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { documentDownloadSchema } from "@/lib/validations/documents";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;
  const { user, role } = await getCurrentViewerSession();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const parsed = documentDownloadSchema.safeParse({ documentId });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid document download request." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: document, error } = await supabase
    .from("documents")
    .select("loan_id")
    .eq("id", parsed.data.documentId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!document?.loan_id) {
    return NextResponse.json({ ok: false, error: "Document not found." }, { status: 404 });
  }

  const access = await assertViewerCanAccessLoan(document.loan_id, {
    userId: user.id,
    role,
  });

  if (!access) {
    return NextResponse.json(
      { ok: false, error: "You do not have access to this document." },
      { status: 403 },
    );
  }

  const download = await createDocumentDownloadUrl(parsed.data.documentId);
  if (!download) {
    return NextResponse.json({ ok: false, error: "Document not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, download }, { status: 200 });
}
