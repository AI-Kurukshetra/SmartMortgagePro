import Link from "next/link";
import { redirect } from "next/navigation";
import { Landmark, ArrowRight, Shield, Zap, BarChart3 } from "lucide-react";
import { getAuthenticatedViewer } from "@/lib/auth/session";

export default async function HomePage() {
  const viewer = await getAuthenticatedViewer();
  if (viewer) {
    redirect(viewer.role === "borrower" ? "/my-loans" : "/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#0d1117] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500">
            <Landmark size={18} className="text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white">SmartMortgage Pro</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400 transition"
          >
            Get started <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-8 pt-24 pb-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-1.5 text-xs font-medium text-sky-400">
          <Zap size={12} /> AI-Powered Mortgage Origination Platform
        </div>
        <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
          Close loans faster.<br />
          <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            Impress every borrower.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          SmartMortgage Pro digitizes the full mortgage lifecycle — from borrower application
          through closing — with automated workflows, intelligent document management, and
          AI-driven underwriting.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="flex items-center gap-2 rounded-xl bg-sky-500 px-7 py-3.5 text-base font-semibold text-white hover:bg-sky-400 transition"
          >
            Start free <ArrowRight size={16} />
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-white/10 px-7 py-3.5 text-base font-medium text-slate-300 hover:border-white/20 hover:text-white transition"
          >
            Sign in to your account
          </Link>
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-5xl px-8 pb-24">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: <Shield size={20} className="text-sky-400" />,
              title: "Compliance built-in",
              desc: "Federal & state compliance checks run automatically at every stage.",
            },
            {
              icon: <Zap size={20} className="text-indigo-400" />,
              title: "Automated underwriting",
              desc: "Rule-based engine evaluates applications against lending criteria in minutes.",
            },
            {
              icon: <BarChart3 size={20} className="text-emerald-400" />,
              title: "Full pipeline visibility",
              desc: "Loan officers see every loan stage, task, and bottleneck in one dashboard.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/5 bg-white/[0.03] p-6 backdrop-blur"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold text-white">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
