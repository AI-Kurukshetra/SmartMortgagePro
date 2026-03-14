"use client";

import {
  DescriptionRounded,
  InsertDriveFileRounded,
  TimelineRounded,
} from "@mui/icons-material";
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "@/src/components/layout/sidebar";
import { TopBar } from "@/src/components/layout/topbar";
import { ToastProvider } from "@/src/components/shared/toast-provider";

const mvpTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1565C0" },
    secondary: { main: "#F59E0B" },
    success: { main: "#16A34A" },
    background: {
      default: "#F5F7FB",
      paper: "#FFFFFF",
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"DM Sans", var(--font-geist-sans), system-ui, sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

const navItems = [
  { value: "/apply", label: "Apply", icon: <DescriptionRounded /> },
  { value: "/documents", label: "Documents", icon: <InsertDriveFileRounded /> },
  { value: "/status", label: "Status", icon: <TimelineRounded /> },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  );
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <ThemeProvider theme={mvpTheme}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <CssBaseline />
          <Box
            sx={{
              minHeight: "100vh",
              bgcolor: "background.default",
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "288px 1fr" },
              pb: { xs: 9, md: 0 },
            }}
          >
            <Box aria-label="Sidebar Section" sx={{ display: { xs: "none", md: "block" }, height: "100%" }}>
              <Sidebar />
            </Box>
            <Box sx={{ p: { xs: 2, md: 4 } }}>
              <TopBar />
              {children}
            </Box>
          </Box>

          <BottomNavigation
            showLabels
            value={location.pathname}
            onChange={(_, nextValue) => navigate(nextValue)}
            sx={{
              display: { xs: "flex", md: "none" },
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              borderTop: "1px solid rgba(10, 22, 40, 0.08)",
              zIndex: 1200,
            }}
          >
            {navItems.map((item) => (
              <BottomNavigationAction
                key={item.value}
                label={item.label}
                value={item.value}
                icon={item.icon}
              />
            ))}
          </BottomNavigation>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
