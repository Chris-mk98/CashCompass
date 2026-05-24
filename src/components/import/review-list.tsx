"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Category, PaymentMethod } from "@prisma/client";
import { Button } from "@/components/ui/button";
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
  ReviewItem,
  type ReviewTransaction,
} from "@/components/import/review-item";
import { bulkCreateTransactions } from "@/actions/import";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ReviewListProps {
  items: ReviewTransaction[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onBack: () => void;
}

export function ReviewList({
  items: initialItems,
  categories,
  paymentMethods,
  onBack,
}: ReviewListProps) {
  const t = useTranslations();
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleItemChange(updated: ReviewTransaction) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  function handleSelectAll(checked: boolean) {
    setItems((prev) => prev.map((i) => ({ ...i, selected: checked })));
  }

  function handleApplyPaymentMethod(pmId: string) {
    setPaymentMethodId(pmId);
  }

  async function handleImport() {
    const selected = items.filter((i) => i.selected);
    const invalid = selected.find((i) => !i.categoryId);
    if (invalid) {
      toast.error(t("import.missingCategory"));
      return;
    }

    setSubmitting(true);
    const payload = selected.map((i) => ({
      date: i.date,
      description: i.description,
      amount: i.amount,
      type: i.type,
      currency: i.currency,
      categoryId: i.categoryId,
      paymentMethodId: paymentMethodId || undefined,
    }));

    const result = await bulkCreateTransactions(payload);
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(
      t("import.imported", { count: String(result.count) })
    );
    router.push("/transactions");
  }

  const selectedCount = items.filter((i) => i.selected).length;
  const allSelected = items.length > 0 && selectedCount === items.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {t("import.reviewTitle", { count: String(items.length) })}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onBack}>
            {t("import.uploadAnother")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          {paymentMethods.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">
                {t("import.applyPaymentMethod")}
              </Label>
              <Select
                value={paymentMethodId || "__none__"}
                onValueChange={(v) =>
                  handleApplyPaymentMethod(v === "__none__" ? "" : (v ?? ""))
                }
              >
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    {t("transaction.none")}
                  </SelectItem>
                  {paymentMethods.map((pm) => (
                    <SelectItem key={pm.id} value={pm.id}>
                      {pm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => handleSelectAll(!allSelected)}
          >
            {allSelected ? t("import.deselectAll") : t("import.selectAll")}
          </Button>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <ReviewItem
              key={item.id}
              item={item}
              categories={categories}
              onChange={handleItemChange}
            />
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleImport}
            disabled={submitting || selectedCount === 0}
            className="flex-1"
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {t("import.importSelected", { count: String(selectedCount) })}
          </Button>
          <Button variant="outline" onClick={onBack}>
            {t("common.cancel")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
