"use client";

import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Skeleton, Stack } from "@mui/material";
import { AppShell } from "@/src/components/layout/app-shell";
import { AppLayout } from "@/src/components/layout/AppLayout";
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

function ComingSoon({ title }: { title: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 300,
        color: "#475569",
        gap: 12,
      }}
    >
      <p style={{ fontSize: 22, fontWeight: 700, color: "#94a3b8", margin: 0 }}>{title}</p>
      <p style={{ fontSize: 14, margin: 0 }}>Coming soon</p>
    </div>
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
          <Routes>
            <Route path="/" element={<LandingRedirect />} />
            <Route element={<AppLayout />}>
              {/* Existing working routes */}
              <Route path="/apply" element={<LoanApplicationPage />} />
              <Route path="/documents" element={<DocumentVaultPage />} />
              <Route path="/status" element={<StatusDashboardPage />} />
              {/* Stub routes — will be replaced in TASK 3 */}
              <Route path="/dashboard" element={<ComingSoon title="Dashboard" />} />
              <Route path="/analytics" element={<ComingSoon title="Analytics" />} />
              <Route path="/notifications" element={<ComingSoon title="Notifications" />} />
              <Route path="/loans" element={<ComingSoon title="Loans" />} />
              <Route path="/borrowers" element={<ComingSoon title="Borrowers" />} />
              <Route path="/workflows" element={<ComingSoon title="Workflows" />} />
              <Route path="/credit" element={<ComingSoon title="Credit Reports" />} />
              <Route path="/income-verification" element={<ComingSoon title="Income Verification" />} />
              <Route path="/underwriting" element={<ComingSoon title="Underwriting" />} />
              <Route path="/pricing" element={<ComingSoon title="Pricing Engine" />} />
              <Route path="/compliance" element={<ComingSoon title="Compliance" />} />
              <Route path="/communications" element={<ComingSoon title="Communications" />} />
              <Route path="/reporting" element={<ComingSoon title="Reporting" />} />
              <Route path="/education" element={<ComingSoon title="Financial Education" />} />
              <Route path="/property-tours" element={<ComingSoon title="Property Tours" />} />
            </Route>
            <Route path="*" element={<Navigate replace to="/" />} />
          </Routes>
        </Suspense>
      </AppShell>
    </BrowserRouter>
  );
}

export default SmartMortgageMvpApp;
