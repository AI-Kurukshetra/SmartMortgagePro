"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { markThreadReadViaApi, sendLoanMessageViaApi } from "@/lib/messages/api";
import type {
  MessageRecord,
  MessageThreadRecord,
  MessageThreadSummary,
} from "@/lib/messages/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { MessageThreadType, ProfileRole } from "@/types/database.types";

type Viewer = {
  id: string;
  role: ProfileRole | null;
};

type TemplateDraft = {
  body: string;
  isTemplate: boolean;
  subject: string;
  templateType: MessageThreadType | null;
};

type UseMessagesParams = {
  initialMessages: MessageRecord[];
  initialThreads: MessageThreadSummary[];
  initialTemplate?: TemplateDraft & {
    forceNewThread?: boolean;
  };
  loanId: string;
  viewer: Viewer;
};

function sortThreads(left: MessageThreadSummary, right: MessageThreadSummary) {
  const leftDate = new Date(left.last_message_at ?? left.updated_at).getTime();
  const rightDate = new Date(right.last_message_at ?? right.updated_at).getTime();
  return rightDate - leftDate;
}

function upsertThread(
  current: MessageThreadRecord[],
  thread: MessageThreadRecord,
): MessageThreadRecord[] {
  const next = current.filter((item) => item.id !== thread.id);
  next.push(thread);
  return next;
}

