"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category, PaymentMethod } from "@prisma/client";
import { Search, X } from "lucide-react";

interface TransactionFiltersProps {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  year: number;
  month: number;
}

export function TransactionFilters({
  categories,
  paymentMethods,
  year,
  month,
}: TransactionFiltersProps) {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [categoryId, setCategoryId] = useState(
    searchParams.get("category") ?? ""
  );
  const [paymentMethodId, setPaymentMethodId] = useState(
    searchParams.get("pm") ?? ""
  );
  const [amountMin, setAmountMin] = useState(
    searchParams.get("min") ?? ""
  );
  const [amountMax, setAmountMax] = useState(
    searchParams.get("max") ?? ""
  );
  const [view, setView] = useState(searchParams.get("view") ?? "accrual");

  function applyFilters(overrides?: Record<string, string>) {
    const params = new URLSearchParams();
    params.set("year", String(year));
    params.set("month", String(month));

    const q = overrides?.q ?? search;
    const cat = overrides?.category ?? categoryId;
    const pm = overrides?.pm ?? paymentMethodId;
    const min = overrides?.min ?? amountMin;
    const max = overrides?.max ?? amountMax;
    const v = overrides?.view ?? view;

    if (q) params.set("q", q);
    if (cat) params.set("category", cat);
    if (pm) params.set("pm", pm);
    if (min) params.set("min", min);
    if (max) params.set("max", max);
    if (v !== "accrual") params.set("view", v);

    router.push(`/transactions?${params.toString()}`);
  }

  function clearFilters() {
    setSearch("");
    setCategoryId("");
    setPaymentMethodId("");
    setAmountMin("");
    setAmountMax("");
    setView("accrual");
    router.push(`/transactions?year=${year}&month=${month}`);
  }

  const hasFilters =
    search || categoryId || paymentMethodId || amountMin || amountMax || view !== "accrual";

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            placeholder={t("filters.searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <Select
          value={categoryId || "__all__"}
          onValueChange={(v) => {
            const val = v === "__all__" ? "" : (v ?? "");
            setCategoryId(val);
            applyFilters({ category: val });
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t("transaction.category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">
              {t("filters.allCategories")}
            </SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        {paymentMethods.length > 0 && (
          <Select
            value={paymentMethodId || "__all__"}
            onValueChange={(v) => {
              const val = v === "__all__" ? "" : (v ?? "");
              setPaymentMethodId(val);
              applyFilters({ pm: val });
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t("transaction.paymentMethod")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">
                {t("filters.allPaymentMethods")}
              </SelectItem>
              {paymentMethods.map((pm) => (
                <SelectItem key={pm.id} value={pm.id}>
                  {pm.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Input
          type="number"
          min="0"
          value={amountMin}
          onChange={(e) => setAmountMin(e.target.value)}
          onBlur={() => applyFilters()}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          placeholder={t("filters.amountMin")}
          className="w-[110px]"
        />
        <span className="flex items-center text-muted-foreground">~</span>
        <Input
          type="number"
          min="0"
          value={amountMax}
          onChange={(e) => setAmountMax(e.target.value)}
          onBlur={() => applyFilters()}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          placeholder={t("filters.amountMax")}
          className="w-[110px]"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border p-0.5">
          <Button
            size="sm"
            variant={view === "accrual" ? "default" : "ghost"}
            className="h-7 text-xs"
            onClick={() => {
              setView("accrual");
              applyFilters({ view: "accrual" });
            }}
          >
            {t("dashboard.accrual")}
          </Button>
          <Button
            size="sm"
            variant={view === "cash" ? "default" : "ghost"}
            className="h-7 text-xs"
            onClick={() => {
              setView("cash");
              applyFilters({ view: "cash" });
            }}
          >
            {t("dashboard.cash")}
          </Button>
        </div>

        {hasFilters && (
          <Button
            size="sm"
            variant="ghost"
            onClick={clearFilters}
            className="h-7 text-xs"
          >
            <X className="mr-1 h-3 w-3" />
            {t("filters.clear")}
          </Button>
        )}
      </div>
    </div>
  );
}
