import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  MessageThreadType,
  ProfileRole,
  ProfileRow,
} from "@/types/database.types";
import type {
  CommunicationInboxItem,
  LoanCommunicationSummary,
  MessageRecord,
  MessageThreadRecord,
  MessageThreadSummary,
} from "@/lib/messages/types";

const loanSummaryColumns = [
  "id",
  "borrower_id",
  "loan_officer_id",
  "borrower_name",
  "property_address",
  "loan_amount",
  "stage",
  "priority",
  "expected_close_date",
  "created_at",
  "updated_at",
].join(", ");

const threadColumns = [
  "id",
  "loan_id",
  "subject",
  "thread_type",
  "created_by",
  "archived_at",
  "created_at",
  "updated_at",
].join(", ");

const messageColumns = [
  "id",
  "thread_id",
  "loan_id",
  "sender_id",
  "sender_name",
  "sender_role",
  "body",
  "is_template",
  "template_type",
  "read_by",
  "deleted_at",
  "created_at",
].join(", ");

const staffWideAccessRoles = new Set<ProfileRole>(["processor", "underwriter", "admin"]);

type SendMessageParams = {
  loanId: string;
  senderId: string;
  senderName: string;
  senderRole: ProfileRole;
  body: string;
  threadId?: string;
  subject?: string;
  isTemplate?: boolean;
  templateType?: MessageThreadType | null;
};

function assertNoError(error: { message: string } | null) {
  if (!error) return;
  throw new Error(error.message);
}

function isMissingMessagesTable(error: { message: string } | null) {
  if (!error) return false;
  return (
    error.message.includes("Could not find the table") ||
    error.message.includes('relation "messages" does not exist') ||
    error.message.includes('relation "message_threads" does not exist')
  );
}

function isMissingLoanColumns(error: { message: string } | null) {
  if (!error) return false;
  return (
    error.message.includes('column "borrower_id" does not exist') ||
    error.message.includes('column "loan_officer_id" does not exist')
  );
}

function getMessagePreview(body: string) {
  const normalized = body.replace(/\s+/g, " ").trim();
  if (normalized.length <= 96) {
    return normalized;
  }

  return `${normalized.slice(0, 93)}...`;
}

function buildThreadSummaries(
  threads: MessageThreadRecord[],
  messages: MessageRecord[],
  viewerId?: string,
) {
  const messagesByThread = new Map<string, MessageRecord[]>();

  for (const message of messages) {
    const current = messagesByThread.get(message.thread_id);
    if (current) {
      current.push(message);
    } else {
      messagesByThread.set(message.thread_id, [message]);
    }
  }

  return threads
    .map<MessageThreadSummary>((thread) => {
      const threadMessages = (messagesByThread.get(thread.id) ?? []).toSorted(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      const lastMessage = threadMessages.at(-1) ?? null;
      const unreadCount = viewerId
        ? threadMessages.filter(
            (message) =>
              message.sender_id !== viewerId && !message.read_by.includes(viewerId),
          ).length
        : 0;

      return {
        ...thread,
        last_message_at: lastMessage?.created_at ?? null,
        last_message_preview: lastMessage ? getMessagePreview(lastMessage.body) : null,
        last_sender_name: lastMessage?.sender_name ?? null,
        message_count: threadMessages.length,
        unread_count: unreadCount,
      };
    })
    .toSorted((a, b) => {
      const left = new Date(a.last_message_at ?? a.updated_at).getTime();
      const right = new Date(b.last_message_at ?? b.updated_at).getTime();
      return right - left;
    });
}

async function getViewerProfile(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  assertNoError(error);
  return (data as Pick<ProfileRow, "id" | "role"> | null) ?? null;
}

async function listAccessibleLoanIds(userId: string) {
  const supabase = createSupabaseAdminClient();
  const profile = await getViewerProfile(userId);

  if (!profile) {
    return [];
  }

  if (staffWideAccessRoles.has(profile.role)) {
    const { data, error } = await supabase
      .from("loan_applications")
      .select("id")
      .is("deleted_at", null);

    assertNoError(error);
    return (data ?? []).map((row) => row.id as string);
  }

  const column = profile.role === "loan_officer" ? "loan_officer_id" : "borrower_id";
  const { data, error } = await supabase
    .from("loan_applications")
    .select("id")
    .eq(column, userId)
    .is("deleted_at", null);

  if (isMissingLoanColumns(error)) {
    return [];
  }

  assertNoError(error);
  return (data ?? []).map((row) => row.id as string);
}

export async function getLoanCommunicationSummary(
  loanId: string,
): Promise<LoanCommunicationSummary | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("loan_applications")
    .select(loanSummaryColumns)
    .eq("id", loanId)
    .is("deleted_at", null)
    .maybeSingle();

  if (isMissingLoanColumns(error)) {
    const fallback = await supabase
      .from("loan_applications")
      .select(
        "id, borrower_name, property_address, loan_amount, stage, priority, expected_close_date, created_at, updated_at",
      )
      .eq("id", loanId)
      .is("deleted_at", null)
      .maybeSingle();

    assertNoError(fallback.error);
    if (!fallback.data) {
      return null;
    }

    return {
      ...(fallback.data as Omit<LoanCommunicationSummary, "borrower_id" | "loan_officer_id">),
      borrower_id: null,
      loan_officer_id: null,
    };
  }

  assertNoError(error);
  return (data as LoanCommunicationSummary | null) ?? null;
}

export async function listLoanMessageThreads(loanId: string): Promise<MessageThreadSummary[]> {
  const [threads, messages] = await Promise.all([
    listLoanThreadsRaw(loanId),
    listLoanMessages(loanId),
  ]);

  return buildThreadSummaries(threads, messages);
}

