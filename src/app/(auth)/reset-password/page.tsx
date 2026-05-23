"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import Link from "next/link";
import { resetPassword, type AuthResult } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ResetPasswordPage() {
  const t = useTranslations();
  const [sent, setSent] = useState(false);
  const [state, formAction, isPending] = useActionState<AuthResult, FormData>(
    async (_prev, formData) => {
      const result = await resetPassword(formData);
      if (!result.error) setSent(true);
      return result;
    },
    {}
  );

  if (sent) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>{t("auth.resetPassword")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            {t("auth.resetEmailSent")}
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Link
            href="/login"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            {t("auth.login")}
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>{t("auth.resetPassword")}</CardTitle>
        <CardDescription>{t("auth.forgotPassword")}</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state.error && (
            <p className="text-sm text-destructive text-center">
              {state.error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? t("common.loading") : t("auth.sendResetLink")}
          </Button>
          <Link
            href="/login"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {t("auth.login")}
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
