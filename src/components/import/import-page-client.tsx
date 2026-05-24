"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Category, PaymentMethod } from "@prisma/client";
import { ImageUpload } from "@/components/import/image-upload";
import { ReviewList } from "@/components/import/review-list";
import type { ReviewTransaction } from "@/components/import/review-item";
import type { ExtractedTransaction } from "@/lib/validations/import";
import { matchCategory } from "@/lib/ai/category-matcher";

interface ImportPageClientProps {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  defaultCurrency: string;
}

export function ImportPageClient({
  categories,
  paymentMethods,
  defaultCurrency,
}: ImportPageClientProps) {
  const t = useTranslations();
  const [reviewItems, setReviewItems] = useState<ReviewTransaction[] | null>(
    null
  );

  function handleAnalyzed(raw: unknown[]) {
    const items: ReviewTransaction[] = (raw as ExtractedTransaction[]).map(
      (tx, i) => {
        const catId =
          matchCategory(
            tx.description,
            categories.map((c) => ({ id: c.id, name: c.name }))
          ) ?? "";

        return {
          id: `import-${i}`,
          selected: true,
          date: tx.date,
          description: tx.description,
          amount: tx.amount,
          type: tx.type,
          currency: tx.currency || defaultCurrency,
          categoryId: catId,
          confidence: tx.confidence,
        };
      }
    );
    setReviewItems(items);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("import.title")}</h1>

      {reviewItems ? (
        <ReviewList
          items={reviewItems}
          categories={categories}
          paymentMethods={paymentMethods}
          onBack={() => setReviewItems(null)}
        />
      ) : (
        <ImageUpload onAnalyzed={handleAnalyzed} />
      )}
    </div>
  );
}
