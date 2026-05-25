"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  updateDefaultCurrency,
  updatePassword,
  updateLanguage,
} from "@/actions/profile";
import { logout } from "@/actions/auth";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

interface AccountSettingsProps {
  defaultCurrency: string;
  language: string;
}

export function AccountSettings({
  defaultCurrency,
  language,
}: AccountSettingsProps) {
  const t = useTranslations();
  const [currency, setCurrency] = useState(defaultCurrency);
  const [lang, setLang] = useState(language);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currencyDialogOpen, setCurrencyDialogOpen] = useState(false);
  const [pendingCurrency, setPendingCurrency] = useState("");

  function handleCurrencyChange(v: string) {
    if (v && v !== currency) {
      setPendingCurrency(v);
      setCurrencyDialogOpen(true);
    }
  }

  async function confirmCurrencyChange() {
    setCurrencyDialogOpen(false);
    setSubmitting(true);
    const fd = new FormData();
    fd.set("currency", pendingCurrency);
    const result = await updateDefaultCurrency(fd);
    setSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setCurrency(pendingCurrency);
    toast.success(t("account.currencyUpdated"));
  }

  async function handleLanguageChange(v: string) {
    if (!v || v === lang) return;
    setSubmitting(true);
    const fd = new FormData();
    fd.set("language", v);
    const result = await updateLanguage(fd);
    setSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setLang(v);
    toast.success(t("account.languageUpdated"));
    window.location.reload();
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData();
    fd.set("newPassword", newPassword);
    fd.set("confirmPassword", confirmPassword);
    const result = await updatePassword(fd);
    setSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(t("account.passwordUpdated"));
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("account.title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("account.currency")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={currency} onValueChange={(v) => v && handleCurrencyChange(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="KRW">KRW (&#8361;)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="JPY">JPY (&#165;)</SelectItem>
              <SelectItem value="EUR">EUR (&#8364;)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("account.language")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={lang} onValueChange={(v) => v && handleLanguageChange(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ko">한국어</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("account.changePassword")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="newPw">{t("auth.newPassword")}</Label>
              <Input
                id="newPw"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPw">{t("auth.confirmPassword")}</Label>
              <Input
                id="confirmPw"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {t("account.updatePassword")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("nav.logout")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={logout}>
            <Button type="submit" variant="destructive" className="gap-2">
              <LogOut className="h-4 w-4" />
              {t("nav.logout")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <AlertDialog
        open={currencyDialogOpen}
        onOpenChange={setCurrencyDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("account.currencyConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("account.currencyWarning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCurrencyChange}>
              {t("common.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
