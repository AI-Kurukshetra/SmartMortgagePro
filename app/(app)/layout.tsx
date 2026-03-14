import Link from "next/link";
import { BadgeDollarSign, LayoutDashboard, Workflow } from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard",
    label: "Pipeline",
    icon: Workflow,
  },
  {
    href: "/dashboard",
    label: "Closings",
    icon: BadgeDollarSign,
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 md:grid-cols-[260px_1fr]">
        <aside className="border-r border-slate-200 bg-white px-6 py-8">
          <Link href="/dashboard" className="block pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
              SmartMortgage Pro
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Operations Hub</h1>
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
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="bg-slate-50 px-4 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
