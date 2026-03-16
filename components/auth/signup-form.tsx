"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signupAction } from "@/actions/auth";
import { SignupSchema, type SignupInput } from "@/lib/validations/auth";

type SignupErrors = Partial<Record<keyof SignupInput | "_form", string[]>>;

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"borrower" | "loan_officer" | "processor" | "underwriter">("borrower");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [isPending, startTransition] = useTransition();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    const parsed = SignupSchema.safeParse({
      full_name: fullName,
      email,
      password,
      confirm_password: confirmPassword,
      role,
    });

    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    startTransition(() => {
      void (async () => {
        const formData = new FormData();
        formData.set("full_name", parsed.data.full_name);
        formData.set("email", parsed.data.email);
        formData.set("password", parsed.data.password);
        formData.set("confirm_password", parsed.data.confirm_password);
        formData.set("role", parsed.data.role);

        const result = await signupAction(formData);
        if ("error" in result && result.error) {
          setErrors(result.error as SignupErrors);
          return;
        }
        if ("ok" in result && result.ok && result.redirectTo) {
          router.push(result.redirectTo);
        }
      })();
    });
  };

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-6 p-12">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">Create your account</h1>
        <p className="text-sm text-gray-500">
          Start your SmartMortgage Pro workspace and onboard your first borrower.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="full_name" className="text-sm font-medium text-gray-700">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="h-12 w-full rounded-xl border-0 bg-[#F5F6FA] px-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B4FE4]"
          placeholder="Jane Doe"
        />
        {errors.full_name?.[0] ? (
          <p className="text-sm text-red-600">{errors.full_name[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="role" className="text-sm font-medium text-gray-700">
          I am a <span className="text-red-500">*</span>
        </label>
        <select
          id="role"
          name="role"
          value={role}
          onChange={(event) => setRole(event.target.value as typeof role)}
          className="h-12 w-full rounded-xl border-0 bg-[#F5F6FA] px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3B4FE4] appearance-none"
        >
          <option value="borrower">Borrower — applying for a mortgage</option>
          <option value="loan_officer">Loan Officer</option>
          <option value="processor">Processor</option>
          <option value="underwriter">Underwriter</option>
        </select>
        {errors.role?.[0] ? <p className="text-sm text-red-600">{errors.role[0]}</p> : null}
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
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-12 w-full rounded-xl border-0 bg-[#F5F6FA] px-4 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B4FE4]"
            placeholder="At least 8 characters"
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
            placeholder="Repeat your password"
          />
          <button
            type="button"
            data-testid="confirm-password-toggle"
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
        {isPending ? "Creating..." : "Create account"}
      </button>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[#3B4FE4] hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
