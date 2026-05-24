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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createPaymentMethod,
  updatePaymentMethod,
} from "@/actions/payment-methods";
import { toast } from "sonner";

interface PaymentMethodFormProps {
  initialData?: {
    id: string;
    type: string;
    name: string;
    billingStartDay: number | null;
    billingEndDay: number | null;
    paymentDay: number | null;
    paymentMonthOffset: number | null;
  };
  onDone?: () => void;
}

export function PaymentMethodForm({
  initialData,
  onDone,
}: PaymentMethodFormProps) {
  const t = useTranslations();
  const isEditing = !!initialData;

  const [type, setType] = useState(initialData?.type ?? "credit_card");
  const [name, setName] = useState(initialData?.name ?? "");
  const [billingStartDay, setBillingStartDay] = useState(
    String(initialData?.billingStartDay ?? 1)
  );
  const [billingEndDay, setBillingEndDay] = useState(
    String(initialData?.billingEndDay ?? 0)
  );
  const [paymentDay, setPaymentDay] = useState(
    String(initialData?.paymentDay ?? 25)
  );
  const [paymentMonthOffset, setPaymentMonthOffset] = useState(
    String(initialData?.paymentMonthOffset ?? 1)
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const fd = new FormData();
    if (initialData) fd.set("id", initialData.id);
    fd.set("type", type);
    fd.set("name", name);

    if (type === "credit_card") {
      fd.set("billingStartDay", billingStartDay);
      fd.set("billingEndDay", billingEndDay);
      fd.set("paymentDay", paymentDay);
      fd.set("paymentMonthOffset", paymentMonthOffset);
    }

    const result = isEditing
      ? await updatePaymentMethod(fd)
      : await createPaymentMethod(fd);

    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if ("recalculatedCount" in result && result.recalculatedCount) {
      toast.success(
        t("paymentMethod.recalculated", {
          count: String(result.recalculatedCount),
        })
      );
    } else {
      toast.success(
        isEditing ? t("paymentMethod.updated") : t("paymentMethod.added")
      );
    }

    if (!isEditing) {
      setName("");
      setBillingStartDay("1");
      setBillingEndDay("0");
      setPaymentDay("25");
      setPaymentMonthOffset("1");
    }

    onDone?.();
  }

  const billingEndLabel =
    billingEndDay === "0"
      ? t("paymentMethod.endOfMonth")
      : `${billingEndDay}일`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {isEditing ? t("paymentMethod.edit") : t("paymentMethod.add")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("transaction.type")}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === "credit_card" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setType("credit_card")}
              >
                {t("paymentMethod.creditCard")}
              </Button>
              <Button
                type="button"
                variant={type === "bank_account" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setType("bank_account")}
              >
                {t("paymentMethod.bankAccount")}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pmName">{t("paymentMethod.name")}</Label>
            <Input
              id="pmName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("paymentMethod.namePlaceholder")}
              required
            />
          </div>

          {type === "credit_card" && (
            <>
              <div className="space-y-2">
                <Label>{t("paymentMethod.billingPeriod")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      {t("paymentMethod.billingStart")}
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={billingStartDay}
                      onChange={(e) => setBillingStartDay(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      {t("paymentMethod.billingEnd")} (0={t("paymentMethod.endOfMonth")})
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={31}
                      value={billingEndDay}
                      onChange={(e) => setBillingEndDay(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("paymentMethod.paymentDay")}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={paymentDay}
                    onChange={(e) => setPaymentDay(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("paymentMethod.paymentOffset")}</Label>
                  <Select
                    value={paymentMonthOffset}
                    onValueChange={(v) => v && setPaymentMonthOffset(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">
                        {t("paymentMethod.sameMonth")}
                      </SelectItem>
                      <SelectItem value="1">
                        {t("paymentMethod.nextMonth")}
                      </SelectItem>
                      <SelectItem value="2">
                        {t("paymentMethod.twoMonthsLater")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? t("common.loading") : t("common.save")}
            </Button>
            {onDone && (
              <Button type="button" variant="outline" onClick={onDone}>
                {t("common.cancel")}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
