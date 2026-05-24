"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePlus, Loader2, Upload } from "lucide-react";

interface ImageUploadProps {
  onAnalyzed: (transactions: unknown[]) => void;
}

export function ImageUpload({ onAnalyzed }: ImageUploadProps) {
  const t = useTranslations();
  const fileRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);

      if (!["image/jpeg", "image/png"].includes(file.type)) {
        setError(t("import.invalidType"));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(t("import.tooLarge"));
        return;
      }

      setPreview(URL.createObjectURL(file));
      setProcessing(true);

      const fd = new FormData();
      fd.set("image", file);

      try {
        const res = await fetch("/api/import/analyze", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || t("import.analysisFailed"));
          setProcessing(false);
          return;
        }

        if (!data.transactions || data.transactions.length === 0) {
          setError(t("import.noTransactions"));
          setProcessing(false);
          return;
        }

        onAnalyzed(data.transactions);
      } catch {
        setError(t("import.analysisFailed"));
      } finally {
        setProcessing(false);
      }
    },
    [onAnalyzed, t]
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleFileChange}
          />

          {processing ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-medium">{t("import.analyzing")}</p>
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="mt-2 max-h-32 rounded-md opacity-50"
                />
              )}
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-1">
                {t("import.dragDrop")}
              </p>
              <Button
                variant="outline"
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus className="mr-2 h-4 w-4" />
                {t("import.selectFile")}
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                JPG, PNG · {t("import.maxSize")}
              </p>
            </>
          )}

          {error && (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
