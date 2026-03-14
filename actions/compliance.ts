"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createComplianceCheck,
  createComplianceEvent,
  updateComplianceCheckStatus,
} from "@/lib/services/compliance";
import { assertComplianceLoanAccess } from "@/lib/services/compliance-access";
import type { ComplianceCheckStatus, Regulation } from "@/types/database.types";

const createComplianceCheckSchema = z.object({
  loanId: z.string().uuid(),
  regulation: z.enum([
    "trid",
    "respa",
    "hmda",
    "ecoa",
    "fcra",
    "glba",
    "state",
    "ada",
  ] satisfies [Regulation, ...Regulation[]]),
  checkName: z.string().trim().min(3).max(160),
  description: z.string().trim().min(3).max(2000),
  remediation: z.string().trim().max(2000).optional(),
  deadline: z.string().datetime().optional(),
  status: z
    .enum(["pass", "warning", "violation", "pending", "waived"] satisfies [
      ComplianceCheckStatus,
      ...ComplianceCheckStatus[],
    ])
    .optional(),
});

const createComplianceEventSchema = z.object({
  loanId: z.string().uuid(),
  eventType: z.string().trim().min(3).max(120),
  eventDate: z.string().datetime().optional(),
  notes: z.string().trim().max(2000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const updateComplianceCheckSchema = z
  .object({
    loanId: z.string().uuid(),
    checkId: z.string().uuid(),
    status: z.enum(["pass", "warning", "violation", "pending", "waived"] satisfies [
      ComplianceCheckStatus,
      ...ComplianceCheckStatus[],
    ]),
    waiverReason: z.string().trim().max(2000).optional(),
  })
  .superRefine((value, context) => {
    if (value.status === "waived" && !value.waiverReason) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Waiver reason is required when waiving a compliance check.",
        path: ["waiverReason"],
      });
    }
  });

type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? Record<string, never> : { data: T }))
  | {
      ok: false;
      error: string;
    };

function revalidateCompliancePaths(loanId: string) {
  revalidatePath(`/loans/${loanId}/compliance`);
  revalidatePath(`/loans/${loanId}/documents`);
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
}

export async function createComplianceCheckAction(input: {
  loanId: string;
  regulation: Regulation;
  checkName: string;
  description: string;
  remediation?: string;
  deadline?: string;
  status?: ComplianceCheckStatus;
}): Promise<ActionResult<Awaited<ReturnType<typeof createComplianceCheck>>>> {
  const parsed = createComplianceCheckSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please provide a valid compliance check." };
  }

  try {
    const access = await assertComplianceLoanAccess(parsed.data.loanId, { requireStaff: true });
    if (!access.allowed || !access.viewer) {
      return { ok: false, error: "You do not have access to update compliance for this loan." };
    }

    const check = await createComplianceCheck({
      ...parsed.data,
      createdBy: access.viewer.userId,
    });

    revalidateCompliancePaths(parsed.data.loanId);
    return { ok: true, data: check };
  } catch (error) {
    console.error("createComplianceCheckAction failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not create the compliance check.",
    };
  }
}

export async function createComplianceEventAction(input: {
  loanId: string;
  eventType: string;
  eventDate?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}): Promise<ActionResult<Awaited<ReturnType<typeof createComplianceEvent>>>> {
  const parsed = createComplianceEventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please provide a valid compliance event." };
  }

  try {
    const access = await assertComplianceLoanAccess(parsed.data.loanId, { requireStaff: true });
    if (!access.allowed || !access.viewer) {
      return { ok: false, error: "You do not have access to log compliance events for this loan." };
    }

    const event = await createComplianceEvent({
      ...parsed.data,
      performedBy: access.viewer.userId,
    });

    revalidateCompliancePaths(parsed.data.loanId);
    return { ok: true, data: event };
  } catch (error) {
    console.error("createComplianceEventAction failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not log the compliance event.",
    };
  }
}

export async function updateComplianceCheckStatusAction(input: {
  loanId: string;
  checkId: string;
  status: ComplianceCheckStatus;
  waiverReason?: string;
}): Promise<ActionResult<Awaited<ReturnType<typeof updateComplianceCheckStatus>>>> {
  const parsed = updateComplianceCheckSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please provide a valid compliance status update." };
  }

  try {
    const access = await assertComplianceLoanAccess(parsed.data.loanId, { requireStaff: true });
    if (!access.allowed || !access.viewer) {
      return { ok: false, error: "You do not have access to update compliance for this loan." };
    }

    const check = await updateComplianceCheckStatus({
      ...parsed.data,
      performedBy: access.viewer.userId,
    });

    revalidateCompliancePaths(parsed.data.loanId);
    return { ok: true, data: check };
  } catch (error) {
    console.error("updateComplianceCheckStatusAction failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not update the compliance check.",
    };
  }
}
