import { notFound } from "next/navigation";
import { MessageThread } from "@/components/messaging/message-thread";
import { buildTemplateFromQuery } from "@/lib/messages/templates";
import type { MessageRecord, MessageThreadSummary } from "@/lib/messages/types";
import { assertViewerCanAccessLoan } from "@/lib/services/loan-access";
import {
  getLoanCommunicationSummary,
  listLoanMessages,
  listLoanMessageThreads,
} from "@/lib/services/messages";
import { createServerClient } from "@/lib/supabase/server";
import type { DocCategory, ProfileRole } from "@/types/database.types";

export const dynamic = "force-dynamic";

export default async function LoanMessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ loanId: string }>;
  searchParams: Promise<{ category?: string; template?: string }>;
}) {
  const [{ loanId }, resolvedSearchParams] = await Promise.all([params, searchParams]);

  const loan = await getLoanCommunicationSummary(loanId);
  if (!loan) {
    notFound();
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const viewerRole = (profile?.role as ProfileRole | null) ?? null;
  const accessibleLoan = await assertViewerCanAccessLoan(loanId, {
    userId: user.id,
    role: viewerRole,
  });

  if (!accessibleLoan) {
    notFound();
  }

  let initialThreads: MessageThreadSummary[] = [];
  let initialMessages: MessageRecord[] = [];
  let bootstrapError: string | undefined;

  try {
    initialThreads = await listLoanMessageThreads(loanId);
    initialMessages = await listLoanMessages(loanId);
  } catch (error) {
    bootstrapError =
      error instanceof Error
        ? error.message
        : "The communication hub loaded, but existing messages could not be fetched.";
  }

  const requestedCategory = (
    [
      "pay_stub",
      "w2",
      "bank_statement",
      "tax_return",
      "id_document",
      "employment_letter",
      "other",
    ] as const
  ).includes(resolvedSearchParams.category as DocCategory)
    ? (resolvedSearchParams.category as DocCategory)
    : undefined;

  return (
    <MessageThread
      bootstrapError={bootstrapError}
      initialMessages={initialMessages}
      initialTemplate={buildTemplateFromQuery(
        resolvedSearchParams.template,
        requestedCategory,
      )}
      initialThreads={initialThreads}
      loan={loan}
      requestedCategory={requestedCategory}
      viewer={{
        id: user.id,
        name: profile?.full_name?.trim() || user.email || "Unknown user",
        role: viewerRole,
      }}
    />
  );
}
