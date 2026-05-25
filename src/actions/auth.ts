"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  loginSchema,
  signupSchema,
  resetPasswordSchema,
  newPasswordSchema,
} from "@/lib/validations/auth";

export type AuthResult = {
  error?: string;
};

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export async function signup(formData: FormData): Promise<AuthResult> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    defaultCurrency: formData.get("defaultCurrency"),
    language: formData.get("language"),
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${getBaseUrl()}/auth/callback`,
      data: {
        default_currency: parsed.data.defaultCurrency,
        language: parsed.data.language,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    return { error: "이미 가입된 이메일입니다" };
  }

  redirect("/dashboard");
}

export async function login(formData: FormData): Promise<AuthResult> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    if (error.message === "Invalid login credentials") {
      return { error: "이메일 또는 비밀번호가 올바르지 않습니다" };
    }
    if (error.message === "Email not confirmed") {
      return { error: "이메일 인증이 완료되지 않았습니다. 메일을 확인해주세요" };
    }
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resetPassword(formData: FormData): Promise<AuthResult> {
  const raw = { email: formData.get("email") };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${getBaseUrl()}/auth/callback?next=/reset-password/confirm`,
    }
  );

  if (error) {
    return { error: error.message };
  }

  return {};
}

export async function updatePassword(formData: FormData): Promise<AuthResult> {
  const raw = {
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = newPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/login");
}
