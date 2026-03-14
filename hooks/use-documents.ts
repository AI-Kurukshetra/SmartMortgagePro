"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  ALLOWED_DOCUMENT_MIME_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
} from "@/lib/documents/shared";
import type { DocumentRecord } from "@/lib/documents/shared";
import type { DocCategory } from "@/types/database.types";

type PendingUpload = {
  id: string;
  fileName: string;
  progress: number;
  status: "uploading" | "processing" | "error";
  errorMessage?: string;
};

type UseDocumentsParams = {
  loanId: string;
  initialDocuments: DocumentRecord[];
};

type CreateDocumentApiResponse =
  | { ok: true; document: DocumentRecord }
  | { ok: false; error: string };

type DownloadDocumentApiResponse =
  | {
      ok: true;
      download: {
        documentId: string;
        fileName: string;
        url: string;
      };
    }
  | { ok: false; error: string };

type BulkDownloadApiResponse =
  | {
      ok: true;
      downloads: Array<{
        documentId: string;
        fileName: string;
        url: string;
      }>;
    }
  | { ok: false; error: string };

type CloudinaryUploadApiResponse =
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

function getExtension(name: string) {
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex < 0) return "";
  return name.slice(dotIndex).toLowerCase();
}

function isAllowedFile(file: File) {
  const extension = getExtension(file.name);
  return (
    (ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(file.type) ||
    (ALLOWED_DOCUMENT_EXTENSIONS as readonly string[]).includes(extension)
  );
}

function triggerBrowserDownload(url: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => null)) as T | null;
  if (!data) {
    throw new Error("The server returned an invalid response.");
  }

  return data;
}

export function useDocuments({ loanId, initialDocuments }: UseDocumentsParams) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBulkDownloading, startBulkDownloadTransition] = useTransition();
  const uploadFiles = async (files: File[], category: DocCategory) => {
    setErrorMessage(null);

    const validFiles = files.filter((file) => file.size > 0);
    if (!validFiles.length) {
      setErrorMessage("Choose at least one non-empty file to upload.");
      return;
    }

    for (const file of validFiles) {
      if (!isAllowedFile(file)) {
        setErrorMessage("Unsupported file type. Use PDF, JPG, or PNG files only.");
        continue;
      }

      if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
        setErrorMessage("File too large. Upload files up to 50MB each.");
        continue;
      }

      const uploadId = `${Date.now()}-${file.name}`;
      setPendingUploads((current) => [
        {
          id: uploadId,
          fileName: file.name,
          progress: 8,
          status: "uploading",
        },
        ...current,
      ]);

      const intervalId = window.setInterval(() => {
        setPendingUploads((current) =>
          current.map((upload) =>
            upload.id === uploadId && upload.progress < 88
              ? { ...upload, progress: Math.min(upload.progress + 12, 88) }
              : upload,
          ),
        );
      }, 180);

      try {
        const uploadFormData = new FormData();
        uploadFormData.set("loanId", loanId);
        uploadFormData.set("file", file);

        const uploadResponse = await fetch("/api/uploads/cloudinary", {
          method: "POST",
          body: uploadFormData,
        });
        const uploadResult = await parseApiResponse<CloudinaryUploadApiResponse>(
          uploadResponse,
        );

        if (!uploadResponse.ok || !uploadResult.ok) {
          throw new Error(uploadResult.ok ? "Could not upload the document file." : uploadResult.error);
        }

        setPendingUploads((current) =>
          current.map((upload) =>
            upload.id === uploadId ? { ...upload, progress: 92, status: "processing" } : upload,
          ),
        );

        const response = await fetch(`/api/loans/${loanId}/documents`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            category,
            fileName: file.name,
            fileSize: uploadResult.upload.bytes || file.size,
            mimeType: uploadResult.upload.mimeType || file.type || "application/octet-stream",
            storagePath: uploadResult.upload.storagePath,
          }),
        });
        const result = await parseApiResponse<CreateDocumentApiResponse>(response);

        if (!response.ok || !result.ok) {
          throw new Error(result.ok ? "Could not save the document record." : result.error);
        }

        setDocuments((current) => [result.document, ...current]);
        setPendingUploads((current) =>
          current.map((upload) =>
            upload.id === uploadId ? { ...upload, progress: 100, status: "processing" } : upload,
          ),
        );

        toast.success(`${file.name} uploaded successfully.`);

        window.setTimeout(() => {
          setPendingUploads((current) => current.filter((upload) => upload.id !== uploadId));
        }, 900);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not upload the selected document.";

        setErrorMessage(message);
        toast.error(message);
        setPendingUploads((current) =>
          current.map((upload) =>
            upload.id === uploadId
              ? { ...upload, status: "error", errorMessage: message, progress: 100 }
              : upload,
          ),
        );
      } finally {
        window.clearInterval(intervalId);
      }
    }

    router.refresh();
  };

  const downloadDocument = async (documentId: string) => {
    setErrorMessage(null);
    const response = await fetch(`/api/documents/${documentId}/download`, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });
    const result = await parseApiResponse<DownloadDocumentApiResponse>(response);

    if (!response.ok || !result.ok) {
      const msg = result.ok ? "Could not prepare the document download." : result.error;
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    toast.success("Download started.");
    triggerBrowserDownload(result.download.url, result.download.fileName);
  };

  const downloadAllDocuments = () => {
    setErrorMessage(null);

    startBulkDownloadTransition(() => {
      void (async () => {
        const response = await fetch(`/api/loans/${loanId}/documents/downloads`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ loanId }),
        });
        const result = await parseApiResponse<BulkDownloadApiResponse>(response);

        if (!response.ok || !result.ok) {
          const msg = result.ok ? "Could not prepare bulk downloads." : result.error;
          setErrorMessage(msg);
          toast.error(msg);
          return;
        }

        if (!result.downloads.length) {
          const msg = "There are no uploaded files to download yet.";
          setErrorMessage(msg);
          toast.info(msg);
          return;
        }

        result.downloads.forEach((download, index) => {
          window.setTimeout(() => {
            triggerBrowserDownload(download.url, download.fileName);
          }, index * 180);
        });
      })();
    });
  };

  return {
    documents,
    errorMessage,
    isBulkDownloading,
    pendingUploads,
    uploadFiles,
    downloadDocument,
    downloadAllDocuments,
    clearErrorMessage: () => setErrorMessage(null),
  };
}
