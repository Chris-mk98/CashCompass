"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setBudget, deleteBudget } from "@/actions/budgets";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface BudgetEditInlineProps {
  categoryId: string;
  categoryName: string;
  currentLimit?: number;
  currency: string;
  onDone: () => void;
}

export function BudgetEditInline({
  categoryId,
  categoryName,
  currentLimit,
  currency,
  onDone,
}: BudgetEditInlineProps) {
  const t = useTranslations();
  const [limit, setLimit] = useState(currentLimit?.toString() ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    if (!limit || Number(limit) <= 0) return;
    setSubmitting(true);
    const fd = new FormData();
    fd.set("categoryId", categoryId);
    fd.set("monthlyLimit", limit);
    fd.set("currency", currency);
    const result = await setBudget(fd);
    setSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(t("budget.saved"));
    onDone();
  }

  async function handleDelete() {
    setSubmitting(true);
    const fd = new FormData();
    fd.set("categoryId", categoryId);
    const result = await deleteBudget(fd);
    setSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(t("budget.deleted"));
    onDone();
  }

  return (
    <div className="flex items-center gap-2 py-1">
      <span className="min-w-[80px] text-sm font-medium truncate">
        {categoryName}
      </span>
      <Input
        type="number"
        min="0"
        step="1"
        value={limit}
        onChange={(e) => setLimit(e.target.value)}
        placeholder={t("budget.monthlyLimit")}
        className="w-[140px] h-8 text-sm"
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
      />
      <Button
        size="sm"
        className="h-8"
        onClick={handleSave}
        disabled={submitting || !limit}
      >
        {t("common.save")}
      </Button>
      {currentLimit !== undefined && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 text-destructive"
          onClick={handleDelete}
          disabled={submitting}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        className="h-8"
        onClick={onDone}
        disabled={submitting}
      >
        {t("common.cancel")}
      </Button>
    </div>
  );
}
