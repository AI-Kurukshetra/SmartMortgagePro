"use client";

import type { MessageRecord, MessageThreadRecord } from "@/lib/messages/types";
import type { MessageThreadType } from "@/types/database.types";

type SendMessagePayload = {
  body: string;
  isTemplate?: boolean;
  subject?: string;
  templateType?: MessageThreadType | null;
  threadId?: string;
};

type ApiErrorResponse = {
  error?: string;
  ok?: false;
};

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as ApiErrorResponse;
    return payload.error ?? `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}

export async function sendLoanMessageViaApi(
  loanId: string,
  payload: SendMessagePayload,
): Promise<{ message: MessageRecord; thread: MessageThreadRecord }> {
  const response = await fetch(`/api/loans/${loanId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const data = (await response.json()) as {
    message: MessageRecord;
    ok: true;
    thread: MessageThreadRecord;
  };

  return {
    message: data.message,
    thread: data.thread,
  };
}

export async function markThreadReadViaApi(threadId: string) {
  const response = await fetch(`/api/communications/threads/${threadId}/read`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
}
