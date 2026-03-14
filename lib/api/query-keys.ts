export const queryKeys = {
  pipeline: ["pipeline"] as const,
  pipelineLoan: (loanId: string) => ["pipeline", loanId] as const,

  myLoans: ["my-loans"] as const,
  myLoan: (loanId: string) => ["my-loans", loanId] as const,

  documents: (loanId: string) => ["documents", loanId] as const,

  messages: (loanId: string) => ["messages", loanId] as const,
  communications: ["communications"] as const,

  compliance: (loanId: string) => ["compliance", loanId] as const,
  complianceChecks: (loanId: string) => ["compliance", loanId, "checks"] as const,

  disclosures: (loanId: string) => ["disclosures", loanId] as const,
  disclosure: (loanId: string, disclosureId: string) =>
    ["disclosures", loanId, disclosureId] as const,
};
