"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mockBlockchainService } from "@/src/services/blockchain-service";
import { mockDocumentService } from "@/src/services/document-service";
import { useDocumentStore } from "@/src/store/document-store";
import { useUserStore } from "@/src/store/user-store";

export function useBlockchainAudit(loanId: string) {
  const queryClient = useQueryClient();
  const { user } = useUserStore();
  const { setAuditTrail, setVerificationResult } = useDocumentStore();

  const auditQuery = useQuery({
    queryKey: ["mvp-audit-trail", loanId],
    queryFn: () => mockBlockchainService.getAuditTrail(loanId),
    enabled: Boolean(loanId),
  });

  useEffect(() => {
    if (auditQuery.data) {
      setAuditTrail(auditQuery.data);
    }
  }, [auditQuery.data, setAuditTrail]);

  const verifyMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const documents = await mockDocumentService.getDocuments(loanId);
      const document = documents.find((item) => item.id === documentId);
      if (!document) {
        throw new Error("Document not found.");
      }

      const sourceFile =
        mockDocumentService.getCachedFile(documentId) ??
        mockDocumentService.getFileFromIntegritySeed?.(document);

      if (!sourceFile || !document.blockchain?.fileHash) {
        throw new Error("The current file is unavailable for verification.");
      }

      return mockBlockchainService.verifyDocument(
        documentId,
        sourceFile,
        document.blockchain.fileHash,
        loanId,
        user.fullName,
        document.fileName,
      );
    },
    onSuccess: async (result) => {
      setVerificationResult(result);
      await queryClient.invalidateQueries({ queryKey: ["mvp-audit-trail", loanId] });
    },
  });

  return {
    auditTrail: auditQuery.data ?? [],
    isLoadingAuditTrail: auditQuery.isLoading,
    verifyDocument: verifyMutation.mutateAsync,
    isVerifying: verifyMutation.isPending,
  };
}
