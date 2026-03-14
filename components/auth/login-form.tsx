"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { googleOAuthAction, loginAction } from "@/actions/auth";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";
import { LoginSchema, type LoginInput } from "@/lib/validations/auth";

type LoginErrors = Partial<Record<keyof LoginInput | "_form", string[]>>;

export function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isPending, startTransition] = useTransition();
  const oauthCallbackFailed = searchParams.get("error") === "oauth_callback_failed";

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    const parsed = LoginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    startTransition(() => {
      void (async () => {
        const formData = new FormData();
        formData.set("email", parsed.data.email);
        formData.set("password", parsed.data.password);

        const result = await loginAction(formData);
        if (result?.error) {
          setErrors(result.error as LoginErrors);
        }
      })();
    });
  };

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-6 p-12">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">Welcome back</h1>
        <p className="text-sm text-gray-500">
          Sign in to manage your mortgage pipeline and borrower workflows.
        </p>
      </div>

      <GoogleOAuthButton
        action={googleOAuthAction}
        onError={(message) => setErrors({ _form: [message] })}
      />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-sm text-gray-400">or</span>
        <div className="h-px flex-1 bg-gray-200" />
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

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-gray-700">
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-12 w-full rounded-xl border-0 bg-[#F5F6FA] px-4 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B4FE4]"
            placeholder="••••••••"
          />
          <button
            type="button"
            data-testid="password-toggle"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password?.[0] ? (
          <p className="text-sm text-red-600">{errors.password[0]}</p>
        ) : null}
      </div>

      {errors._form?.[0] ? <p className="text-sm text-red-600">{errors._form[0]}</p> : null}
      {!errors._form?.[0] && oauthCallbackFailed ? (
        <p className="text-sm text-red-600">
          Google sign-in failed. Please try again.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#3B4FE4] text-base font-semibold text-white transition hover:bg-[#2D3FD4] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>

      <Link href="/forgot-password" className="text-center text-sm text-[#3B4FE4] hover:underline">
        Forgot password?
      </Link>

      <p className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-[#3B4FE4] hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
