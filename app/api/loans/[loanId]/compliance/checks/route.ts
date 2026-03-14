import { NextResponse } from "next/server";
import { z } from "zod";
import { createComplianceCheck } from "@/lib/services/compliance";
import { assertComplianceLoanAccess } from "@/lib/services/compliance-access";
import type { ComplianceCheckStatus, Regulation } from "@/types/database.types";

const createComplianceCheckSchema = z.object({
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
  remediation: z.string().trim().max(2000).nullable().optional(),
  deadline: z.string().datetime().nullable().optional(),
  status: z
    .enum(["pass", "warning", "violation", "pending", "waived"] satisfies [
      ComplianceCheckStatus,
      ...ComplianceCheckStatus[],
    ])
    .optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ loanId: string }> },
) {
  const { loanId } = await context.params;
  const access = await assertComplianceLoanAccess(loanId, { requireStaff: true });

  if (!access.allowed || !access.viewer) {
    return NextResponse.json(
      { ok: false, error: access.reason === "unauthorized" ? "Unauthorized" : "Forbidden" },
      { status: access.reason === "unauthorized" ? 401 : 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createComplianceCheckSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid compliance check payload." }, { status: 400 });
  }

  try {
    const check = await createComplianceCheck({
      loanId,
      ...parsed.data,
      createdBy: access.viewer.userId,
    });

    return NextResponse.json({ ok: true, check }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not create the compliance check.",
      },
      { status: 500 },
    );
  }
}
