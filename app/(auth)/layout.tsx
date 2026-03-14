import { AuthLeftPanel } from "@/components/auth/auth-left-panel";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#EEF2FF] px-4 py-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-25px_rgba(15,23,42,0.25)] lg:grid-cols-2">
        <AuthLeftPanel />
        <section className="bg-white">{children}</section>
      </div>
    </main>
  );
}
