"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Category } from "@prisma/client";
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
import { Download } from "lucide-react";

interface CsvExportFormProps {
  categories: Category[];
}

export function CsvExportForm({ categories }: CsvExportFormProps) {
  const t = useTranslations();
  const now = new Date();
  const [startYear, setStartYear] = useState(String(now.getFullYear()));
  const [startMonth, setStartMonth] = useState("1");
  const [endYear, setEndYear] = useState(String(now.getFullYear()));
  const [endMonth, setEndMonth] = useState(String(now.getMonth() + 1));
  const [categoryId, setCategoryId] = useState("");

  function handleDownload() {
    const params = new URLSearchParams({
      startYear,
      startMonth,
      endYear,
      endMonth,
    });
    if (categoryId) params.set("category", categoryId);
    window.open(`/api/export/csv?${params.toString()}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("export.csv")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("export.startPeriod")}</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                className="w-[80px]"
              />
              <Input
                type="number"
                min={1}
                max={12}
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                className="w-[60px]"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("export.endPeriod")}</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
                className="w-[80px]"
              />
              <Input
                type="number"
                min={1}
                max={12}
                value={endMonth}
                onChange={(e) => setEndMonth(e.target.value)}
                className="w-[60px]"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("transaction.category")}</Label>
          <Select
            value={categoryId || "__all__"}
            onValueChange={(v) => setCategoryId(v === "__all__" ? "" : (v ?? ""))}
          >
            <SelectTrigger>
              <SelectValue />
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

        <Button onClick={handleDownload} className="w-full">
          <Download className="mr-2 h-4 w-4" />
          {t("export.downloadCsv")}
        </Button>
      </CardContent>
    </Card>
  );
}
