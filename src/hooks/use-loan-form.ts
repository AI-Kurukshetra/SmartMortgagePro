"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  type FieldPath,
  type Resolver,
  type UseFormReturn,
  useForm,
  useWatch,
} from "react-hook-form";
import { hashStringSha256 } from "@/src/services/mock-service-utils";
import { mockLoanService } from "@/src/services/loan-service";
import { useLoanDraftStore } from "@/src/store/loan-draft-store";
import {
  DEFAULT_LOAN_APPLICATION,
  loanApplicationSchema,
  type LoanApplication,
  type LoanDraft,
} from "@/src/types/smart-mortgage";

export const STEP_FIELD_PATHS: Array<FieldPath<LoanApplication>[]> = [
  ["loanType", "occupancyType", "estimatedPropertyValue", "desiredLoanAmount", "targetCloseDate"],
  [
    "borrower.fullName",
    "borrower.ssnMasked",
    "borrower.dateOfBirth",
    "borrower.currentAddress.line1",
    "borrower.currentAddress.city",
    "borrower.currentAddress.state",
    "borrower.currentAddress.zip",
  ],
  ["employment.employerName", "employment.startDate", "employment.position", "employment.baseSalary"],
  ["assets", "downPaymentSource"],
  ["consents.softCreditPull"],
  ["property.propertyAddress", "property.propertyType", "property.yearBuilt", "property.squareFootage"],
  ["consents.creditPull", "consents.ecoa", "consents.privacyNotice", "consents.esignDisclosure"],
];

type UseLoanFormResult = {
  form: UseFormReturn<LoanApplication>;
  currentStep: number;
  completedSteps: number[];
  hasResumeDraft: boolean;
  isHydrating: boolean;
  isSavingDraft: boolean;
  isSubmitting: boolean;
  lastSavedAt: string | null;
  setCurrentStep: (step: number) => void;
  goToNextStep: () => Promise<boolean>;
  goToPreviousStep: () => void;
  submitApplication: () => Promise<{ loanId: string; referenceNumber: string } | null>;
};

async function buildPersistableApplication(values: LoanApplication) {
  const borrowerSsnDigits = values.borrower.ssnMasked.replace(/\D/g, "");
  const borrowerHash = borrowerSsnDigits
    ? await hashStringSha256(`borrower:${borrowerSsnDigits}`)
    : "";

  const nextCoBorrower = values.coBorrower.enabled
    ? {
        ...values.coBorrower,
        ssnHash: values.coBorrower.ssnMasked.replace(/\D/g, "")
          ? await hashStringSha256(`coBorrower:${values.coBorrower.ssnMasked.replace(/\D/g, "")}`)
          : "",
        ssnLast4: values.coBorrower.ssnMasked.replace(/\D/g, "").slice(-4).padStart(4, "0"),
      }
    : values.coBorrower;

  return {
    ...values,
    borrower: {
      ...values.borrower,
      ssnHash: borrowerHash,
      ssnLast4: borrowerSsnDigits.slice(-4).padStart(4, "0"),
    },
    coBorrower: nextCoBorrower,
  };
}

export function useLoanForm(): UseLoanFormResult {
  const {
    draft,
    hasHydratedDraft,
    hydrateDraft,
    setDraft,
    updateDraft,
  } = useLoanDraftStore();
  const [hasResumeDraft, setHasResumeDraft] = useState(false);
  const saveTimer = useRef<number | null>(null);
  const form = useForm<LoanApplication>({
    resolver: zodResolver(loanApplicationSchema) as Resolver<LoanApplication>,
    defaultValues: draft.application,
    mode: "onChange",
  });
  const watchedValues = useWatch({ control: form.control });

  const hydrateMutation = useMutation({
    mutationFn: () => mockLoanService.getDraft(),
    onSuccess: (storedDraft) => {
      if (storedDraft?.application) {
        hydrateDraft(storedDraft);
        form.reset(storedDraft.application);
        setHasResumeDraft(true);
      } else {
        hydrateDraft(null);
        form.reset(DEFAULT_LOAN_APPLICATION);
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: (nextDraft: LoanDraft) => mockLoanService.saveDraft(nextDraft),
    onSuccess: () => {
      updateDraft((current) => ({
        ...current,
        lastSavedAt: new Date().toISOString(),
      }));
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (values: LoanApplication) => mockLoanService.submitApplication(values),
  });

  useEffect(() => {
    if (!hasHydratedDraft && !hydrateMutation.isPending) {
      hydrateMutation.mutate();
    }
  }, [hasHydratedDraft, hydrateMutation]);

  useEffect(() => {
    if (!hasHydratedDraft) return;
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }

    saveTimer.current = window.setTimeout(async () => {
      const persistedApplication = await buildPersistableApplication(form.getValues());
      const nextDraft: LoanDraft = {
        ...draft,
        application: persistedApplication,
      };
      setDraft(nextDraft);
      saveMutation.mutate(nextDraft);
    }, 2000);

    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, [draft, form, hasHydratedDraft, saveMutation, setDraft, watchedValues]);

  const currentStep = draft.currentStep;
  const completedSteps = draft.completedSteps;

  const setCurrentStep = (step: number) => {
    updateDraft((current) => ({ ...current, currentStep: step }));
  };

  const goToNextStep = async () => {
    const valid = await form.trigger(STEP_FIELD_PATHS[currentStep], { shouldFocus: true });
    if (!valid) return false;

    updateDraft((current) => ({
      ...current,
      currentStep: Math.min(current.currentStep + 1, STEP_FIELD_PATHS.length - 1),
      completedSteps: current.completedSteps.includes(current.currentStep)
        ? current.completedSteps
        : [...current.completedSteps, current.currentStep].sort((left, right) => left - right),
    }));
    return true;
  };

  const goToPreviousStep = () => {
    updateDraft((current) => ({
      ...current,
      currentStep: Math.max(current.currentStep - 1, 0),
    }));
  };

  const submitApplication = async () => {
    const valid = await form.trigger(undefined, { shouldFocus: true });
    if (!valid) return null;

    const persistedApplication = await buildPersistableApplication(form.getValues());
    const result = await submitMutation.mutateAsync(persistedApplication);

    updateDraft((current) => ({
      ...current,
      application: persistedApplication,
      submittedLoanId: result.loanId,
      referenceNumber: result.referenceNumber,
      completedSteps: STEP_FIELD_PATHS.map((_, index) => index),
    }));

    return result;
  };

  return {
    form,
    currentStep,
    completedSteps,
    hasResumeDraft,
    isHydrating: hydrateMutation.isPending || !hasHydratedDraft,
    isSavingDraft: saveMutation.isPending,
    isSubmitting: submitMutation.isPending,
    lastSavedAt: draft.lastSavedAt,
    setCurrentStep,
    goToNextStep,
    goToPreviousStep,
    submitApplication,
  };
}
