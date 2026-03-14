import { NextResponse } from "next/server";
import { z } from "zod";
import { createComplianceEvent } from "@/lib/services/compliance";
import { assertComplianceLoanAccess } from "@/lib/services/compliance-access";

const createComplianceEventSchema = z.object({
  eventType: z.string().trim().min(3).max(120),
  eventDate: z.string().datetime().optional(),
  notes: z.string().trim().max(2000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
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
  const parsed = createComplianceEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid compliance event payload." }, { status: 400 });
  }

  try {
    const event = await createComplianceEvent({
      loanId,
      ...parsed.data,
      performedBy: access.viewer.userId,
    });

    return NextResponse.json({ ok: true, event }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not create the compliance event.",
      },
      { status: 500 },
    );
  }
}
