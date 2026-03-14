"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetcher } from "@/lib/api/fetcher";
import { queryKeys } from "@/lib/api/query-keys";
import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  ALLOWED_DOCUMENT_MIME_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
  type DocumentRecord,
  type LoanDocumentSummary,
} from "@/lib/documents/shared";
import type { DocCategory } from "@/types/database.types";

type DocumentsResponse = {
  ok: true;
  loan: LoanDocumentSummary;
  documents: DocumentRecord[];
};

type CreateDocumentResponse = { ok: true; document: DocumentRecord };
type CloudinaryUploadResponse =
  | {
      ok: true;
      upload: {
        storagePath: string;
        provider: "cloudinary" | "supabase";
        publicId?: string;
        url?: string;
        bytes: number;
        mimeType: string;
      };
    }
  | { ok: false; error: string };

function isAllowedFile(file: File) {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  return (
    (ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(file.type) ||
    (ALLOWED_DOCUMENT_EXTENSIONS as readonly string[]).includes(ext)
  );
}

function triggerDownload(url: string, fileName: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function useLoanDocuments(loanId: string) {
  return useQuery({
    queryKey: queryKeys.documents(loanId),
    queryFn: () => fetcher<DocumentsResponse>(`/api/loans/${loanId}/documents`),
    enabled: Boolean(loanId),
  });
}

export function useUploadDocument(loanId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, category }: { file: File; category: DocCategory }) => {
      if (!isAllowedFile(file)) {
        throw new Error("Unsupported file type. Use PDF, JPG, or PNG files only.");
      }
      if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
        throw new Error("File too large. Upload files up to 50MB each.");
      }

      const uploadFormData = new FormData();
      uploadFormData.set("loanId", loanId);
      uploadFormData.set("file", file);

      const uploadResponse = await fetch("/api/uploads/cloudinary", {
        method: "POST",
        body: uploadFormData,
      });
      const uploadResult = (await uploadResponse.json().catch(() => null)) as
        | CloudinaryUploadResponse
        | null;

      if (!uploadResponse.ok || !uploadResult || !uploadResult.ok) {
        throw new Error(
          uploadResult && !uploadResult.ok
            ? uploadResult.error
            : "Could not upload the selected file.",
        );
      }

      return fetcher<CreateDocumentResponse>(`/api/loans/${loanId}/documents`, {
        method: "POST",
        body: JSON.stringify({
          category,
          fileName: file.name,
          fileSize: uploadResult.upload.bytes || file.size,
          mimeType: uploadResult.upload.mimeType || file.type || "application/octet-stream",
          storagePath: uploadResult.upload.storagePath,
        }),
      });
    },
    onSuccess: (_, { file }) => {
      toast.success(`${file.name} uploaded successfully.`);
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents(loanId) });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDownloadDocument() {
  return useMutation({
    mutationFn: async (documentId: string) => {
      type Res = { ok: true; download: { documentId: string; fileName: string; url: string } };
      return fetcher<Res>(`/api/documents/${documentId}/download`);
    },
    onSuccess: ({ download }) => {
      triggerDownload(download.url, download.fileName);
      toast.success("Download started.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
