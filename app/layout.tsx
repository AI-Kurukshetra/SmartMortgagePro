import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { Toaster } from "sonner";
import { MuiThemeProvider } from "@/components/providers/mui-theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { env } from "@/env";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: "SmartMortgagePro",
  description: "AI-powered mortgage workflow platform for lenders and loan teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppRouterCacheProvider>
          <QueryProvider>
            <MuiThemeProvider>{children}</MuiThemeProvider>
          </QueryProvider>
          <Toaster position="top-right" richColors closeButton />
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
