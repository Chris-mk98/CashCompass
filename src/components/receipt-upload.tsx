"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { uploadReceipt, deleteReceipt } from "@/actions/receipts";
import { toast } from "sonner";
import { ImagePlus, Trash2, Loader2 } from "lucide-react";

interface ReceiptUploadProps {
  transactionId: string;
  receiptUrl?: string | null;
  onUpdate?: () => void;
}

export function ReceiptUpload({
  transactionId,
  receiptUrl,
  onUpdate,
}: ReceiptUploadProps) {
  const t = useTranslations();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    receiptUrl ?? null
  );

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.set("receipt", file);
    const result = await uploadReceipt(transactionId, fd);
    setUploading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    toast.success(t("receipt.uploaded"));
    onUpdate?.();
  }

  async function handleDelete() {
    setUploading(true);
    const result = await deleteReceipt(transactionId);
    setUploading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setPreviewUrl(null);
    toast.success(t("receipt.deleted"));
    onUpdate?.();
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/heif"
        className="hidden"
        onChange={handleFileChange}
      />

      {previewUrl ? (
        <div className="space-y-2">
          <img
            src={previewUrl}
            alt={t("receipt.title")}
            className="max-h-48 rounded-md border object-contain"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImagePlus className="mr-1 h-3.5 w-3.5" />
              )}
              {t("receipt.replace")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={handleDelete}
              disabled={uploading}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              {t("receipt.delete")}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImagePlus className="mr-1 h-3.5 w-3.5" />
          )}
          {t("receipt.upload")}
        </Button>
      )}
    </div>
  );
}
