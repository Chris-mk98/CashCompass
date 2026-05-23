"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { updatePassword, type AuthResult } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ConfirmResetPasswordPage() {
  const t = useTranslations();
  const [state, formAction, isPending] = useActionState<AuthResult, FormData>(
    async (_prev, formData) => updatePassword(formData),
    {}
  );

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>{t("auth.setNewPassword")}</CardTitle>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state.error && (
            <p className="text-sm text-destructive text-center">
              {state.error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.newPassword")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? t("common.loading") : t("auth.setNewPassword")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
