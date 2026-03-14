import { getUnixTime } from "date-fns";

export const STORAGE_KEYS = {
  draft: "smartmortgagepro.msp.loanDraft",
  documents: "smartmortgagepro.msp.documents",
  auditTrail: "smartmortgagepro.msp.auditTrail",
  submission: "smartmortgagepro.msp.submission",
} as const;

export function createMockDelay(min = 300, max = 1500) {
  const duration = Math.round(Math.random() * (max - min) + min);
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

export function persistJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function createUuid(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 11)}`;
}

export function maskIpAddress() {
  const octets = [192, 168, Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)];
  return `${octets[0]}.${octets[1]}.${octets[2]}.***`;
}

export function buildReferenceNumber() {
  const timestamp = getUnixTime(new Date()).toString().slice(-4);
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `${timestamp}-${random}`;
}

export async function hashStringSha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const buffer = await crypto.subtle.digest("SHA-256", bytes);
  return `0x${Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}