function upsertMessage(current: MessageRecord[], message: MessageRecord): MessageRecord[] {
  const next = current.filter((item) => item.id !== message.id);
  next.push(message);
  return next.toSorted(
    (left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime(),
  );
}

function buildThreadSummaries(
  threads: MessageThreadRecord[],
  messages: MessageRecord[],
  viewerId: string,
): MessageThreadSummary[] {
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
    .map((thread) => {
      const threadMessages = messagesByThread.get(thread.id) ?? [];
      const lastMessage = threadMessages.at(-1) ?? null;

      return {
        ...thread,
        last_message_at: lastMessage?.created_at ?? null,
        last_message_preview: lastMessage?.body.replace(/\s+/g, " ").trim().slice(0, 96) ?? null,
        last_sender_name: lastMessage?.sender_name ?? null,
        message_count: threadMessages.length,
        unread_count: threadMessages.filter(
          (message) =>
            message.sender_id !== viewerId && !message.read_by.includes(viewerId),
        ).length,
      };
    })
    .toSorted(sortThreads);
}

function getInitialThreadRecords(initialThreads: MessageThreadSummary[]): MessageThreadRecord[] {
  return initialThreads.map(
    ({
      id,
      loan_id,
      subject,
      thread_type,
      created_by,
      archived_at,
      created_at,
      updated_at,
    }) => ({
      id,
      loan_id,
      subject,
      thread_type,
      created_by,
      archived_at,
      created_at,
      updated_at,
    }),
  );
}

export function useMessages({
  initialMessages,
  initialThreads,
  initialTemplate,
  loanId,
  viewer,
}: UseMessagesParams) {
  const [threadRecords, setThreadRecords] = useState(() => getInitialThreadRecords(initialThreads));
  const [messages, setMessages] = useState(initialMessages);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    initialTemplate?.forceNewThread ? null : initialThreads[0]?.id ?? null,
  );
  const [isComposingNewThread, setIsComposingNewThread] = useState(
    initialTemplate?.forceNewThread || initialThreads.length === 0,
  );
  const [draftSubject, setDraftSubject] = useState(initialTemplate?.subject ?? "");
  const [draftBody, setDraftBody] = useState(initialTemplate?.body ?? "");
  const [draftTemplateType, setDraftTemplateType] = useState<MessageThreadType | null>(
    initialTemplate?.templateType ?? null,
  );
  const [isTemplateMessage, setIsTemplateMessage] = useState(initialTemplate?.isTemplate ?? false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSending, startSendTransition] = useTransition();
  const supabase = useState(() => createSupabaseBrowserClient())[0];
  const markingReadRef = useRef<string | null>(null);

  const threads = buildThreadSummaries(threadRecords, messages, viewer.id);
  const activeThreadId = isComposingNewThread ? null : selectedThreadId;
  const selectedMessages = activeThreadId
    ? messages.filter((message) => message.thread_id === activeThreadId)
    : [];
  const selectedThread = activeThreadId
    ? threads.find((thread) => thread.id === activeThreadId) ?? null
    : null;

  useEffect(() => {
    const channel = supabase
      .channel(`loan-messages:${loanId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_threads",
          filter: `loan_id=eq.${loanId}`,
        },
        (payload) => {
          const nextThread = (payload.new ?? payload.old) as MessageThreadRecord | undefined;
          if (!nextThread || nextThread.archived_at) {
            return;
          }

          setThreadRecords((current) => upsertThread(current, nextThread));
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `loan_id=eq.${loanId}`,
        },
        (payload) => {
          const nextMessage = (payload.new ?? payload.old) as MessageRecord | undefined;
          if (!nextMessage || nextMessage.deleted_at) {
            return;
          }

          setMessages((current) => upsertMessage(current, nextMessage));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loanId, supabase]);

  useEffect(() => {
    if (!activeThreadId) {
      return;
    }

    const hasUnread = messages.some(
      (message) =>
        message.thread_id === activeThreadId &&
        message.sender_id !== viewer.id && !message.read_by.includes(viewer.id),
    );

    if (!hasUnread || markingReadRef.current === activeThreadId) {
      return;
    }

    markingReadRef.current = activeThreadId;

    void (async () => {
      try {
        await markThreadReadViaApi(activeThreadId);
        setMessages((current) =>
          current.map((message) =>
            message.thread_id === activeThreadId &&
            message.sender_id !== viewer.id &&
            !message.read_by.includes(viewer.id)
              ? { ...message, read_by: [...message.read_by, viewer.id] }
              : message,
          ),
        );
      } catch {
        // Keep the optimistic UI local; the next refresh or realtime payload will reconcile.
      }

      markingReadRef.current = null;
    })();
  }, [activeThreadId, messages, viewer.id]);

  const selectThread = (threadId: string) => {
    setErrorMessage(null);
    setIsComposingNewThread(false);
    setSelectedThreadId(threadId);
  };

  const startNewThread = (template?: TemplateDraft) => {
    setErrorMessage(null);
    setIsComposingNewThread(true);
    setSelectedThreadId(null);
    setDraftSubject(template?.subject ?? "");
    setDraftBody(template?.body ?? "");
    setDraftTemplateType(template?.templateType ?? null);
    setIsTemplateMessage(template?.isTemplate ?? false);
  };

  const applyTemplate = (template: TemplateDraft) => {
    startNewThread(template);
  };

  const cancelNewThread = () => {
    setErrorMessage(null);
    setIsComposingNewThread(threadRecords.length === 0);

    if (threadRecords.length > 0) {
      const sorted = buildThreadSummaries(threadRecords, messages, viewer.id);
      setSelectedThreadId(sorted[0]?.id ?? null);
    }

    setDraftTemplateType(null);
    setIsTemplateMessage(false);
    setDraftSubject("");
    setDraftBody("");
  };

  const sendCurrentMessage = () => {
    setErrorMessage(null);

    startSendTransition(() => {
      void (async () => {
        try {
          const result = await sendLoanMessageViaApi(loanId, {
            threadId: isComposingNewThread ? undefined : selectedThreadId ?? undefined,
            subject: isComposingNewThread ? draftSubject : undefined,
            body: draftBody,
            isTemplate: isTemplateMessage,
            templateType: draftTemplateType,
          });

          setThreadRecords((current) => upsertThread(current, result.thread));
          setMessages((current) => upsertMessage(current, result.message));
          setIsComposingNewThread(false);
          setSelectedThreadId(result.thread.id);
          setDraftSubject("");
          setDraftBody("");
          setDraftTemplateType(null);
          setIsTemplateMessage(false);
        } catch (error) {
          setErrorMessage(
            error instanceof Error ? error.message : "Could not send the message.",
          );
          return;
        }
      })();
    });
  };

  return {
    applyTemplate,
    cancelNewThread,
    clearErrorMessage: () => setErrorMessage(null),
    currentThread: selectedThread,
    draftBody,
    draftSubject,
    errorMessage,
    isComposingNewThread,
    isSending,
    messages: selectedMessages,
    selectedThreadId: activeThreadId,
    selectThread,
    sendCurrentMessage,
    setDraftBody,
    setDraftSubject,
    startNewThread,
    threads,
  };
}
