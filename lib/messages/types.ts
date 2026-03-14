import type {
  LoanApplicationRow,
  MessageRow,
  MessageThreadRow,
} from "@/types/database.types";

export type LoanCommunicationSummary = Pick<
  LoanApplicationRow,
  | "id"
  | "borrower_id"
  | "loan_officer_id"
  | "borrower_name"
  | "property_address"
  | "loan_amount"
  | "stage"
  | "priority"
  | "expected_close_date"
  | "created_at"
  | "updated_at"
>;

export type MessageThreadRecord = Pick<
  MessageThreadRow,
  | "id"
  | "loan_id"
  | "subject"
  | "thread_type"
  | "created_by"
  | "archived_at"
  | "created_at"
  | "updated_at"
>;

export type MessageRecord = Pick<
  MessageRow,
  | "id"
  | "thread_id"
  | "loan_id"
  | "sender_id"
  | "sender_name"
  | "sender_role"
  | "body"
  | "is_template"
  | "template_type"
  | "read_by"
  | "deleted_at"
  | "created_at"
>;

export type MessageThreadSummary = MessageThreadRecord & {
  last_message_at: string | null;
  last_message_preview: string | null;
  last_sender_name: string | null;
  message_count: number;
  unread_count: number;
};

export type CommunicationInboxItem = MessageThreadSummary & {
  loan: Pick<
    LoanApplicationRow,
    "id" | "borrower_name" | "property_address" | "stage" | "priority" | "loan_amount"
  >;
};
