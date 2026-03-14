import { NextResponse } from "next/server";
import { z } from "zod";
import { isStaffRole } from "@/lib/auth/roles";
import { generateDisclosure } from "@/lib/services/disclosures";
import { assertViewerCanAccessLoan } from "@/lib/services/loan-access";
import {
  getLoanDisclosureSummary,
  listDisclosuresByLoanId,
} from "@/lib/services/disclosures";
import { getCurrentViewerSession } from "@/lib/services/viewer-session";
import type { DisclosureType, ProfileRole } from "@/types/database.types";

const createDisclosureSchema = z
  .object({
    type: z.enum([
      "loan_estimate",
      "closing_disclosure",
      "intent_to_proceed",
      "adverse_action",
      "appraisal_notice",
    ] satisfies [DisclosureType, ...DisclosureType[]]),
    supersedesId: z.string().optional(),
    changeReason: z.string().trim().optional(),
    changeNotes: z.string().trim().max(500).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.supersedesId && !value.changeReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Reason is required",
        path: ["changeReason"],
      });
    }
  });

export async function GET(
  _request: Request,
  context: { params: Promise<{ loanId: string }> },
) {
  const { loanId } = await context.params;
  const { user, role } = await getCurrentViewerSession();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const access = await assertViewerCanAccessLoan(loanId, {
    userId: user.id,
    role,
  });

  if (!access) {
    return NextResponse.json({ ok: false, error: "Loan not found." }, { status: 404 });
  }

  try {
    const [loan, disclosures] = await Promise.all([
      getLoanDisclosureSummary(loanId),
      listDisclosuresByLoanId(loanId),
    ]);

    if (!loan) {
      return NextResponse.json({ ok: false, error: "Loan not found." }, { status: 404 });
    }

    return NextResponse.json(
      {
        ok: true,
        loan,
        disclosures,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unable to load disclosures for this loan.",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ loanId: string }> },
) {
  const { loanId } = await context.params;
  const { user, role } = await getCurrentViewerSession();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const safeRole = role as ProfileRole | null;
  if (!safeRole || !isStaffRole(safeRole)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const access = await assertViewerCanAccessLoan(loanId, {
    userId: user.id,
    role: safeRole,
  });

  if (!access) {
    return NextResponse.json({ ok: false, error: "Loan not found." }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = createDisclosureSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid disclosure payload." },
      { status: 400 },
    );
  }

  try {
    const disclosure = await generateDisclosure({
      loanId,
      type: parsed.data.type,
      generatedBy: user.id,
      supersedesId: parsed.data.supersedesId,
      changeReason: parsed.data.changeReason,
      changeNotes: parsed.data.changeNotes,
    });

    return NextResponse.json(
      {
        ok: true,
        disclosure,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unable to generate the disclosure right now.",
      },
      { status: 500 },
    );
  }
}
