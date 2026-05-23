"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthResult } from "@/actions/auth";
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

export default function LoginPage() {
  const t = useTranslations();
  const [state, formAction, isPending] = useActionState<AuthResult, FormData>(
    async (_prev, formData) => login(formData),
    {}
  );

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t("app.name")}</CardTitle>
        <CardDescription>{t("auth.login")}</CardDescription>
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
          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? t("common.loading") : t("auth.login")}
          </Button>
          <div className="flex flex-col items-center gap-2 text-sm">
            <Link
              href="/reset-password"
              className="text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
            >
              {t("auth.forgotPassword")}
            </Link>
            <p className="text-muted-foreground">
              {t("auth.noAccount")}{" "}
              <Link
                href="/signup"
                className="text-primary underline-offset-4 hover:underline"
              >
                {t("auth.signup")}
              </Link>
            </p>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
