"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertViewerCanAccessLoan } from "@/lib/services/loan-access";
import { createServerClient } from "@/lib/supabase/server";
import { DEFAULT_ROLE, isProfileRole } from "@/lib/auth/roles";
import {
  getMessageThreadRecord,
  markThreadAsRead,
  sendMessage,
} from "@/lib/services/messages";
import type { MessageThreadType, ProfileRole } from "@/types/database.types";

const sendMessageSchema = z.object({
  loanId: z.string().uuid(),
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

const markReadSchema = z.object({
  threadId: z.string().uuid(),
});

type SendMessageResult =
  | {
      ok: true;
      message: Awaited<ReturnType<typeof sendMessage>>["message"];
      thread: Awaited<ReturnType<typeof sendMessage>>["thread"];
    }
  | {
      ok: false;
      error: string;
    };

type ActionResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
    };

async function getCurrentViewerProfile() {
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

export async function sendMessageAction(input: {
  loanId: string;
  threadId?: string;
  subject?: string;
  body: string;
  isTemplate?: boolean;
  templateType?: MessageThreadType | null;
}): Promise<SendMessageResult> {
  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please provide a valid message and subject when starting a thread." };
  }

  try {
    const viewer = await getCurrentViewerProfile();
    if (!viewer) {
      return { ok: false, error: "Your session expired. Sign in again to send a message." };
    }

    const loan = await assertViewerCanAccessLoan(parsed.data.loanId, {
      userId: viewer.id,
      role: viewer.role,
    });

    if (!loan) {
      return { ok: false, error: "You do not have access to this loan conversation." };
    }

    const result = await sendMessage({
      ...parsed.data,
      senderId: viewer.id,
      senderName: viewer.name,
      senderRole: viewer.role,
    });

    revalidatePath(`/loans/${parsed.data.loanId}/messages`);
    revalidatePath(`/loans/${parsed.data.loanId}/documents`);
    revalidatePath("/communications");

    return {
      ok: true,
      message: result.message,
      thread: result.thread,
    };
  } catch (error) {
    console.error("sendMessageAction failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not send the message.",
    };
  }
}

export async function markThreadReadAction(input: { threadId: string }): Promise<ActionResult> {
  const parsed = markReadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid thread read request." };
  }

  try {
    const viewer = await getCurrentViewerProfile();
    if (!viewer) {
      return { ok: false, error: "Your session expired. Sign in again to refresh messages." };
    }

    const thread = await getMessageThreadRecord(parsed.data.threadId);
    if (!thread) {
      return { ok: false, error: "Conversation not found." };
    }

    const loan = await assertViewerCanAccessLoan(thread.loan_id, {
      userId: viewer.id,
      role: viewer.role,
    });

    if (!loan) {
      return { ok: false, error: "You do not have access to this loan conversation." };
    }

    await markThreadAsRead(parsed.data.threadId, viewer.id);
    revalidatePath("/communications");
    return { ok: true };
  } catch (error) {
    console.error("markThreadReadAction failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not update read receipts.",
    };
  }
}
