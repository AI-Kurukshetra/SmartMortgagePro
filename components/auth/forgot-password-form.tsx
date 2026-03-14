"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { resetPasswordAction } from "@/actions/auth";
import { ForgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";

type ForgotPasswordErrors = Partial<Record<keyof ForgotPasswordInput | "_form", string[]>>;

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<ForgotPasswordErrors>({});
  const [isPending, startTransition] = useTransition();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    const parsed = ForgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    startTransition(() => {
      void (async () => {
        const formData = new FormData();
        formData.set("email", parsed.data.email);

        const result = await resetPasswordAction(formData);
        if ("error" in result && result.error) {
          if (typeof result.error === "string") {
            setErrors({ _form: [result.error] });
          } else {
            setErrors(result.error as ForgotPasswordErrors);
          }
          return;
        }
        setSuccess(true);
      })();
    });
  };

  if (success) {
    return (
      <div className="flex flex-col gap-6 p-12">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Check your email</h1>
          <p className="text-sm text-gray-500">
            If an account exists for this email, we&apos;ve sent a password reset link.
          </p>
        </div>
        <Link href="/login" className="text-sm font-medium text-[#3B4FE4] hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-6 p-12">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">Forgot your password?</h1>
        <p className="text-sm text-gray-500">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-12 w-full rounded-xl border-0 bg-[#F5F6FA] px-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B4FE4]"
          placeholder="you@example.com"
        />
        {errors.email?.[0] ? <p className="text-sm text-red-600">{errors.email[0]}</p> : null}
      </div>

      {errors._form?.[0] ? <p className="text-sm text-red-600">{errors._form[0]}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="flex h-14 w-full items-center justify-center rounded-xl bg-[#3B4FE4] text-base font-semibold text-white transition hover:bg-[#2D3FD4] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Sending..." : "Send reset link"}
      </button>

      <p className="text-center text-sm text-gray-500">
        Remembered your password?{" "}
        <Link href="/login" className="font-medium text-[#3B4FE4] hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
