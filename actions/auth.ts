"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import {
  ForgotPasswordSchema,
  LoginSchema,
  ResetPasswordSchema,
  SignupSchema,
} from "@/lib/validations/auth";

type AuthFieldErrors = Record<string, string[] | undefined>;
type AuthActionResult =
  | { ok: true; redirectTo?: string; url?: string }
  | { error: AuthFieldErrors }
  | { error: string };

export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const raw = Object.fromEntries(formData);
  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors as AuthFieldErrors };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: { _form: [error.message] } as AuthFieldErrors };
  }

  const { data: { user } } = await supabase.auth.getUser();
  let redirectTo = "/dashboard";

  if (user?.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    redirectTo = profile?.role === "borrower" ? "/my-loans" : "/dashboard";
  }

  revalidatePath("/", "layout");
  return { ok: true, redirectTo };
}

export async function signupAction(formData: FormData): Promise<AuthActionResult> {
  const raw = Object.fromEntries(formData);
  const parsed = SignupSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors as AuthFieldErrors };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name, role: parsed.data.role },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"}/auth/callback`,
    },
  });

  if (error) {
    return { error: { _form: [error.message] } as AuthFieldErrors };
  }

  return { ok: true, redirectTo: "/auth/verify-email" };
}

export async function signOutAction(): Promise<{ ok: true; redirectTo: string } | { error: string }> {
  const supabase = await createServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }
  return { ok: true, redirectTo: "/login" };
}

export async function googleOAuthAction(): Promise<AuthActionResult> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    return { ok: true, url: data.url };
  }

  return { error: "Google OAuth initialization failed." };
}

export async function resetPasswordAction(formData: FormData): Promise<AuthActionResult> {
  const raw = Object.fromEntries(formData);
  const parsed = ForgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors as AuthFieldErrors };
  }

  const supabase = await createServerClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"}/reset-password`,
  });

  // Always return a success state to avoid account enumeration.
  return { ok: true };
}

export async function updatePasswordAction(formData: FormData): Promise<AuthActionResult> {
  const raw = Object.fromEntries(formData);
  const parsed = ResetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors as AuthFieldErrors };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: { _form: [error.message] } as AuthFieldErrors };
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  return { ok: true, redirectTo: "/login?reset=success" };
}

export const resetPassword = resetPasswordAction;
export const updatePassword = updatePasswordAction;
