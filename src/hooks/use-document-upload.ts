"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mockBlockchainService } from "@/src/services/blockchain-service";
import { mockDocumentService, type MockDocumentUploadResult } from "@/src/services/document-service";
import { useDocumentStore } from "@/src/store/document-store";
import { useUserStore } from "@/src/store/user-store";

export function useDocumentUpload(loanId: string) {
  const queryClient = useQueryClient();
  const { user } = useUserStore();
  const { setDocuments } = useDocumentStore();
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [ocrProcessingIds, setOcrProcessingIds] = useState<string[]>([]);

  const documentsQuery = useQuery({
    queryKey: ["mvp-documents", loanId],
    queryFn: () => mockDocumentService.getDocuments(loanId),
    enabled: Boolean(loanId),
  });

  useEffect(() => {
    if (documentsQuery.data) {
      setDocuments(documentsQuery.data);
    }
  }, [documentsQuery.data, setDocuments]);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const upload = await mockDocumentService.uploadDocument(file, loanId, user, (progress) => {
        setUploadProgress((current) => ({ ...current, [file.name]: progress }));
      });

      setOcrProcessingIds((current) => [...current, upload.document.id]);
      const ocrResult = await mockDocumentService.categorizeDocument(file);
      // The vault stores the raw upload first, then enriches it with OCR metadata,
      // and only after that anchors the immutable file hash to the mock chain.
      const fileHash = await mockBlockchainService.hashFile(file);
      const anchoredHash = await mockBlockchainService.anchorDocument(
        fileHash,
        upload.document.id,
        loanId,
        user.fullName,
        upload.document.fileName,
      );

      await mockDocumentService.updateDocument(upload.document.id, (current) => ({
        ...current,
        category: ocrResult.category,
        detectedType: ocrResult.detectedType,
        confidence: ocrResult.confidence,
        extractedFields: ocrResult.extractedFields,
      }));
      await mockDocumentService.updateAnchoredDocument(upload.document.id, anchoredHash);

      return upload;
    },
    onSuccess: async (result) => {
      setOcrProcessingIds((current) => current.filter((id) => id !== result.document.id));
      setUploadProgress((current) => {
        const next = { ...current };
        delete next[result.document.fileName];
        return next;
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["mvp-documents", loanId] }),
        queryClient.invalidateQueries({ queryKey: ["mvp-audit-trail", loanId] }),
      ]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ documentId, reason }: { documentId: string; reason: string }) =>
      mockDocumentService.deleteDocument(documentId, reason, user),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["mvp-documents", loanId] }),
        queryClient.invalidateQueries({ queryKey: ["mvp-audit-trail", loanId] }),
      ]);
    },
  });

  const replaceMutation = useMutation({
    mutationFn: ({ documentId, file }: { documentId: string; file: File }) =>
      mockDocumentService.replaceDocument(documentId, file, user),
    onSuccess: async (result) => {
      if (result) {
        const sourceFile =
          mockDocumentService.getCachedFile(result.id) ??
          mockDocumentService.getFileFromIntegritySeed(result);
        const fileHash = await mockBlockchainService.hashFile(sourceFile);
        const anchor = await mockBlockchainService.anchorDocument(
          fileHash,
          result.id,
          loanId,
          user.fullName,
          result.fileName,
        );
        await mockDocumentService.updateAnchoredDocument(result.id, anchor);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["mvp-documents", loanId] }),
        queryClient.invalidateQueries({ queryKey: ["mvp-audit-trail", loanId] }),
      ]);
    },
  });

  return {
    documents: documentsQuery.data ?? [],
    isLoadingDocuments: documentsQuery.isLoading,
    uploadDocument: (file: File) => uploadMutation.mutateAsync(file),
    deleteDocument: deleteMutation.mutateAsync,
    replaceDocument: replaceMutation.mutateAsync,
    uploadProgress,
    ocrProcessingIds,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isReplacing: replaceMutation.isPending,
  };
}

export type DocumentUploadMutationResult = MockDocumentUploadResult;
