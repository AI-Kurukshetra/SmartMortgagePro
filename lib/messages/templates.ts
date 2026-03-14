import type { DocCategory, MessageThreadType } from "@/types/database.types";

export type MessageTemplateDraft = {
  body: string;
  isTemplate: boolean;
  subject: string;
  templateType: MessageThreadType;
};

const documentLabels: Record<DocCategory, string> = {
  pay_stub: "pay stub",
  w2: "W-2",
  bank_statement: "bank statement",
  tax_return: "tax return",
  id_document: "government ID",
  employment_letter: "employment letter",
  other: "supporting document",
};

function getDocumentRequestDraft(category?: DocCategory): MessageTemplateDraft {
  const documentLabel = category ? documentLabels[category] : "requested document";

  return {
    subject: `Document Request: ${documentLabel}`,
    body: `Please upload your ${documentLabel} to keep the loan moving. If you have any questions about the file type or date range needed, reply here and we will confirm the exact requirement.`,
    isTemplate: true,
    templateType: "document_request",
  };
}

export const messageTemplateDefinitions: Array<{
  createDraft: (category?: DocCategory) => MessageTemplateDraft;
  description: string;
  label: string;
}> = [
  {
    label: "Document request",
    description: "Ask for missing borrower documents without leaving the thread.",
    createDraft: getDocumentRequestDraft,
  },
  {
    label: "Status update",
    description: "Share the current milestone and next step.",
    createDraft: () => ({
      subject: "Loan Status Update",
      body: "Your loan has moved to the next stage. Here is what changed, what we need from you next, and the expected timing for the following update.",
      isTemplate: true,
      templateType: "status_update",
    }),
  },
  {
    label: "Approval notice",
    description: "Confirm approval or conditional approval.",
    createDraft: () => ({
      subject: "Approval Update",
      body: "Your file has been reviewed and approved, subject to final verification items. Review the remaining conditions below and reply here if anything is unclear.",
      isTemplate: true,
      templateType: "approval_notice",
    }),
  },
];

export function buildTemplateFromQuery(
  template: string | undefined,
  category?: DocCategory,
): (MessageTemplateDraft & { forceNewThread: boolean }) | undefined {
  if (!template) {
    return undefined;
  }

  if (template === "document_request") {
    return {
      ...getDocumentRequestDraft(category),
      forceNewThread: true,
    };
  }

  const definition = messageTemplateDefinitions.find(
    (item) => item.createDraft().templateType === template,
  );

  if (!definition) {
    return undefined;
  }

  return {
    ...definition.createDraft(category),
    forceNewThread: true,
  };
}
