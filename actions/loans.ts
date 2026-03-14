"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createLoan, deleteLoan, updateLoanStage } from "@/lib/services/loans";
import { getAuthenticatedViewer } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/auth/roles";
import type { LoanPriority, LoanStage } from "@/types/database.types";

const createLoanSchema = z.object({
  borrowerName: z.string().min(2).max(120),
  propertyAddress: z.string().min(5).max(240),
  loanAmount: z.coerce.number().positive().max(1000000000),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  expectedCloseDate: z.string().optional(),
  borrowerEmail: z.email().optional(),
});

const updateStageSchema = z.object({
  loanId: z.string().uuid(),
  stage: z.enum(["application", "processing", "underwriting", "approved", "closing"]),
});

const deleteLoanSchema = z.object({
  loanId: z.string().uuid(),
});

type ActionResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
    };

export async function createLoanAction(input: {
  borrowerName: string;
  propertyAddress: string;
  loanAmount: number;
  priority?: LoanPriority;
  expectedCloseDate?: string;
  borrowerEmail?: string;
}): Promise<ActionResult> {
  const parsed = createLoanSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please provide valid loan details." };
  }

  const viewer = await getAuthenticatedViewer();
  if (!viewer) {
    return { ok: false, error: "Authentication required." };
  }

  try {
    let borrowerId: string | null = null;

    if (parsed.data.borrowerEmail) {
      const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
      const admin = createSupabaseAdminClient();
      const { data: users } = await admin.auth.admin.listUsers();
      const match = users?.users?.find(
        (u) => u.email?.toLowerCase() === parsed.data.borrowerEmail!.toLowerCase(),
      );
      if (match) {
        borrowerId = match.id;
      }
    }

    await createLoan({
      borrowerName: parsed.data.borrowerName,
      propertyAddress: parsed.data.propertyAddress,
      loanAmount: parsed.data.loanAmount,
      priority: parsed.data.priority,
      expectedCloseDate: parsed.data.expectedCloseDate || null,
      borrowerId,
      loanOfficerId: viewer.role && isStaffRole(viewer.role) ? viewer.userId : null,
    });
    revalidatePath("/dashboard");
    revalidatePath("/pipeline");
    return { ok: true };
  } catch (error) {
    console.error("createLoanAction failed:", error);
    return { ok: false, error: "Could not create loan. Check Supabase connection." };
  }
}

export async function updateLoanStageAction(input: {
  loanId: string;
  stage: LoanStage;
}): Promise<ActionResult> {
  const parsed = updateStageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid stage update payload." };
  }

  try {
    await updateLoanStage(parsed.data.loanId, parsed.data.stage);
    revalidatePath("/dashboard");
    revalidatePath("/pipeline");
    return { ok: true };
  } catch (error) {
    console.error("updateLoanStageAction failed:", error);
    return { ok: false, error: "Could not update the loan stage." };
  }
}

export async function deleteLoanAction(input: { loanId: string }): Promise<ActionResult> {
  const parsed = deleteLoanSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid delete request." };
  }

  try {
    await deleteLoan(parsed.data.loanId);
    revalidatePath("/dashboard");
    revalidatePath("/pipeline");
    return { ok: true };
  } catch (error) {
    console.error("deleteLoanAction failed:", error);
    return { ok: false, error: "Could not archive the loan." };
  }
}
