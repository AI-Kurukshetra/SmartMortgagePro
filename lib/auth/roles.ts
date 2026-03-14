import type { ProfileRole } from "@/types/database.types";

export const ROLE_KEYS = [
  "borrower",
  "loan_officer",
  "processor",
  "underwriter",
  "admin",
] as const satisfies readonly ProfileRole[];

export const STAFF_ROLES: readonly ProfileRole[] = [
  "loan_officer",
  "processor",
  "underwriter",
  "admin",
];

export const DEFAULT_ROLE: ProfileRole = "borrower";

export function isProfileRole(value: unknown): value is ProfileRole {
  return typeof value === "string" && (ROLE_KEYS as readonly string[]).includes(value);
}

export function isStaffRole(role: ProfileRole) {
  return STAFF_ROLES.includes(role);
}
