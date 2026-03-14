import { z } from "zod";
import { ALLOWED_DOCUMENT_MIME_TYPES, MAX_DOCUMENT_SIZE_BYTES } from "@/lib/documents/shared";
import type { DocCategory } from "@/types/database.types";

export const docCategorySchema = z.enum([
  "pay_stub",
  "w2",
  "bank_statement",
  "tax_return",
  "id_document",
  "employment_letter",
  "other",
] satisfies [DocCategory, ...DocCategory[]]);

export const createDocumentSchema = z.object({
  loanId: z.string().uuid(),
  category: docCategorySchema,
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive().max(MAX_DOCUMENT_SIZE_BYTES),
  mimeType: z.string().refine(
    (value) =>
      (ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(value) ||
      value === "image/jpg",
    "Only PDF, JPG, and PNG files are allowed.",
  ),
  storagePath: z.string().min(1).max(2048),
});

export const documentDownloadSchema = z.object({
  documentId: z.string().uuid(),
});

export const bulkDocumentDownloadSchema = z.object({
  loanId: z.string().uuid(),
});
