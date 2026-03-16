"use client";

import { NavLink, useNavigate } from "react-router-dom";
import {
  Landmark,
  LayoutDashboard,
  TrendingUp,
  Bell,
  FileText,
  Building2,
  Users,
  FolderOpen,
  GitBranch,
  CreditCard,
  DollarSign,
  ClipboardCheck,
  BarChart3,
  Scale,
  MessageSquare,
  BarChart2,
  BookOpen,
  Eye,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navSections = [
  {
    label: "OVERVIEW",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/analytics", label: "Analytics", icon: TrendingUp },
      { to: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "LOAN OPERATIONS",
    items: [
      { to: "/apply", label: "Applications", icon: FileText },
      { to: "/loans", label: "Loans", icon: Building2 },
      { to: "/borrowers", label: "Borrowers", icon: Users },
      { to: "/documents", label: "Documents", icon: FolderOpen },
      { to: "/workflows", label: "Workflows", icon: GitBranch },
    ],
  },
  {
    label: "UNDERWRITING",
    items: [
      { to: "/credit", label: "Credit Reports", icon: CreditCard },
      { to: "/income-verification", label: "Income Verification", icon: DollarSign },
      { to: "/underwriting", label: "Underwriting", icon: ClipboardCheck },
      { to: "/pricing", label: "Pricing Engine", icon: BarChart3 },
    ],
  },
  {
    label: "COMPLIANCE & COMMS",
    items: [
      { to: "/compliance", label: "Compliance", icon: Scale },
      { to: "/communications", label: "Communications", icon: MessageSquare },
      { to: "/reporting", label: "Reporting", icon: BarChart2 },
    ],
  },
  {
    label: "INNOVATIVE",
    items: [
      { to: "/education", label: "Financial Education", icon: BookOpen },
      { to: "/property-tours", label: "Property Tours", icon: Eye },
    ],
  },
];

export function AppSidebar() {
  const navigate = useNavigate();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        background: "#0d1117",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflowY: "auto",
        position: "sticky",
        top: 0,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 16px 16px" }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Landmark size={18} color="white" />
        </div>
        <div>
          <p style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 700, lineHeight: 1.3, margin: 0 }}>
            SmartMortgage
          </p>
          <p style={{ color: "#475569", fontSize: 11, margin: 0 }}>Pro Platform</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "4px 10px 12px", overflowY: "auto" }}>
        {navSections.map((section) => (
          <div key={section.label} style={{ marginBottom: 20 }}>
            <p
              style={{
                color: "#334155",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "0 10px",
                marginBottom: 4,
              }}
            >
              {section.label}
            </p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      style={({ isActive }) => ({
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "7px 10px",
                        borderRadius: 7,
                        textDecoration: "none",
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? "#e2e8f0" : "#64748b",
                        background: isActive ? "rgba(14,165,233,0.1)" : "transparent",
                        borderLeft: isActive ? "2px solid #0ea5e9" : "2px solid transparent",
                        transition: "all 0.15s ease",
                        marginBottom: 1,
                      })}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        if (!el.classList.contains("active")) {
                          el.style.color = "#cbd5e1";
                          el.style.background = "rgba(255,255,255,0.04)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        if (!el.classList.contains("active")) {
                          el.style.color = "#64748b";
                          el.style.background = "transparent";
                        }
                      }}
                    >
                      <Icon size={14} />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "0 12px" }} />

      {/* Logout */}
      <div style={{ padding: "10px 10px 14px" }}>
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: "7px 10px",
            borderRadius: 7,
            background: "transparent",
            border: "none",
            color: "#475569",
            fontSize: 13,
            cursor: "pointer",
            transition: "all 0.15s ease",
            textAlign: "left",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.08)";
            e.currentTarget.style.color = "#f87171";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#475569";
          }}
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
