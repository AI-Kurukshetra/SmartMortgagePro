"use client";

import { create } from "zustand";
import type { AuditEntry, Document, VerificationResult } from "@/src/types/smart-mortgage";

type DocumentViewMode = "grid" | "list";

type DocumentState = {
  documents: Document[];
  auditTrail: AuditEntry[];
  verificationResult: VerificationResult | null;
  selectedDocumentId: string | null;
  viewMode: DocumentViewMode;
  setDocuments: (documents: Document[]) => void;
  setAuditTrail: (auditTrail: AuditEntry[]) => void;
  setVerificationResult: (result: VerificationResult | null) => void;
  setSelectedDocumentId: (documentId: string | null) => void;
  setViewMode: (mode: DocumentViewMode) => void;
};

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  auditTrail: [],
  verificationResult: null,
  selectedDocumentId: null,
  viewMode: "grid",
  setDocuments: (documents) => set({ documents }),
  setAuditTrail: (auditTrail) => set({ auditTrail }),
  setVerificationResult: (verificationResult) => set({ verificationResult }),
  setSelectedDocumentId: (selectedDocumentId) => set({ selectedDocumentId }),
  setViewMode: (viewMode) => set({ viewMode }),
}));
