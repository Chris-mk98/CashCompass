"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Category } from "@prisma/client";
import { AlertTriangle } from "lucide-react";

export interface ReviewTransaction {
  id: string;
  selected: boolean;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  currency: string;
  categoryId: string;
  confidence: "high" | "low";
}

interface ReviewItemProps {
  item: ReviewTransaction;
  categories: Category[];
  onChange: (updated: ReviewTransaction) => void;
}

export function ReviewItem({ item, categories, onChange }: ReviewItemProps) {
  const t = useTranslations();
  const isLow = item.confidence === "low";
  const missingCategory = !item.categoryId;

  return (
    <div
      className={`rounded-md border p-3 space-y-2 ${
        isLow ? "border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10" : ""
      } ${!item.selected ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-2">
        <Checkbox
          checked={item.selected}
          onCheckedChange={(checked) =>
            onChange({ ...item, selected: checked === true })
          }
        />
        <span className="flex-1 text-sm font-medium truncate">
          {item.description}
        </span>
        {isLow && (
          <Badge variant="outline" className="text-yellow-600 border-yellow-400">
            <AlertTriangle className="mr-1 h-3 w-3" />
            {t("import.needsReview")}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Input
          type="date"
          value={item.date}
          onChange={(e) => onChange({ ...item, date: e.target.value })}
          className="h-8 text-xs"
        />
        <Input
          type="number"
          value={item.amount}
          onChange={(e) =>
            onChange({ ...item, amount: Number(e.target.value) || 0 })
          }
          className="h-8 text-xs"
        />
        <Select
          value={item.type}
          onValueChange={(v) =>
            v && onChange({ ...item, type: v as "income" | "expense" })
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">{t("transaction.expense")}</SelectItem>
            <SelectItem value="income">{t("transaction.income")}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={item.categoryId || "__none__"}
          onValueChange={(v) =>
            onChange({
              ...item,
              categoryId: v === "__none__" ? "" : (v ?? ""),
            })
          }
        >
          <SelectTrigger
            className={`h-8 text-xs ${missingCategory ? "border-destructive" : ""}`}
          >
            <SelectValue placeholder={t("transaction.category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">—</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Input
        value={item.description}
        onChange={(e) => onChange({ ...item, description: e.target.value })}
        placeholder={t("transaction.notePlaceholder")}
        className="h-8 text-xs"
      />
    </div>
  );
}
