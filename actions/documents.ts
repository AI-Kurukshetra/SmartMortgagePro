"use server";

import { revalidatePath } from "next/cache";
import { assertViewerCanAccessLoan } from "@/lib/services/loan-access";
import {
  createBulkDocumentDownloadUrls,
  createDocumentDownloadUrl,
  createDocumentRecord,
} from "@/lib/services/documents";
import { createServerClient } from "@/lib/supabase/server";
import {
  bulkDocumentDownloadSchema,
  createDocumentSchema,
  documentDownloadSchema,
} from "@/lib/validations/documents";
import type { DocCategory, ProfileRole } from "@/types/database.types";

type DocumentActionResult =
  | { ok: true; document: Awaited<ReturnType<typeof createDocumentRecord>> }
  | { ok: false; error: string };

export async function createDocumentRecordAction(input: {
  loanId: string;
  category: DocCategory;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
}): Promise<DocumentActionResult> {
  const parsed = createDocumentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please provide a valid supported file under 50MB." };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Your session expired. Sign in again and retry the upload." };
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const access = await assertViewerCanAccessLoan(parsed.data.loanId, {
      userId: user.id,
      role: (profile?.role as ProfileRole | null | undefined) ?? null,
    });

    if (!access) {
      return { ok: false, error: "You do not have access to this loan." };
    }

    const document = await createDocumentRecord({
      ...parsed.data,
      uploadedBy: user.id,
      status: "processing",
    });

    revalidatePath(`/loans/${parsed.data.loanId}/documents`);
    revalidatePath(`/my-loans/${parsed.data.loanId}`);
    revalidatePath("/my-loans");
    return { ok: true, document };
  } catch (error) {
    console.error("createDocumentRecordAction failed:", error);
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not save the document record.",
    };
  }
}

export async function createDocumentDownloadUrlAction(input: { documentId: string }) {
  const parsed = documentDownloadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid document download request." };
  }

  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false as const, error: "Your session expired. Sign in again." };
    }

    const [{ data: profile }, { data: document, error: documentError }] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      supabase.from("documents").select("loan_id").eq("id", parsed.data.documentId).maybeSingle(),
    ]);

    if (documentError) {
      return { ok: false as const, error: documentError.message };
    }

    if (!document?.loan_id) {
      return { ok: false as const, error: "Document not found." };
    }

    const access = await assertViewerCanAccessLoan(document.loan_id, {
      userId: user.id,
      role: (profile?.role as ProfileRole | null | undefined) ?? null,
    });

    if (!access) {
      return { ok: false as const, error: "You do not have access to this document." };
    }

    const download = await createDocumentDownloadUrl(parsed.data.documentId);
    if (!download) {
      return { ok: false as const, error: "Document not found." };
    }

    return { ok: true as const, download };
  } catch (error) {
    console.error("createDocumentDownloadUrlAction failed:", error);
    return { ok: false as const, error: "Could not prepare the document download." };
  }
}

export async function createBulkDocumentDownloadUrlsAction(input: { loanId: string }) {
  const parsed = bulkDocumentDownloadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid bulk download request." };
  }

  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false as const, error: "Your session expired. Sign in again." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const access = await assertViewerCanAccessLoan(parsed.data.loanId, {
      userId: user.id,
      role: (profile?.role as ProfileRole | null | undefined) ?? null,
    });

    if (!access) {
      return { ok: false as const, error: "You do not have access to this loan." };
    }

    const downloads = await createBulkDocumentDownloadUrls(parsed.data.loanId);
    return { ok: true as const, downloads };
  } catch (error) {
    console.error("createBulkDocumentDownloadUrlsAction failed:", error);
    return { ok: false as const, error: "Could not prepare bulk downloads." };
  }
}
