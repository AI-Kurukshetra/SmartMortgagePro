"use client";

import { useTransition } from "react";

type GoogleOAuthButtonProps = {
  action: () => Promise<{ ok: true; url?: string } | { error: string } | { error: { _form?: string[] } }>;
  onError?: (message: string) => void;
};

export function GoogleOAuthButton({ action, onError }: GoogleOAuthButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(() => {
      void (async () => {
        const result = await action();
        if ("error" in result && result.error) {
          if (typeof result.error === "string") {
            onError?.(result.error);
            return;
          }
          onError?.(result.error._form?.[0] ?? "OAuth sign-in failed.");
          return;
        }
        if ("ok" in result && result.ok && result.url) {
          window.location.assign(result.url);
        }
      })();
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-gray-200 text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="text-base font-medium">
        {isPending ? "Redirecting..." : "Login with Google"}
      </span>
    </button>
  );
}
