import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isStaffRole } from "@/lib/auth/roles";
import { getAuthenticatedViewer } from "@/lib/auth/session";
import { createPipelineLoan, listPipelineLoansForViewer } from "@/lib/services/pipeline";
import type { LoanPriority } from "@/types/database.types";

const createPipelineLoanSchema = z.object({
  borrowerName: z.string().min(2).max(120),
  propertyAddress: z.string().min(5).max(240),
  loanAmount: z.coerce.number().positive().max(1_000_000_000),
  priority: z.enum(["low", "medium", "high"] satisfies [LoanPriority, ...LoanPriority[]]).default("medium"),
  expectedCloseDate: z.string().date().optional().nullable(),
});

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ error: "Staff access required." }, { status: 403 });
}

export async function GET() {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) {
    return unauthorized();
  }

  if (!viewer.role || !isStaffRole(viewer.role)) {
    return forbidden();
  }

  try {
    const loans = await listPipelineLoansForViewer(viewer);
    return NextResponse.json({ ok: true, loans, viewer }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load the pipeline dashboard.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) {
    return unauthorized();
  }

  if (!viewer.role || !isStaffRole(viewer.role)) {
    return forbidden();
  }

  const body = await request.json().catch(() => null);
  const parsed = createPipelineLoanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please provide valid loan intake details." },
      { status: 400 },
    );
  }

  try {
    const loan = await createPipelineLoan(viewer, parsed.data);
    revalidatePath("/dashboard");
    revalidatePath("/pipeline");

    return NextResponse.json({ loan }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not create the pipeline loan.",
      },
      { status: 500 },
    );
  }
}
