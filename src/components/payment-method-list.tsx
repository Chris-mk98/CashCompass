"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PaymentMethodForm } from "@/components/payment-method-form";
import { deletePaymentMethod } from "@/actions/payment-methods";
import type { PaymentMethodWithUsage } from "@/queries/payment-methods";
import { toast } from "sonner";
import { CreditCard, Landmark, Pencil, Trash2 } from "lucide-react";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KRW" ? 0 : 2,
  }).format(amount);
}

function billingPeriodLabel(pm: PaymentMethodWithUsage): string {
  if (pm.type !== "credit_card") return "";
  const end = pm.billingEndDay === 0 ? "말일" : `${pm.billingEndDay}일`;
  return `${pm.billingStartDay}일~${end}`;
}

export function PaymentMethodList({
  methods,
}: {
  methods: PaymentMethodWithUsage[];
}) {
  const t = useTranslations();
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const result = await deletePaymentMethod(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("paymentMethod.deleted"));
    }
  }

  if (methods.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t("common.noData")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {methods.map((pm) =>
        editingId === pm.id ? (
          <PaymentMethodForm
            key={pm.id}
            initialData={pm}
            onDone={() => setEditingId(null)}
          />
        ) : (
          <Card key={pm.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3 min-w-0">
                {pm.type === "credit_card" ? (
                  <CreditCard className="h-5 w-5 shrink-0 text-muted-foreground" />
                ) : (
                  <Landmark className="h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{pm.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {pm.type === "credit_card"
                        ? t("paymentMethod.creditCard")
                        : t("paymentMethod.bankAccount")}
                    </Badge>
                  </div>
                  {pm.type === "credit_card" && (
                    <p className="text-xs text-muted-foreground">
                      {t("paymentMethod.billingPeriod")}: {billingPeriodLabel(pm)} ·{" "}
                      {t("paymentMethod.paymentDay")}: {pm.paymentDay}일
                    </p>
                  )}
                  {pm.currentMonthUsage > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {t("paymentMethod.currentUsage")}:{" "}
                      {formatCurrency(pm.currentMonthUsage, pm.currency)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setEditingId(pm.id)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                      />
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("paymentMethod.deleteConfirm")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("paymentMethod.deleteDescription")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t("common.cancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(pm.id)}>
                        {t("common.delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
