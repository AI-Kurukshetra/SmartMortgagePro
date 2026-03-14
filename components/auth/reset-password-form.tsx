"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePasswordAction } from "@/actions/auth";
import { ResetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";

type ResetPasswordErrors = Partial<Record<keyof ResetPasswordInput | "_form", string[]>>;

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<ResetPasswordErrors>({});
  const [isPending, startTransition] = useTransition();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    const parsed = ResetPasswordSchema.safeParse({
      password,
      confirm_password: confirmPassword,
    });

    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    startTransition(() => {
      void (async () => {
        const formData = new FormData();
        formData.set("password", parsed.data.password);
        formData.set("confirm_password", parsed.data.confirm_password);

        const result = await updatePasswordAction(formData);
        if ("error" in result && result.error) {
          if (typeof result.error === "string") {
            setErrors({ _form: [result.error] });
          } else {
            setErrors(result.error as ResetPasswordErrors);
          }
          return;
        }
        if ("ok" in result && result.ok && result.redirectTo) {
          router.push(result.redirectTo);
          router.refresh();
        }
      })();
    });
  };

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-6 p-12">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">Set a new password</h1>
        <p className="text-sm text-gray-500">
          Choose a strong password with at least 8 characters.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-gray-700">
          New Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-12 w-full rounded-xl border-0 bg-[#F5F6FA] px-4 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B4FE4]"
            placeholder="At least 8 characters"
          />
          <button
            type="button"
            data-testid="reset-password-toggle"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password?.[0] ? <p className="text-sm text-red-600">{errors.password[0]}</p> : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="confirm_password" className="text-sm font-medium text-gray-700">
          Confirm Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="confirm_password"
            name="confirm_password"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="h-12 w-full rounded-xl border-0 bg-[#F5F6FA] px-4 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B4FE4]"
            placeholder="Repeat your new password"
          />
          <button
            type="button"
            data-testid="reset-confirm-password-toggle"
            onClick={() => setShowConfirmPassword((value) => !value)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.confirm_password?.[0] ? (
          <p className="text-sm text-red-600">{errors.confirm_password[0]}</p>
        ) : null}
      </div>

      {errors._form?.[0] ? <p className="text-sm text-red-600">{errors._form[0]}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="flex h-14 w-full items-center justify-center rounded-xl bg-[#3B4FE4] text-base font-semibold text-white transition hover:bg-[#2D3FD4] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Updating..." : "Update password"}
      </button>

      <p className="text-center text-sm text-gray-500">
        Back to{" "}
        <Link href="/login" className="font-medium text-[#3B4FE4] hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
