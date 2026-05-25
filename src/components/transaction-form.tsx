"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Category, PaymentMethod } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SplitSettings } from "@/components/split-settings";
import { createTransaction, updateTransaction } from "@/actions/transactions";
import { calculatePaymentDate } from "@/lib/payment-date";
import { toast } from "sonner";
import { format } from "date-fns";
import { Info } from "lucide-react";

interface TransactionFormProps {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  defaultCurrency: string;
  initialData?: {
    id: string;
    type: string;
    amount: number;
    currency: string;
    categoryId: string;
    paymentMethodId: string | null;
    transactionDate: Date;
    note: string | null;
  };
}

export function TransactionForm({
  categories,
  paymentMethods,
  defaultCurrency,
  initialData,
}: TransactionFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const isEditing = !!initialData;

  const [type, setType] = useState(initialData?.type ?? "expense");
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? "");
  const [currency, setCurrency] = useState(
    initialData?.currency ?? defaultCurrency
  );
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "");
  const [paymentMethodId, setPaymentMethodId] = useState(
    initialData?.paymentMethodId ?? ""
  );
  const [transactionDate, setTransactionDate] = useState(
    initialData
      ? format(initialData.transactionDate, "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd")
  );
  const [note, setNote] = useState(initialData?.note ?? "");
  const [isSplit, setIsSplit] = useState(false);
  const [splitCount, setSplitCount] = useState(2);
  const [splitStartMonth, setSplitStartMonth] = useState(
    format(new Date(), "yyyy-MM")
  );
  const [submitting, setSubmitting] = useState(false);

  const estimatedPaymentDate = useMemo(() => {
    if (!paymentMethodId || !transactionDate) return null;
    const pm = paymentMethods.find((m) => m.id === paymentMethodId);
    if (!pm || pm.type !== "credit_card" || !pm.billingStartDay || !pm.paymentDay)
      return null;
    try {
      const date = calculatePaymentDate(new Date(transactionDate), {
        billingStartDay: pm.billingStartDay,
        billingEndDay: pm.billingEndDay ?? 0,
        paymentDay: pm.paymentDay,
        paymentMonthOffset: pm.paymentMonthOffset ?? 1,
      });
      return format(date, "yyyy-MM-dd");
    } catch {
      return null;
    }
  }, [paymentMethodId, transactionDate, paymentMethods]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const fd = new FormData();
    if (initialData) fd.set("id", initialData.id);
    fd.set("type", type);
    fd.set("amount", amount);
    fd.set("currency", currency);
    fd.set("categoryId", categoryId);
    fd.set("paymentMethodId", paymentMethodId || "");
    fd.set("transactionDate", transactionDate);
    fd.set("note", note);

    if (!isEditing) {
      fd.set("isSplit", String(isSplit));
      if (isSplit) {
        fd.set("splitCount", String(splitCount));
        fd.set("splitStartMonth", splitStartMonth + "-01");
      }
    }

    const result = isEditing
      ? await updateTransaction(fd)
      : await createTransaction(fd);

    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? t("transaction.updated") : t("transaction.saved"));
    router.push("/transactions");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? t("transaction.edit") : t("transaction.add")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("transaction.type")}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === "expense" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setType("expense")}
              >
                {t("transaction.expense")}
              </Button>
              <Button
                type="button"
                variant={type === "income" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setType("income")}
              >
                {t("transaction.income")}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">{t("transaction.amount")}</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("transaction.currency")}</Label>
              <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
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
          </div>

          <div className="space-y-2">
            <Label>{t("transaction.category")}</Label>
            <Select value={categoryId} onValueChange={(v) => v && setCategoryId(v)}>
              <SelectTrigger>
                <SelectValue placeholder={t("common.selectPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transactionDate">{t("transaction.date")}</Label>
            <Input
              id="transactionDate"
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              required
            />
          </div>

          {/* TODO: 신용카드 할부 지원 - 할부 적용 시 기존 월 분배(is_split)와 별도로,
               결제일 기준 매월 현금이 나가는 흐름을 payment_method의 billing 주기에 맞춰
               transaction_allocations에 추가 추적 (cash view에서 카드 결제일별 지출 반영) */}
          {paymentMethods.length > 0 && (
            <div className="space-y-2">
              <Label>{t("transaction.paymentMethod")}</Label>
              <Select
                value={paymentMethodId}
                onValueChange={(v) => setPaymentMethodId(v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("transaction.none")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("transaction.none")}</SelectItem>
                  {paymentMethods.map((pm) => (
                    <SelectItem key={pm.id} value={pm.id}>
                      {pm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {estimatedPaymentDate && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="h-3 w-3" />
                  <span>
                    {t("transaction.paymentDate")}: {estimatedPaymentDate}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="note">{t("transaction.note")}</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("transaction.notePlaceholder")}
              rows={2}
            />
          </div>

          {!isEditing && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isSplit"
                  checked={isSplit}
                  onCheckedChange={(checked) => setIsSplit(checked === true)}
                />
                <Label htmlFor="isSplit" className="cursor-pointer">
                  {t("transaction.splitDescription")}
                </Label>
              </div>

              {isSplit && (
                <SplitSettings
                  amount={Number(amount) || 0}
                  splitCount={splitCount}
                  startMonth={splitStartMonth}
                  currency={currency}
                  onSplitCountChange={setSplitCount}
                  onStartMonthChange={setSplitStartMonth}
                />
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? t("common.loading") : t("common.save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
