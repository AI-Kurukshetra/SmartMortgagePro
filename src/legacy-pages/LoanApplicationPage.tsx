"use client";

import { ArrowBackRounded, ArrowForwardRounded, SaveRounded } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Grid,
  Paper,
  Skeleton,
  Stack,
} from "@mui/material";
import { FormProvider } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfettiBurst } from "@/src/components/shared/confetti-burst";
import { StepperNav } from "@/src/components/shared/stepper-nav";
import { useToast } from "@/src/components/shared/toast-provider";
import {
  AssetsDownPaymentStep,
  BorrowerProfileStep,
  CreditLiabilitiesStep,
  EmploymentIncomeStep,
  LoanPurposeStep,
  LoanSummaryPanel,
  PropertyDetailsStep,
  ResumeDraftBanner,
  ReviewSubmitStep,
} from "@/src/components/loan/loan-application-steps";
import { useLoanForm } from "@/src/hooks/use-loan-form";

const steps = [
  "Loan Purpose",
  "Borrower Profile",
  "Employment & Income",
  "Assets",
  "Credit & Liabilities",
  "Property",
  "Review & Submit",
];

export default function LoanApplicationPage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const {
    form,
    currentStep,
    completedSteps,
    hasResumeDraft,
    isHydrating,
    isSavingDraft,
    isSubmitting,
    lastSavedAt,
    setCurrentStep,
    goToNextStep,
    goToPreviousStep,
    submitApplication,
  } = useLoanForm();
  const [showConfetti, setShowConfetti] = useState(false);
  const lastSavedToastRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastSavedAt && lastSavedAt !== lastSavedToastRef.current) {
      lastSavedToastRef.current = lastSavedAt;
      pushToast({ message: "Draft saved locally.", severity: "info" });
    }
  }, [lastSavedAt, pushToast]);

  if (isHydrating) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={68} />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Skeleton variant="rounded" height={520} />
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Skeleton variant="rounded" height={280} />
          </Grid>
        </Grid>
      </Stack>
    );
  }

  return (
    <FormProvider {...form}>
      <Stack spacing={3}>
        <ResumeDraftBanner visible={hasResumeDraft} lastSavedAt={lastSavedAt} />

        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
          <StepperNav
            steps={steps}
            activeStep={currentStep}
            completedSteps={completedSteps}
            onStepChange={setCurrentStep}
          />
        </Paper>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                border: "1px solid rgba(15,23,42,0.08)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <ConfettiBurst active={showConfetti} />
              {currentStep === 0 ? <LoanPurposeStep /> : null}
              {currentStep === 1 ? <BorrowerProfileStep /> : null}
              {currentStep === 2 ? <EmploymentIncomeStep /> : null}
              {currentStep === 3 ? <AssetsDownPaymentStep /> : null}
              {currentStep === 4 ? <CreditLiabilitiesStep /> : null}
              {currentStep === 5 ? <PropertyDetailsStep /> : null}
              {currentStep === 6 ? <ReviewSubmitStep onEditStep={setCurrentStep} /> : null}

              <Box sx={{ mt: 4 }}>
                <Alert severity="info">
                  Application auto-saves after 2 seconds of idle time, with save-and-resume via localStorage.
                </Alert>
              </Box>

              <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ mt: 4 }}>
                <Button
                  startIcon={<ArrowBackRounded />}
                  variant="outlined"
                  disabled={currentStep === 0}
                  onClick={goToPreviousStep}
                >
                  Previous
                </Button>

                <Stack direction="row" spacing={1.25}>
                  <Button startIcon={<SaveRounded />} variant="text" disabled={isSavingDraft}>
                    {isSavingDraft ? "Saving…" : "Autosave enabled"}
                  </Button>
                  {currentStep < steps.length - 1 ? (
                    <Button
                      endIcon={<ArrowForwardRounded />}
                      variant="contained"
                      onClick={async () => {
                        const moved = await goToNextStep();
                        if (!moved) {
                          pushToast({
                            message: "Complete the required fields before moving to the next step.",
                            severity: "warning",
                          });
                        }
                      }}
                    >
                      Next step
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      disabled={isSubmitting}
                      onClick={async () => {
                        const result = await submitApplication();
                        if (!result) {
                          pushToast({
                            message: "Review the application and complete the required disclosures before submitting.",
                            severity: "error",
                          });
                          return;
                        }

                        setShowConfetti(true);
                        pushToast({
                          message: `Your Loan Application #${result.referenceNumber} is submitted.`,
                          severity: "success",
                        });
                        window.setTimeout(() => {
                          navigate("/status");
                        }, 1200);
                      }}
                    >
                      {isSubmitting ? "Submitting…" : "Submit Application"}
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <LoanSummaryPanel />
          </Grid>
        </Grid>
      </Stack>
    </FormProvider>
  );
}
