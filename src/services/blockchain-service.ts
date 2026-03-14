import { keccak256, toUtf8Bytes } from "ethers";
import { formatISO } from "date-fns";
import {
  createMockDelay,
  createUuid,
  hashStringSha256,
  maskIpAddress,
  persistJson,
  readJson,
  STORAGE_KEYS,
} from "@/src/services/mock-service-utils";
import type {
  AuditEntry,
  BlockchainAnchor,
  VerificationResult,
} from "@/src/types/smart-mortgage";

function readAuditTrail() {
  return readJson<AuditEntry[]>(STORAGE_KEYS.auditTrail, []);
}

function writeAuditTrail(entries: AuditEntry[]) {
  persistJson(STORAGE_KEYS.auditTrail, entries);
}

function appendAuditEntry(entry: AuditEntry) {
  const current = readAuditTrail();
  writeAuditTrail([entry, ...current]);
}

async function sha256FromFile(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", arrayBuffer);
  return `0x${Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}

export const mockBlockchainService = {
  async hashFile(file: File) {
    return sha256FromFile(file);
  },

  async anchorDocument(
    fileHash: string,
    documentId: string,
    loanId: string,
    anchoredBy: string,
    documentName: string,
  ): Promise<BlockchainAnchor> {
    await createMockDelay(1800, 2300);

    // The mock anchor mirrors a two-step trust chain:
    // 1) SHA-256 over the original file bytes
    // 2) Ethereum-style keccak256 wrapping before a fake tx hash is minted
    const keccakHash = keccak256(toUtf8Bytes(fileHash));
    const txHash = keccak256(
      toUtf8Bytes(`${documentId}:${fileHash}:${Date.now().toString()}`),
    );
    const anchor: BlockchainAnchor = {
      documentId,
      fileHash,
      keccakHash,
      txHash,
      blockNumber: Math.floor(Math.random() * 900000 + 19000000),
      timestamp: formatISO(new Date()),
      anchoredBy,
      status: "anchored",
    };

    appendAuditEntry({
      id: createUuid("audit"),
      loanId,
      timestamp: anchor.timestamp,
      action: "anchor_complete",
      documentId,
      documentName,
      user: anchoredBy,
      ipAddressMasked: maskIpAddress(),
      txHash,
    });

    return anchor;
  },

  async verifyDocument(
    documentId: string,
    currentFile: File,
    storedHash: string,
    loanId: string,
    user: string,
    documentName: string,
  ): Promise<VerificationResult> {
    await createMockDelay(450, 900);
    const currentHash = await sha256FromFile(currentFile);
    const result: VerificationResult = {
      documentId,
      matches: currentHash === storedHash,
      checkedAt: formatISO(new Date()),
      currentHash,
      storedHash,
    };

    appendAuditEntry({
      id: createUuid("audit"),
      loanId,
      timestamp: result.checkedAt,
      action: "verify_integrity",
      documentId,
      documentName,
      user,
      ipAddressMasked: maskIpAddress(),
      txHash: null,
    });

    return result;
  },

  async getAuditTrail(loanId: string) {
    await createMockDelay(300, 800);
    return readAuditTrail().filter((entry) => entry.loanId === loanId);
  },

  async buildSyntheticHash(seed: string) {
    const fileHash = await hashStringSha256(seed);
    const txHash = keccak256(toUtf8Bytes(`${seed}:${Date.now().toString()}`));
    return { fileHash, txHash };
  },
};
