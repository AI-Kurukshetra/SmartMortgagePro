"use client";

import { create } from "zustand";
import { DEFAULT_LOAN_DRAFT, type LoanDraft } from "@/src/types/smart-mortgage";

type LoanDraftState = {
  draft: LoanDraft;
  hasHydratedDraft: boolean;
  setDraft: (draft: LoanDraft) => void;
  updateDraft: (updater: (current: LoanDraft) => LoanDraft) => void;
  hydrateDraft: (draft: LoanDraft | null) => void;
  resetDraft: () => void;
};

export const useLoanDraftStore = create<LoanDraftState>((set) => ({
  draft: DEFAULT_LOAN_DRAFT,
  hasHydratedDraft: false,
  setDraft: (draft) => set({ draft }),
  updateDraft: (updater) => set((state) => ({ draft: updater(state.draft) })),
  hydrateDraft: (draft) =>
    set({
      draft: draft ?? DEFAULT_LOAN_DRAFT,
      hasHydratedDraft: true,
    }),
  resetDraft: () => set({ draft: DEFAULT_LOAN_DRAFT, hasHydratedDraft: true }),
}));
