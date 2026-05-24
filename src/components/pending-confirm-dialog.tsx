"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  confirmPendingTransaction,
  deleteTransaction,
} from "@/actions/transactions";
import { toast } from "sonner";
import { format } from "date-fns";
import { Check, Pencil, Trash2 } from "lucide-react";
import type { PendingTransaction } from "@/queries/dashboard";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KRW" ? 0 : 2,
  }).format(amount);
}

export function PendingConfirmDialog({
  transaction,
  open,
  onClose,
}: {
  transaction: PendingTransaction | null;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations();
  const router = useRouter();

  if (!transaction) return null;

  async function handleConfirm() {
    const result = await confirmPendingTransaction(transaction!.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("dashboard.pendingConfirmed"));
      onClose();
    }
  }

  async function handleDelete() {
    const result = await deleteTransaction(transaction!.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("transaction.deleted"));
      onClose();
    }
  }

  function handleEdit() {
    onClose();
    router.push(`/transactions/${transaction!.id}/edit`);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dashboard.pendingConfirmTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-center">
            <p className="text-2xl font-bold">
              {transaction.type === "income" ? "+" : "-"}
              {formatCurrency(transaction.amount, transaction.currency)}
            </p>
            <p className="text-sm text-muted-foreground">
              {transaction.note || transaction.categoryName} ·{" "}
              {format(transaction.transactionDate, "yyyy-MM-dd")}
            </p>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-2">
            <Button onClick={handleConfirm} className="flex-col h-auto py-3">
              <Check className="mb-1 h-5 w-5" />
              <span className="text-xs">{t("dashboard.pendingActionConfirm")}</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleEdit}
              className="flex-col h-auto py-3"
            >
              <Pencil className="mb-1 h-5 w-5" />
              <span className="text-xs">{t("common.edit")}</span>
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex-col h-auto py-3"
            >
              <Trash2 className="mb-1 h-5 w-5" />
              <span className="text-xs">{t("common.delete")}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
