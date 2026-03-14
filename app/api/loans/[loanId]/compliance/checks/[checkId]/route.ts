import { NextResponse } from "next/server";
import { z } from "zod";
import { updateComplianceCheckStatus } from "@/lib/services/compliance";
import { assertComplianceLoanAccess } from "@/lib/services/compliance-access";
import type { ComplianceCheckStatus } from "@/types/database.types";

const updateComplianceCheckSchema = z
  .object({
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ loanId: string; checkId: string }> },
) {
  const { loanId, checkId } = await context.params;
  const access = await assertComplianceLoanAccess(loanId, { requireStaff: true });

  if (!access.allowed || !access.viewer) {
    return NextResponse.json(
      { ok: false, error: access.reason === "unauthorized" ? "Unauthorized" : "Forbidden" },
      { status: access.reason === "unauthorized" ? 401 : 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = updateComplianceCheckSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid compliance status payload." }, { status: 400 });
  }

  try {
    const check = await updateComplianceCheckStatus({
      loanId,
      checkId,
      status: parsed.data.status,
      waiverReason: parsed.data.waiverReason,
      performedBy: access.viewer.userId,
    });

    return NextResponse.json({ ok: true, check });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not update the compliance check.",
      },
      { status: 500 },
    );
  }
}
