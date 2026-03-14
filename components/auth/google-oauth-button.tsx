"use client";

import { useTransition } from "react";

type GoogleOAuthButtonProps = {
  action: () => Promise<{ error?: string } | void>;
  onError?: (message: string) => void;
};

export function GoogleOAuthButton({ action, onError }: GoogleOAuthButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(() => {
      void (async () => {
        const result = await action();
        if (result && "error" in result && result.error) {
          onError?.(result.error);
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
