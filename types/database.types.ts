export type LoanStage =
  | "application"
  | "processing"
  | "underwriting"
  | "approved"
  | "closing";

export type LoanPriority = "low" | "medium" | "high";

export interface Database {
  public: {
    Tables: {
      loan_applications: {
        Row: {
          id: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type LoanApplicationRow = Database["public"]["Tables"]["loan_applications"]["Row"];
