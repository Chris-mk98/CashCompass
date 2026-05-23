"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import Link from "next/link";
import { signup, type AuthResult } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignupPage() {
  const t = useTranslations();
  const [state, formAction, isPending] = useActionState<AuthResult, FormData>(
    async (_prev, formData) => signup(formData),
    {}
  );

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t("app.name")}</CardTitle>
        <CardDescription>{t("auth.signup")}</CardDescription>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("auth.currency")}</Label>
              <Select name="defaultCurrency" defaultValue="KRW">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KRW">KRW (₩)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("auth.language")}</Label>
              <Select name="language" defaultValue="ko">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ko">한국어</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? t("common.loading") : t("auth.signup")}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            {t("auth.hasAccount")}{" "}
            <Link
              href="/login"
              className="text-primary underline-offset-4 hover:underline"
            >
              {t("auth.login")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
