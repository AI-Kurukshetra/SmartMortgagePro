import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  DOCUMENT_BUCKET,
  type DocumentRecord,
  type LoanDocumentSummary,
} from "@/lib/documents/shared";
import type {
  DocCategory,
  DocStatus,
} from "@/types/database.types";

export {
  ALLOWED_DOCUMENT_EXTENSIONS,
  ALLOWED_DOCUMENT_MIME_TYPES,
  DOCUMENT_BUCKET,
  MAX_DOCUMENT_SIZE_BYTES,
  formatDocumentCategory,
  formatLoanPriority,
  formatLoanStage,
  getDocumentChecklist,
} from "@/lib/documents/shared";
export type { ChecklistItem, DocumentRecord, LoanDocumentSummary } from "@/lib/documents/shared";

const documentColumns = [
  "id",
  "loan_id",
  "uploaded_by",
  "category",
  "file_name",
  "file_size",
  "mime_type",
  "storage_path",
  "status",
  "rejection_reason",
  "expires_at",
  "version",
  "deleted_at",
  "created_at",
  "updated_at",
].join(", ");

const loanColumns = [
  "id",
  "borrower_name",
  "property_address",
  "loan_amount",
  "priority",
  "stage",
  "expected_close_date",
  "created_at",
].join(", ");

type CreateDocumentParams = {
  loanId: string;
  uploadedBy: string;
  category: DocCategory;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  status?: DocStatus;
  expiresAt?: string | null;
};

type BulkDownloadItem = {
  documentId: string;
  fileName: string;
  url: string;
};

function assertNoError(error: { message: string } | null) {
  if (!error) return;
  throw new Error(error.message);
}

function isMissingDocumentsTable(error: { message: string } | null) {
  if (!error) return false;
  return (
    error.message.includes("Could not find the table") ||
    error.message.includes('relation "documents" does not exist')
  );
}

function isDirectDownloadUrl(value: string) {
  return value.startsWith("https://") || value.startsWith("http://");
}

export async function getLoanDocumentSummary(loanId: string): Promise<LoanDocumentSummary | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("loan_applications")
    .select(loanColumns)
    .eq("id", loanId)
    .is("deleted_at", null)
    .maybeSingle();

  assertNoError(error);
  return (data as LoanDocumentSummary | null) ?? null;
}

export async function listDocumentsByLoanId(loanId: string): Promise<DocumentRecord[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("documents")
    .select(documentColumns)
    .eq("loan_id", loanId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (isMissingDocumentsTable(error)) {
    return [];
  }

  assertNoError(error);
  return ((data ?? []) as unknown) as DocumentRecord[];
}

export async function createDocumentRecord(params: CreateDocumentParams): Promise<DocumentRecord> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("documents")
    .insert({
      loan_id: params.loanId,
      uploaded_by: params.uploadedBy,
      category: params.category,
      file_name: params.fileName,
      file_size: params.fileSize,
      mime_type: params.mimeType,
      storage_path: params.storagePath,
      status: params.status ?? "processing",
      expires_at: params.expiresAt ?? null,
    })
    .select(documentColumns)
    .single();

  assertNoError(error);
  if (!data) {
    throw new Error("Document record was created but no row was returned.");
  }

  return data as unknown as DocumentRecord;
}

export async function createDocumentDownloadUrl(documentId: string): Promise<BulkDownloadItem | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, file_name, storage_path")
    .eq("id", documentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (isMissingDocumentsTable(error)) {
    return null;
  }

  assertNoError(error);
  if (!data) {
    return null;
  }

  if (isDirectDownloadUrl(data.storage_path)) {
    return {
      documentId: data.id,
      fileName: data.file_name,
      url: data.storage_path,
    };
  }

  const signed = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(data.storage_path, 60);

  assertNoError(signed.error);
  if (!signed.data?.signedUrl) {
    throw new Error("Signed download URL was not returned.");
  }

  return {
    documentId: data.id,
    fileName: data.file_name,
    url: signed.data.signedUrl,
  };
}

export async function createBulkDocumentDownloadUrls(
  loanId: string,
): Promise<BulkDownloadItem[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, file_name, storage_path")
    .eq("loan_id", loanId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (isMissingDocumentsTable(error)) {
    return [];
  }

  assertNoError(error);
  if (!data?.length) {
    return [];
  }

  const downloads = await Promise.all(
    data.map(async (document) => {
      if (isDirectDownloadUrl(document.storage_path)) {
        return {
          documentId: document.id,
          fileName: document.file_name,
          url: document.storage_path,
        };
      }

      const signed = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .createSignedUrl(document.storage_path, 60);

      assertNoError(signed.error);
      if (!signed.data?.signedUrl) {
        return null;
      }

      return {
        documentId: document.id,
        fileName: document.file_name,
        url: signed.data.signedUrl,
      };
    }),
  );

  return downloads.filter((item): item is BulkDownloadItem => Boolean(item));
}
