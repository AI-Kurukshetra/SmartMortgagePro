"use client";

import Link from "next/link";
import {
  Alert,
  Box,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { MessageSquareText } from "lucide-react";
import { MessageBubble } from "@/components/messaging/message-bubble";
import { MessageInput } from "@/components/messaging/message-input";
import {
  MessageTemplates,
} from "@/components/messaging/message-templates";
import { useMessages } from "@/hooks/use-messages";
import type { MessageTemplateDraft } from "@/lib/messages/templates";
import type {
  LoanCommunicationSummary,
  MessageRecord,
  MessageThreadSummary,
} from "@/lib/messages/types";
import type { DocCategory, ProfileRole } from "@/types/database.types";

type Viewer = {
  id: string;
  name: string;
  role: ProfileRole | null;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatThreadType(value: string) {
  return value.replace(/_/g, " ");
}

export function MessageThread({
  bootstrapError,
  initialMessages,
  initialTemplate,
  initialThreads,
  loan,
  requestedCategory,
  viewer,
}: {
  bootstrapError?: string;
  initialMessages: MessageRecord[];
  initialTemplate?: MessageTemplateDraft & {
    forceNewThread?: boolean;
  };
  initialThreads: MessageThreadSummary[];
  loan: LoanCommunicationSummary;
  requestedCategory?: DocCategory;
  viewer: Viewer;
}) {
  const {
    applyTemplate,
    cancelNewThread,
    clearErrorMessage,
    currentThread,
    draftBody,
    draftSubject,
    errorMessage,
    isComposingNewThread,
    isSending,
    messages,
    selectedThreadId,
    selectThread,
    sendCurrentMessage,
    setDraftBody,
    setDraftSubject,
    startNewThread,
    threads,
  } = useMessages({
    initialMessages,
    initialThreads,
    initialTemplate,
    loanId: loan.id,
    viewer,
  });

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 5,
          border: "1px solid",
          borderColor: "divider",
          background:
            "linear-gradient(140deg, rgba(26,60,94,0.08) 0%, rgba(255,255,255,0.96) 55%, rgba(10,126,164,0.08) 100%)",
          p: { xs: 2.5, md: 3.5 },
        }}
      >
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            justifyContent="space-between"
            spacing={2}
            alignItems={{ xs: "flex-start", lg: "center" }}
          >
            <Box>
              <Typography
                variant="overline"
                sx={{ color: "secondary.dark", letterSpacing: "0.16em", fontWeight: 700 }}
              >
                Communication Hub
              </Typography>
              <Typography variant="h4" sx={{ mt: 0.5, color: "text.primary" }}>
                {loan.borrower_name}
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary", mt: 0.5 }}>
                {loan.property_address}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
              <Link
                href={`/loans/${loan.id}/documents`}
                className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Documents
              </Link>
              <Link
                href="/communications"
                className="inline-flex items-center justify-center rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
              >
                Inbox
              </Link>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label={`${threads.length} threads`} />
            <Chip label={`${messages.length} messages in view`} />
            <Chip
              label={`Loan Amount: ${formatMoney(loan.loan_amount)}`}
              sx={{ fontFamily: "var(--font-geist-mono), monospace" }}
            />
          </Stack>
        </Stack>
      </Paper>

      {bootstrapError ? <Alert severity="warning">{bootstrapError}</Alert> : null}
      {errorMessage ? (
        <Alert severity="error" onClose={clearErrorMessage}>
          {errorMessage}
        </Alert>
      ) : null}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, xl: 4 }}>
          <Stack spacing={2.5}>
            <MessageTemplates category={requestedCategory} onApplyTemplate={applyTemplate} />

            <Paper
              elevation={0}
              sx={{
                borderRadius: 4,
                border: "1px solid",
                borderColor: "divider",
                p: 2.5,
              }}
            >
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6" sx={{ color: "text.primary" }}>
                      Threads
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                      Conversations linked to this loan file.
                    </Typography>
                  </Box>

                  <button
                    type="button"
                    onClick={() => startNewThread()}
                    className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                  >
                    New thread
                  </button>
                </Stack>

                {threads.length ? (
                  <Stack spacing={1.25}>
                    {threads.map((thread) => (
                      <button
                        key={thread.id}
                        type="button"
                        onClick={() => selectThread(thread.id)}
                        className={`rounded-2xl border px-4 py-3 text-left transition ${
                          selectedThreadId === thread.id
                            ? "border-sky-300 bg-sky-50"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {thread.subject || "Untitled conversation"}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                              {formatThreadType(thread.thread_type)}
                            </p>
                          </div>
                          {thread.unread_count ? (
                            <span className="rounded-full bg-sky-700 px-2 py-0.5 text-[11px] font-semibold text-white">
                              {thread.unread_count}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                          {thread.last_message_preview || "No messages yet."}
                        </p>
                      </button>
                    ))}
                  </Stack>
                ) : (
                  <Paper
                    elevation={0}
                    sx={{
                    borderRadius: 4,
                    border: "1px dashed",
                    borderColor: "divider",
                    bgcolor: "#f8fafc",
                    px: 2,
                    py: 4,
                    textAlign: "center",
                    }}
                  >
                    <MessageSquareText size={40} className="mx-auto text-slate-300" />
                    <Typography variant="h6" sx={{ mt: 1.5 }}>
                      No conversations yet
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.75 }}>
                      Start a thread or use a template to request the next borrower update.
                    </Typography>
                  </Paper>
                )}
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, xl: 8 }}>
          <Stack spacing={2.5}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 4,
                border: "1px solid",
                borderColor: "divider",
                p: 2.5,
              }}
            >
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" sx={{ color: "text.primary" }}>
                    {isComposingNewThread
                      ? initialTemplate?.forceNewThread
                        ? "Template draft"
                        : "New thread"
                      : currentThread?.subject || "Conversation"}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                    {isComposingNewThread
                      ? "Create a new auditable conversation linked to this loan."
                      : currentThread
                        ? `${currentThread.message_count} messages in this thread`
                        : "Select a conversation to review its history."}
                  </Typography>
                </Box>

                {!isComposingNewThread && currentThread ? (
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip
                      size="small"
                      label={formatThreadType(currentThread.thread_type)}
                      color="primary"
                      sx={{ textTransform: "capitalize" }}
                    />
                    <Chip size="small" label={`${currentThread.message_count} messages`} />
                    {currentThread.unread_count ? (
                      <Chip size="small" color="secondary" label={`${currentThread.unread_count} unread`} />
                    ) : null}
                  </Stack>
                ) : null}

                <Box
                  aria-busy={isSending}
                  sx={{
                    minHeight: 320,
                    maxHeight: 520,
                    overflowY: "auto",
                    borderRadius: 3,
                    bgcolor: "#f8fafc",
                    px: { xs: 1, md: 2 },
                    py: 2,
                  }}
                >
                  {messages.length ? (
                    <Stack spacing={2}>
                      {messages.map((message) => (
                        <MessageBubble
                          key={message.id}
                          isOwnMessage={message.sender_id === viewer.id}
                          message={message}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Stack
                      spacing={1}
                      alignItems="center"
                      justifyContent="center"
                      sx={{ minHeight: 280, textAlign: "center", color: "text.secondary" }}
                    >
                      <MessageSquareText size={42} className="text-slate-300" />
                      <Typography variant="h6">
                        {isComposingNewThread ? "Draft the opening message" : "No messages yet"}
                      </Typography>
                      <Typography variant="body2" sx={{ maxWidth: 420 }}>
                        {isComposingNewThread
                          ? "Use one of the templates on the left or write a custom opening note."
                          : "Select a different thread or start a new one to communicate with the borrower and loan team."}
                      </Typography>
                    </Stack>
                  )}
                </Box>

                <Box aria-live="polite">
                  <MessageInput
                    body={draftBody}
                    isNewThread={isComposingNewThread}
                    isSubmitting={isSending}
                    onBodyChange={setDraftBody}
                    onCancelNewThread={cancelNewThread}
                    onSend={sendCurrentMessage}
                    onSubjectChange={setDraftSubject}
                    subject={draftSubject}
                  />
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
