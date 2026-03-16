"use client";

import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
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
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"DM Sans", var(--font-geist-sans), system-ui, sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { borderRadius: 12 } } },
  },
});

export function AppShell({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
      }),
  );

  return (
    <ThemeProvider theme={mvpTheme}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <CssBaseline />
          {children}
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
