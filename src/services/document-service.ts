import { formatISO, subDays } from "date-fns";
import {
  createMockDelay,
  createUuid,
  maskIpAddress,
  persistJson,
  readJson,
  STORAGE_KEYS,
} from "@/src/services/mock-service-utils";
import type {
  AuditEntry,
  BlockchainAnchor,
  Document,
  DocumentVersion,
  OCRResult,
  User,
} from "@/src/types/smart-mortgage";

type UploadResult = {
  document: Document;
};

const runtimeFileCache = new Map<string, File>();

function readDocuments() {
  return readJson<Document[]>(STORAGE_KEYS.documents, []);
}

function writeDocuments(documents: Document[]) {
  persistJson(STORAGE_KEYS.documents, documents);
}

function readAuditTrail() {
  return readJson<AuditEntry[]>(STORAGE_KEYS.auditTrail, []);
}

function writeAuditTrail(entries: AuditEntry[]) {
  persistJson(STORAGE_KEYS.auditTrail, entries);
}

function appendAuditEntry(entry: AuditEntry) {
  writeAuditTrail([entry, ...readAuditTrail()]);
}

function matches(name: string, values: string[]) {
  return values.some((value) => name.includes(value));
}

function inferOcrResult(fileName: string): OCRResult {
  const lowerName = fileName.toLowerCase();

  if (matches(lowerName, ["pay", "stub"])) {
    return {
      category: "income",
      detectedType: "pay_stub",
      confidence: 92,
      extractedFields: ["Employer: Acme Corp", "Income: $85,000", "Pay Frequency: Bi-weekly"],
    };
  }
  if (matches(lowerName, ["w2"])) {
    return {
      category: "income",
      detectedType: "w2",
      confidence: 95,
      extractedFields: ["Tax Year: 2025", "Wages: $94,620", "Employer: Acme Corp"],
    };
  }
  if (matches(lowerName, ["1099", "tax", "return"])) {
    return {
      category: "income",
      detectedType: lowerName.includes("1099") ? "1099" : "tax_return",
      confidence: 86,
      extractedFields: ["Adjusted Gross Income: $112,400", "Filing Status: Married"],
    };
  }
  if (matches(lowerName, ["bank", "statement"])) {
    return {
      category: "assets",
      detectedType: "bank_statement",
      confidence: 91,
      extractedFields: ["Institution: Harbor Bank", "Ending Balance: $42,780"],
    };
  }
  if (matches(lowerName, ["investment", "brokerage"])) {
    return {
      category: "assets",
      detectedType: "investment_statement",
      confidence: 78,
      extractedFields: ["Institution: Meridian Investments", "Portfolio Value: $130,500"],
    };
  }
  if (matches(lowerName, ["retirement", "401k"])) {
    return {
      category: "assets",
      detectedType: "retirement_account",
      confidence: 79,
      extractedFields: ["Plan Type: 401(k)", "Balance: $210,300"],
    };
  }
  if (matches(lowerName, ["contract", "purchase"])) {
    return {
      category: "property",
      detectedType: "purchase_contract",
      confidence: 88,
      extractedFields: ["Purchase Price: $525,000", "Contract Date: 2026-03-12"],
    };
  }
  if (matches(lowerName, ["hoa"])) {
    return {
      category: "property",
      detectedType: "hoa_docs",
      confidence: 74,
      extractedFields: ["HOA Fee: $285/mo", "Association: Elm Point HOA"],
    };
  }
  if (matches(lowerName, ["tax", "property"])) {
    return {
      category: "property",
      detectedType: "property_tax_record",
      confidence: 82,
      extractedFields: ["Annual Taxes: $6,950", "Parcel ID: 18-302-771"],
    };
  }
  if (matches(lowerName, ["license", "passport", "id"])) {
    return {
      category: "identity",
      detectedType: "government_id",
      confidence: 96,
      extractedFields: ["Name Match: Jordan Bennett", "Expiration: 2029-07-14"],
    };
  }
  if (matches(lowerName, ["social", "ssn"])) {
    return {
      category: "identity",
      detectedType: "social_security_card",
      confidence: 89,
      extractedFields: ["Name Match: Jordan Bennett"],
    };
  }
  if (matches(lowerName, ["credit"])) {
    return {
      category: "credit",
      detectedType: "credit_report",
      confidence: 81,
      extractedFields: ["Score Snapshot: 742", "Public Records: 0"],
    };
  }

  return {
    category: "other",
    detectedType: "miscellaneous",
    confidence: 68,
    extractedFields: ["Manual review recommended", "Low confidence extraction"],
  };
}

