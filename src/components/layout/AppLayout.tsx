"use client";

import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { useIsMobile } from "@/src/hooks/use-mobile";

export function AppLayout() {
  const isMobile = useIsMobile();

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#0d1117" }}>
      {!isMobile && <AppSidebar />}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          background: "#111827",
          padding: "28px 32px",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
