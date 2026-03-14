import { NextResponse } from "next/server";
import { DEFAULT_ROLE, isProfileRole } from "@/lib/auth/roles";
import { assertViewerCanAccessLoan } from "@/lib/services/loan-access";
import { getMessageThreadRecord, markThreadAsRead } from "@/lib/services/messages";
import { createServerClient } from "@/lib/supabase/server";
import type { ProfileRole } from "@/types/database.types";

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
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const role: ProfileRole = isProfileRole(profile?.role) ? profile.role : DEFAULT_ROLE;

  return {
    id: user.id,
    role,
  };
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ threadId: string }> },
) {
  try {
    const viewer = await getAuthenticatedViewer();
    if (!viewer) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { threadId } = await context.params;
    const thread = await getMessageThreadRecord(threadId);

    if (!thread) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    const accessibleLoan = await assertViewerCanAccessLoan(thread.loan_id, {
      userId: viewer.id,
      role: viewer.role,
    });

    if (!accessibleLoan) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    const updatedCount = await markThreadAsRead(threadId, viewer.id);

    return NextResponse.json(
      {
        ok: true,
        updatedCount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("POST /api/communications/threads/[threadId]/read failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not update read receipts.",
      },
      { status: 500 },
    );
  }
}