async function toDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

export function dataUrlToFile(dataUrl: string, fileName: string, mimeType: string) {
  const [meta, content] = dataUrl.split(",");
  const binary = atob(content ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], fileName, { type: mimeType || meta?.split(":")[1]?.split(";")[0] });
}

export const mockDocumentService = {
  async uploadDocument(
    file: File,
    loanId: string,
    user: User,
    onProgress: (progress: number) => void,
  ): Promise<UploadResult> {
    let progress = 0;

    while (progress < 100) {
      await createMockDelay(120, 220);
      progress = Math.min(progress + Math.floor(Math.random() * 22 + 12), 100);
      onProgress(progress);
    }

    const uploadedAt = Math.random() > 0.75 ? formatISO(subDays(new Date(), 72)) : formatISO(new Date());
    const previewUrl = file.type.startsWith("image/") ? await toDataUrl(file) : null;
    const integritySeed = await toDataUrl(file);
    const ocr = inferOcrResult(file.name);
    const fraudDetected = Math.random() < 0.1;
    const documentId = createUuid("doc");

    const document: Document = {
      id: documentId,
      loanId,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      previewUrl,
      uploadedAt,
      uploadedBy: user.fullName,
      category: ocr.category,
      detectedType: ocr.detectedType,
      confidence: ocr.confidence - Math.floor(Math.random() * 12),
      extractedFields: ocr.extractedFields,
      blockchain: null,
      blockchainStatus: "pending",
      checklistStatus: "uploaded_pending_review",
      deleted: false,
      deletedReason: null,
      version: 1,
      fraudSignal: {
        detected: fraudDetected,
        label: fraudDetected ? "Metadata Anomaly Detected" : "No anomaly detected",
        severity: fraudDetected ? "high" : "low",
      },
      integritySeed,
      versions: [
        {
          id: createUuid("doc-version"),
          version: 1,
          uploadedAt,
          uploader: user.fullName,
          fileHash: "",
          txHash: null,
          blockNumber: null,
          fileName: file.name,
        },
      ],
    };

    runtimeFileCache.set(documentId, file);

    const current = readDocuments();
    writeDocuments([document, ...current]);
    appendAuditEntry({
      id: createUuid("audit"),
      loanId,
      timestamp: uploadedAt,
      action: "upload",
      documentId,
      documentName: file.name,
      user: user.fullName,
      ipAddressMasked: maskIpAddress(),
      txHash: null,
    });

    return { document };
  },

  async categorizeDocument(file: File): Promise<OCRResult> {
    await createMockDelay(1800, 2300);
    const result = inferOcrResult(file.name);
    return {
      ...result,
      confidence:
        result.confidence > 75
          ? result.confidence
          : Math.floor(Math.random() * 18 + 62),
    };
  },

  async getDocuments(loanId: string): Promise<Document[]> {
    await createMockDelay(300, 650);
    return readDocuments().filter((document) => document.loanId === loanId && !document.deleted);
  },

  async updateDocument(documentId: string, updater: (document: Document) => Document) {
    const next = readDocuments().map((document) =>
      document.id === documentId ? updater(document) : document,
    );
    writeDocuments(next);
    return next.find((document) => document.id === documentId) ?? null;
  },

  async deleteDocument(documentId: string, reason: string, user: User): Promise<void> {
    await createMockDelay(320, 700);
    const current = readDocuments();
    const document = current.find((item) => item.id === documentId);
    if (!document) return;

    const next = current.map((item) =>
      item.id === documentId
        ? { ...item, deleted: true, deletedReason: reason, checklistStatus: "rejected" as const }
        : item,
    );

    writeDocuments(next);
    appendAuditEntry({
      id: createUuid("audit"),
      loanId: document.loanId,
      timestamp: formatISO(new Date()),
      action: "delete",
      documentId,
      documentName: document.fileName,
      user: user.fullName,
      ipAddressMasked: maskIpAddress(),
      txHash: null,
    });
  },

  async replaceDocument(documentId: string, file: File, user: User): Promise<Document | null> {
    await createMockDelay(500, 900);
    const current = readDocuments();
    const existing = current.find((document) => document.id === documentId);
    if (!existing) return null;

    const previewUrl = file.type.startsWith("image/") ? await toDataUrl(file) : null;
    const integritySeed = await toDataUrl(file);
    runtimeFileCache.set(documentId, file);

    const nextVersion = existing.version + 1;
    const updatedVersion: DocumentVersion = {
      id: createUuid("doc-version"),
      version: nextVersion,
      uploadedAt: formatISO(new Date()),
      uploader: user.fullName,
      fileHash: existing.blockchain?.fileHash ?? "",
      txHash: existing.blockchain?.txHash ?? null,
      blockNumber: existing.blockchain?.blockNumber ?? null,
      fileName: file.name,
    };

    const updated = {
      ...existing,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      previewUrl,
      uploadedAt: updatedVersion.uploadedAt,
      uploadedBy: user.fullName,
      version: nextVersion,
      integritySeed,
      blockchain: null,
      blockchainStatus: "pending" as const,
      versions: [updatedVersion, ...existing.versions],
      deleted: false,
      deletedReason: null,
    };

    writeDocuments(current.map((document) => (document.id === documentId ? updated : document)));
    appendAuditEntry({
      id: createUuid("audit"),
      loanId: existing.loanId,
      timestamp: updatedVersion.uploadedAt,
      action: "replace",
      documentId,
      documentName: file.name,
      user: user.fullName,
      ipAddressMasked: maskIpAddress(),
      txHash: null,
    });

    return updated;
  },

  async getVersionHistory(documentId: string) {
    await createMockDelay(250, 500);
    return readDocuments().find((document) => document.id === documentId)?.versions ?? [];
  },

  getCachedFile(documentId: string) {
    return runtimeFileCache.get(documentId) ?? null;
  },

  getFileFromIntegritySeed(document: Pick<Document, "integritySeed" | "fileName" | "mimeType">) {
    return dataUrlToFile(document.integritySeed, document.fileName, document.mimeType);
  },

  async recordDocumentAction(
    documentId: string,
    action: AuditEntry["action"],
    user: User,
  ) {
    const document = readDocuments().find((item) => item.id === documentId);
    if (!document) return;

    appendAuditEntry({
      id: createUuid("audit"),
      loanId: document.loanId,
      timestamp: formatISO(new Date()),
      action,
      documentId,
      documentName: document.fileName,
      user: user.fullName,
      ipAddressMasked: maskIpAddress(),
      txHash: document.blockchain?.txHash ?? null,
    });
  },

  async updateAnchoredDocument(
    documentId: string,
    anchor: BlockchainAnchor,
  ) {
    const next = readDocuments().map((document) => {
      if (document.id !== documentId) return document;

      const versions = document.versions.map((version, index) =>
        index === 0
          ? {
              ...version,
              fileHash: anchor.fileHash,
              txHash: anchor.txHash,
              blockNumber: anchor.blockNumber,
            }
          : version,
      );

      return {
        ...document,
        blockchain: anchor,
        blockchainStatus: "anchored" as const,
        versions,
      };
    });

    writeDocuments(next);
    return next.find((document) => document.id === documentId) ?? null;
  },
};

export type MockDocumentUploadResult = UploadResult;
