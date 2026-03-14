"use client";

import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Box, Skeleton, Stack } from "@mui/material";
import { AppShell } from "@/src/components/layout/app-shell";
import LoanApplicationPage from "@/src/legacy-pages/LoanApplicationPage";
import { mockLoanService } from "@/src/services/loan-service";

const DocumentVaultPage = lazy(() => import("@/src/legacy-pages/DocumentVaultPage"));
const StatusDashboardPage = lazy(() => import("@/src/legacy-pages/StatusDashboardPage"));

function PageFallback() {
  return (
    <Stack spacing={2}>
      <Skeleton variant="rounded" height={120} />
      <Skeleton variant="rounded" height={400} />
    </Stack>
  );
}

function LandingRedirect() {
  const submission = mockLoanService.getSubmissionSync();
  return <Navigate replace to={submission?.loanId ? "/status" : "/apply"} />;
}

export function SmartMortgageMvpApp() {
  return (
    <BrowserRouter>
      <AppShell>
        <Suspense fallback={<PageFallback />}>
          <Box sx={{ transition: "opacity 200ms ease" }}>
            <Routes>
              <Route path="/" element={<LandingRedirect />} />
              <Route path="/apply" element={<LoanApplicationPage />} />
              <Route path="/documents" element={<DocumentVaultPage />} />
              <Route path="/status" element={<StatusDashboardPage />} />
              <Route path="*" element={<Navigate replace to="/" />} />
            </Routes>
          </Box>
        </Suspense>
      </AppShell>
    </BrowserRouter>
  );
}

export default SmartMortgageMvpApp;