export async function getMessageThreadRecord(
  threadId: string,
): Promise<MessageThreadRecord | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("message_threads")
    .select(threadColumns)
    .eq("id", threadId)
    .maybeSingle();

  if (isMissingMessagesTable(error)) {
    return null;
  }

  assertNoError(error);
  return (data as MessageThreadRecord | null) ?? null;
}

async function listLoanThreadsRaw(loanId: string): Promise<MessageThreadRecord[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("message_threads")
    .select(threadColumns)
    .eq("loan_id", loanId)
    .is("archived_at", null)
    .order("updated_at", { ascending: false });

  if (isMissingMessagesTable(error)) {
    return [];
  }

  assertNoError(error);
  return ((data ?? []) as unknown) as MessageThreadRecord[];
}

export async function listLoanMessages(loanId: string): Promise<MessageRecord[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("messages")
    .select(messageColumns)
    .eq("loan_id", loanId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (isMissingMessagesTable(error)) {
    return [];
  }

  assertNoError(error);
  return ((data ?? []) as unknown) as MessageRecord[];
}

export async function sendMessage(params: SendMessageParams) {
  const supabase = createSupabaseAdminClient();
  let threadId = params.threadId;

  if (!threadId) {
    const subject = params.subject?.trim();
    if (!subject) {
      throw new Error("A subject is required to start a new thread.");
    }

    const { data: newThread, error: threadError } = await supabase
      .from("message_threads")
      .insert({
        loan_id: params.loanId,
        subject,
        thread_type: params.templateType ?? "custom",
        created_by: params.senderId,
      })
      .select(threadColumns)
      .single();

    assertNoError(threadError);
    if (!newThread) {
      throw new Error("Thread creation succeeded but no thread was returned.");
    }

    threadId = (newThread as unknown as { id: string }).id;
  }

  const resolvedThreadId = threadId as string;

  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      thread_id: resolvedThreadId,
      loan_id: params.loanId,
      sender_id: params.senderId,
      sender_name: params.senderName,
      sender_role: params.senderRole,
      body: params.body.trim(),
      is_template: params.isTemplate ?? false,
      template_type: params.templateType ?? null,
      read_by: [params.senderId],
    })
    .select(messageColumns)
    .single();

  assertNoError(messageError);
  if (!message) {
    throw new Error("Message creation succeeded but no message was returned.");
  }

  const { data: thread, error: threadLookupError } = await supabase
    .from("message_threads")
    .select(threadColumns)
    .eq("id", resolvedThreadId)
    .maybeSingle();

  assertNoError(threadLookupError);
  if (!thread) {
    throw new Error("Message was stored, but the thread could not be loaded.");
  }

  return {
    message: message as unknown as MessageRecord,
    thread: thread as unknown as MessageThreadRecord,
  };
}

export async function markThreadAsRead(threadId: string, userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, read_by")
    .eq("thread_id", threadId)
    .is("deleted_at", null);

  if (isMissingMessagesTable(error)) {
    return 0;
  }

  assertNoError(error);

  const unreadMessages = (data ?? []).filter(
    (message) =>
      message.sender_id !== userId && !((message.read_by as string[] | null) ?? []).includes(userId),
  );

  await Promise.all(
    unreadMessages.map((message) =>
      supabase
        .from("messages")
        .update({
          read_by: [...new Set([...(message.read_by as string[]), userId])],
        })
        .eq("id", message.id),
    ),
  );

  return unreadMessages.length;
}

export async function countUnreadMessagesForUser(userId: string) {
  const loanIds = await listAccessibleLoanIds(userId);
  if (!loanIds.length) {
    return 0;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, read_by")
    .in("loan_id", loanIds)
    .is("deleted_at", null)
    .neq("sender_id", userId);

  if (isMissingMessagesTable(error)) {
    return 0;
  }

  assertNoError(error);
  return (data ?? []).filter(
    (message) => !((message.read_by as string[] | null) ?? []).includes(userId),
  ).length;
}

export async function listCommunicationInbox(userId: string): Promise<CommunicationInboxItem[]> {
  const loanIds = await listAccessibleLoanIds(userId);
  if (!loanIds.length) {
    return [];
  }

  const supabase = createSupabaseAdminClient();
  const [{ data: loans, error: loansError }, threads, messages] = await Promise.all([
    supabase
      .from("loan_applications")
      .select("id, borrower_name, property_address, stage, priority, loan_amount")
      .in("id", loanIds)
      .is("deleted_at", null),
    listLoanThreadsByIds(loanIds),
    listLoanMessagesByIds(loanIds),
  ]);

  assertNoError(loansError);

  const loanMap = new Map(
    ((loans ?? []) as CommunicationInboxItem["loan"][]).map((loan) => [loan.id, loan]),
  );

  return buildThreadSummaries(threads, messages, userId)
    .map((thread) => {
      const loan = loanMap.get(thread.loan_id);
      if (!loan) {
        return null;
      }

      return {
        ...thread,
        loan,
      };
    })
    .filter((item) => item !== null);
}

async function listLoanThreadsByIds(loanIds: string[]) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("message_threads")
    .select(threadColumns)
    .in("loan_id", loanIds)
    .is("archived_at", null);

  if (isMissingMessagesTable(error)) {
    return [];
  }

  assertNoError(error);
  return ((data ?? []) as unknown) as MessageThreadRecord[];
}

async function listLoanMessagesByIds(loanIds: string[]) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("messages")
    .select(messageColumns)
    .in("loan_id", loanIds)
    .is("deleted_at", null);

  if (isMissingMessagesTable(error)) {
    return [];
  }

  assertNoError(error);
  return ((data ?? []) as unknown) as MessageRecord[];
}
