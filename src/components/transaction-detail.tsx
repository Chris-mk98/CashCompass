"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Prisma } from "@prisma/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { deleteTransaction, updateSplitAmount } from "@/actions/transactions";
import { getReceiptUrl } from "@/actions/receipts";
import { ReceiptUpload } from "@/components/receipt-upload";
import { toast } from "sonner";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";

type TransactionWithRelations = Prisma.TransactionGetPayload<{
  include: {
    category: { select: { id: true; name: true } };
    paymentMethod: { select: { id: true; name: true; type: true } };
    allocations: true;
  };
}>;

interface TransactionDetailProps {
  transaction: TransactionWithRelations | null;
  open: boolean;
  onClose: () => void;
}

export function TransactionDetail({
  transaction,
  open,
  onClose,
}: TransactionDetailProps) {
  const t = useTranslations();
  const router = useRouter();
  const [splitEditOpen, setSplitEditOpen] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [splitEditMode, setSplitEditMode] = useState<"all" | "future">("all");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    if (transaction?.receiptPath) {
      getReceiptUrl(transaction.receiptPath).then(setReceiptUrl);
    } else {
      setReceiptUrl(null);
    }
  }, [transaction?.receiptPath]);

  if (!transaction) return null;

  const amount = Number(transaction.amount);
  const cur = transaction.currency;
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: cur === "KRW" ? 0 : 2,
    }).format(value);

  async function handleDelete() {
    const result = await deleteTransaction(transaction!.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("transaction.deleted"));
      onClose();
    }
  }

  async function handleSplitAmountEdit() {
    const num = Number(newAmount);
    if (!num || num <= 0) return;
    const result = await updateSplitAmount(
      transaction!.id,
      num,
      splitEditMode
    );
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("transaction.updated"));
      setSplitEditOpen(false);
    }
  }

  function handleEdit() {
    onClose();
    router.push(`/transactions/${transaction!.id}/edit`);
  }

  const DetailRow = ({
    label,
    value,
  }: {
    label: string;
    value: React.ReactNode;
  }) => (
    <div className="flex justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("transaction.detail")}</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="text-center">
              <Badge variant={transaction.type === "income" ? "default" : "secondary"}>
                {t(`transaction.${transaction.type}`)}
              </Badge>
              <p
                className={`mt-2 text-2xl font-bold ${
                  transaction.type === "income" ? "text-blue-600" : ""
                }`}
              >
                {transaction.type === "income" ? "+" : "-"}
                {formatCurrency(amount)}
              </p>
              {!transaction.confirmedAt && (
                <Badge variant="outline" className="mt-1">
                  {t("transaction.pending")}
                </Badge>
              )}
            </div>

            <Separator />

            <div className="divide-y">
              <DetailRow
                label={t("transaction.category")}
                value={transaction.category.name}
              />
              <DetailRow
                label={t("transaction.date")}
                value={format(transaction.transactionDate, "yyyy-MM-dd")}
              />
              <DetailRow
                label={t("transaction.paymentDate")}
                value={format(transaction.paymentDate, "yyyy-MM-dd")}
              />
              {transaction.paymentMethod && (
                <DetailRow
                  label={t("transaction.paymentMethod")}
                  value={transaction.paymentMethod.name}
                />
              )}
              {transaction.note && (
                <DetailRow
                  label={t("transaction.note")}
                  value={transaction.note}
                />
              )}
            </div>

            {transaction.isSplit && transaction.allocations.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">
                      {t("transaction.splitDetail")} ({transaction.splitCount}
                      {t("transaction.splitMonths")})
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNewAmount(String(amount));
                        setSplitEditOpen(true);
                      }}
                    >
                      {t("transaction.splitAmountEdit")}
                    </Button>
                  </div>
                  <div className="rounded-md border">
                    {transaction.allocations.map((alloc) => (
                      <div
                        key={alloc.id}
                        className="flex justify-between border-b px-3 py-2 last:border-0"
                      >
                        <span className="text-sm text-muted-foreground">
                          {format(alloc.recognitionMonth, "yyyy-MM")}
                        </span>
                        <span className="text-sm font-medium">
                          {formatCurrency(Number(alloc.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium">{t("receipt.title")}</p>
              <ReceiptUpload
                transactionId={transaction.id}
                receiptUrl={receiptUrl}
              />
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleEdit}
              >
                <Pencil className="mr-2 h-4 w-4" />
                {t("common.edit")}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger
                  render={<Button variant="destructive" className="flex-1" />}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("common.delete")}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("transaction.deleteConfirm")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("transaction.deleteDescription")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      {t("common.delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={splitEditOpen} onOpenChange={setSplitEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("transaction.splitAmountEdit")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("transaction.newAmount")}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("transaction.splitAmountEdit")}</Label>
              <Select
                value={splitEditMode}
                onValueChange={(v) => v && setSplitEditMode(v as "all" | "future")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("transaction.splitEditAll")}
                  </SelectItem>
                  <SelectItem value="future">
                    {t("transaction.splitEditFuture")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleSplitAmountEdit}>
                {t("common.save")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSplitEditOpen(false)}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
