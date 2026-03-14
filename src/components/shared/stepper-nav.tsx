"use client";

import { CheckCircleRounded } from "@mui/icons-material";
import { Step, StepButton, StepLabel, Stepper } from "@mui/material";

export function StepperNav({
  steps,
  activeStep,
  completedSteps,
  onStepChange,
}: {
  steps: string[];
  activeStep: number;
  completedSteps: number[];
  onStepChange: (step: number) => void;
}) {
  return (
    <Stepper nonLinear activeStep={activeStep} sx={{ px: { xs: 0, md: 1 } }}>
      {steps.map((label, index) => (
        <Step key={label} completed={completedSteps.includes(index)}>
          <StepButton color="inherit" onClick={() => onStepChange(index)} aria-label={`Go to ${label}`}>
            <StepLabel icon={completedSteps.includes(index) ? <CheckCircleRounded sx={{ color: "#16A34A" }} /> : undefined}>
              {label}
            </StepLabel>
          </StepButton>
        </Step>
      ))}
    </Stepper>
  );
}
