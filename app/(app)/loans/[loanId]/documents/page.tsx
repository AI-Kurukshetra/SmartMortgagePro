import { notFound, redirect } from "next/navigation";
import { DocumentPortalClient } from "@/components/documents/document-portal-client";
import { getAuthenticatedViewer } from "@/lib/auth/session";
import { assertViewerCanAccessLoan } from "@/lib/services/loan-access";
import { getLoanDocumentSummary, listDocumentsByLoanId } from "@/lib/services/documents";
import type { DocumentRecord } from "@/lib/documents/shared";
import type { ProfileRole } from "@/types/database.types";

export const dynamic = "force-dynamic";

export default async function LoanDocumentsPage({
  params,
}: {
  params: Promise<{ loanId: string }>;
}) {
  const { loanId } = await params;
  const viewer = await getAuthenticatedViewer();
  if (!viewer) {
    redirect("/login");
  }

  const role: ProfileRole | null = viewer.role;

  const access = await assertViewerCanAccessLoan(loanId, {
    userId: viewer.userId,
    role,
  });

  if (!access) {
    notFound();
  }

  const loan = await getLoanDocumentSummary(loanId);
  if (!loan) {
    notFound();
  }

  let documents: DocumentRecord[] = [];
  let bootstrapError: string | undefined;

  try {
    documents = await listDocumentsByLoanId(loanId);
  } catch (error) {
    bootstrapError =
      error instanceof Error
        ? error.message
        : "Document portal loaded, but existing files could not be fetched.";
  }

  return (
    <DocumentPortalClient
      loan={loan}
      initialDocuments={documents}
      bootstrapError={bootstrapError}
      viewerRole={role}
    />
  );
}
