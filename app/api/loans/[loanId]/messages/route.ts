import { NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_ROLE, isProfileRole } from "@/lib/auth/roles";
import {
  getLoanCommunicationSummary,
  listLoanMessages,
  listLoanMessageThreads,
  sendMessage,
} from "@/lib/services/messages";
import { assertViewerCanAccessLoan } from "@/lib/services/loan-access";
import { createServerClient } from "@/lib/supabase/server";
import type { MessageThreadType, ProfileRole } from "@/types/database.types";

const sendMessageSchema = z.object({
  threadId: z.string().uuid().optional(),
  subject: z.string().trim().max(160).optional(),
  body: z.string().trim().min(1).max(4000),
  isTemplate: z.boolean().optional(),
  templateType: z
    .enum([
      "general",
      "document_request",
      "status_update",
      "approval_notice",
      "custom",
    ] satisfies [MessageThreadType, ...MessageThreadType[]])
    .nullable()
    .optional(),
});

async function getAuthenticatedViewer() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const role: ProfileRole = isProfileRole(profile?.role) ? profile.role : DEFAULT_ROLE;

  return {
    id: user.id,
    name: profile?.full_name?.trim() || user.email || "Unknown user",
    role,
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ loanId: string }> },
) {
  try {
    const viewer = await getAuthenticatedViewer();
    if (!viewer) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { loanId } = await context.params;
    const accessibleLoan = await assertViewerCanAccessLoan(loanId, {
      userId: viewer.id,
      role: viewer.role,
    });

    if (!accessibleLoan) {
      return NextResponse.json({ error: "Loan not found." }, { status: 404 });
    }

    const [loan, threads, messages] = await Promise.all([
      getLoanCommunicationSummary(loanId),
      listLoanMessageThreads(loanId),
      listLoanMessages(loanId),
    ]);

    return NextResponse.json(
      {
        ok: true,
        loan,
        messages,
        threads,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/loans/[loanId]/messages failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load loan communications.",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ loanId: string }> },
) {
  try {
    const viewer = await getAuthenticatedViewer();
    if (!viewer) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { loanId } = await context.params;
    const accessibleLoan = await assertViewerCanAccessLoan(loanId, {
      userId: viewer.id,
      role: viewer.role,
    });

    if (!accessibleLoan) {
      return NextResponse.json({ error: "Loan not found." }, { status: 404 });
    }

    const payload = sendMessageSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json(
        { error: "Please provide a valid message and subject when starting a thread." },
        { status: 400 },
      );
    }

    const result = await sendMessage({
      ...payload.data,
      loanId,
      senderId: viewer.id,
      senderName: viewer.name,
      senderRole: viewer.role,
    });

    return NextResponse.json(
      {
        ok: true,
        message: result.message,
        thread: result.thread,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/loans/[loanId]/messages failed:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not send the message.",
      },
      { status: 500 },
    );
  }
}
