import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeDollarSign, LayoutDashboard, MessagesSquare, TableProperties, Workflow } from "lucide-react";
import { getAuthenticatedViewer } from "@/lib/auth/session";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { UnreadBadge } from "@/components/messaging/unread-badge";
import type { ProfileRole } from "@/types/database.types";

const staffNavItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/pipeline",
    label: "Pipeline",
    icon: Workflow,
  },
  {
    href: "/dashboard",
    label: "Closings",
    icon: BadgeDollarSign,
  },
  {
    href: "/communications",
    label: "Communications",
    icon: MessagesSquare,
  },
];

const roleBadgeTone: Record<ProfileRole, string> = {
  borrower: "bg-sky-50 text-sky-700 border-sky-200",
  loan_officer: "bg-emerald-50 text-emerald-700 border-emerald-200",
  processor: "bg-amber-50 text-amber-700 border-amber-200",
  underwriter: "bg-violet-50 text-violet-700 border-violet-200",
  admin: "bg-slate-100 text-slate-800 border-slate-300",
};

function roleLabel(role: ProfileRole | null) {
  if (!role) return "Borrower";
  return role.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) {
    redirect("/login");
  }

  const role: ProfileRole | null = viewer.role;
  const isBorrower = role === "borrower" || role === null;
  const navItems = isBorrower
    ? [
        {
          href: "/my-loans",
          label: "My Applications",
          icon: LayoutDashboard,
        },
      ]
    : staffNavItems;

  return (
    <div className="min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 md:grid-cols-[260px_1fr]">
        <aside className="flex h-full flex-col border-r border-slate-200 bg-white px-6 py-8">
          <div>
            <Link href={isBorrower ? "/my-loans" : "/dashboard"} className="block pb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
                SmartMortgage Pro
              </p>
              <h1 className="mt-2 text-2xl font-bold text-slate-900">
                {isBorrower ? "Borrower Portal" : "Operations Hub"}
              </h1>
            </Link>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                  >
                    <Icon size={17} />
                    <span className="flex items-center gap-2">
                      {item.label}
                      {item.href === "/communications" ? <UnreadBadge userId={viewer.userId} /> : null}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto space-y-3 pt-8">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Signed in as</p>
              <p className="truncate text-sm font-medium text-slate-800">
                {viewer.email ?? "Unknown user"}
              </p>
              <span
                className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${roleBadgeTone[role ?? "borrower"]}`}
              >
                {roleLabel(role)}
              </span>
            </div>
            <SignOutButton />
          </div>
        </aside>

        <main className="bg-slate-50 px-4 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
