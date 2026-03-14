export type LoanStage =
  | "application"
  | "processing"
  | "underwriting"
  | "approved"
  | "closing";

export type LoanPriority = "low" | "medium" | "high";
export type ProfileRole =
  | "borrower"
  | "loan_officer"
  | "processor"
  | "underwriter"
  | "admin";
export type DocCategory =
  | "pay_stub"
  | "w2"
  | "bank_statement"
  | "tax_return"
  | "id_document"
  | "employment_letter"
  | "other";
export type DocStatus = "pending" | "processing" | "verified" | "rejected" | "expired";
export type Regulation = "trid" | "respa" | "hmda" | "ecoa" | "fcra" | "glba" | "state" | "ada";
export type ComplianceCheckStatus =
  | "pass"
  | "warning"
  | "violation"
  | "pending"
  | "waived";
export type DisclosureType =
  | "loan_estimate"
  | "closing_disclosure"
  | "intent_to_proceed"
  | "adverse_action"
  | "appraisal_notice";
export type DisclosureStatus =
  | "draft"
  | "generated"
  | "sent"
  | "acknowledged"
  | "expired"
  | "superseded";
export type FeeTolerance = "zero" | "ten_percent" | "unlimited";
export type MessageThreadType =
  | "general"
  | "document_request"
  | "status_update"
  | "approval_notice"
  | "custom";
export type FeatureCategory = "core" | "automation" | "ai";
export type FeatureAudience = "borrower" | "staff" | "both";
export type FeatureTier = "must_have" | "important" | "innovative" | "nice_to_have";
export type FeatureComplexity = "low" | "medium" | "high";
export type FeatureStatus = "planned" | "seeded" | "in_progress" | "live";

