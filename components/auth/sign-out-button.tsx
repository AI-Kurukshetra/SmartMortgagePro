"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/actions/auth";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(() => {
      void (async () => {
        const result = await signOutAction();
        if ("ok" in result && result.ok) {
          router.replace(result.redirectTo ?? "/login");
          router.refresh();
          return;
        }
        console.error("Sign out failed", result);
      })();
    });
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isPending}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <LogOut size={16} />
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}