export interface Database {
  public: {
    Tables: {
      roles: {
        Row: {
          id: number;
          key: ProfileRole;
          label: string;
          is_staff: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          key: ProfileRole;
          label: string;
          is_staff?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["roles"]["Insert"]>;
        Relationships: [];
      };
      loan_applications: {
        Row: {
          id: string;
          borrower_id: string | null;
          loan_officer_id: string | null;
          borrower_name: string;
          property_address: string;
          loan_amount: number;
          stage: LoanStage;
          priority: LoanPriority;
          expected_close_date: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          borrower_id?: string | null;
          loan_officer_id?: string | null;
          borrower_name: string;
          property_address: string;
          loan_amount: number;
          stage?: LoanStage;
          priority?: LoanPriority;
          expected_close_date?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["loan_applications"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: ProfileRole;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: ProfileRole;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          loan_id: string;
          uploaded_by: string;
          category: DocCategory;
          file_name: string;
          file_size: number;
          mime_type: string;
          storage_path: string;
          status: DocStatus;
          rejection_reason: string | null;
          expires_at: string | null;
          version: number;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          loan_id: string;
          uploaded_by: string;
          category?: DocCategory;
          file_name: string;
          file_size: number;
          mime_type: string;
          storage_path: string;
          status?: DocStatus;
          rejection_reason?: string | null;
          expires_at?: string | null;
          version?: number;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
        Relationships: [];
      };
      compliance_checks: {
        Row: {
          id: string;
          loan_id: string;
          regulation: Regulation;
          check_name: string;
          status: ComplianceCheckStatus;
          description: string;
          remediation: string | null;
          deadline: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          waived_by: string | null;
          waiver_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          loan_id: string;
          regulation: Regulation;
          check_name: string;
          status?: ComplianceCheckStatus;
          description: string;
          remediation?: string | null;
          deadline?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          waived_by?: string | null;
          waiver_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["compliance_checks"]["Insert"]>;
        Relationships: [];
      };
      compliance_events: {
        Row: {
          id: string;
          loan_id: string;
          event_type: string;
          event_date: string;
          performed_by: string | null;
          notes: string | null;
          metadata: Record<string, unknown> | null;
        };
        Insert: {
          id?: string;
          loan_id: string;
          event_type: string;
          event_date?: string;
          performed_by?: string | null;
          notes?: string | null;
          metadata?: Record<string, unknown> | null;
        };
        Update: Partial<Database["public"]["Tables"]["compliance_events"]["Insert"]>;
        Relationships: [];
      };
      compliance_audit_log: {
        Row: {
          id: string;
          loan_id: string;
          action: string;
          performed_by: string | null;
          details: Record<string, unknown> | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          loan_id: string;
          action: string;
          performed_by?: string | null;
          details?: Record<string, unknown> | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["compliance_audit_log"]["Insert"]>;
        Relationships: [];
      };
      disclosures: {
        Row: {
          id: string;
          loan_id: string;
          type: DisclosureType;
          status: DisclosureStatus;
          version: number;
          issued_date: string | null;
          due_date: string | null;
          sent_to_borrower_at: string | null;
          acknowledged_by_borrower_at: string | null;
          acknowledgement_method: string | null;
          fees_snapshot: Record<string, unknown> | null;
          loan_terms_snapshot: Record<string, unknown> | null;
          state: string | null;
          file_path: string | null;
          generated_by: string | null;
          supersedes_id: string | null;
          change_of_circumstance_reason: string | null;
          change_of_circumstance_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          loan_id: string;
          type: DisclosureType;
          status?: DisclosureStatus;
          version?: number;
          issued_date?: string | null;
          due_date?: string | null;
          sent_to_borrower_at?: string | null;
          acknowledged_by_borrower_at?: string | null;
          acknowledgement_method?: string | null;
          fees_snapshot?: Record<string, unknown> | null;
          loan_terms_snapshot?: Record<string, unknown> | null;
          state?: string | null;
          file_path?: string | null;
          generated_by?: string | null;
          supersedes_id?: string | null;
          change_of_circumstance_reason?: string | null;
          change_of_circumstance_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["disclosures"]["Insert"]>;
        Relationships: [];
      };
      disclosure_fees: {
        Row: {
          id: string;
          disclosure_id: string;
          fee_name: string;
          fee_category: string;
          tolerance_type: FeeTolerance;
          le_amount: number | null;
          cd_amount: number | null;
        };
        Insert: {
          id?: string;
          disclosure_id: string;
          fee_name: string;
          fee_category: string;
          tolerance_type: FeeTolerance;
          le_amount?: number | null;
          cd_amount?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["disclosure_fees"]["Insert"]>;
        Relationships: [];
      };
      message_threads: {
        Row: {
          id: string;
          loan_id: string;
          subject: string | null;
          thread_type: MessageThreadType;
          created_by: string;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          loan_id: string;
          subject?: string | null;
          thread_type?: MessageThreadType;
          created_by: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["message_threads"]["Insert"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          thread_id: string;
          loan_id: string;
          sender_id: string;
          sender_name: string;
          sender_role: ProfileRole;
          body: string;
          is_template: boolean;
          template_type: MessageThreadType | null;
          read_by: string[];
          deleted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          loan_id: string;
          sender_id: string;
          sender_name: string;
          sender_role: ProfileRole;
          body: string;
          is_template?: boolean;
          template_type?: MessageThreadType | null;
          read_by?: string[];
          deleted_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
      platform_features: {
        Row: {
          id: string;
          feature_code: string;
          feature_name: string;
          summary: string;
          category: FeatureCategory;
          audience: FeatureAudience;
          tier: FeatureTier;
          complexity: FeatureComplexity;
          status: FeatureStatus;
          owner_team: string | null;
          route_href: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          feature_code: string;
          feature_name: string;
          summary: string;
          category?: FeatureCategory;
          audience?: FeatureAudience;
          tier?: FeatureTier;
          complexity?: FeatureComplexity;
          status?: FeatureStatus;
          owner_team?: string | null;
          route_href?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["platform_features"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: ProfileRole;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type LoanApplicationRow = Database["public"]["Tables"]["loan_applications"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
export type ComplianceCheckRow = Database["public"]["Tables"]["compliance_checks"]["Row"];
export type ComplianceEventRow = Database["public"]["Tables"]["compliance_events"]["Row"];
export type ComplianceAuditLogRow = Database["public"]["Tables"]["compliance_audit_log"]["Row"];
export type DisclosureRow = Database["public"]["Tables"]["disclosures"]["Row"];
export type DisclosureFeeRow = Database["public"]["Tables"]["disclosure_fees"]["Row"];
export type MessageThreadRow = Database["public"]["Tables"]["message_threads"]["Row"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
export type PlatformFeatureRow = Database["public"]["Tables"]["platform_features"]["Row"];
export type LoanRecord = Pick<
  LoanApplicationRow,
  | "id"
  | "borrower_name"
  | "property_address"
  | "loan_amount"
  | "stage"
  | "priority"
  | "expected_close_date"
  | "created_at"
  | "updated_at"
>;
