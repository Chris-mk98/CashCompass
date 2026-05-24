"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";

export function PdfExportForm() {
  const t = useTranslations();
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));

  function handleDownload() {
    window.open(`/api/export/pdf?year=${year}&month=${month}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("export.pdf")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>{t("export.period")}</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-[80px]"
            />
            <Input
              type="number"
              min={1}
              max={12}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-[60px]"
            />
          </div>
        </div>

        <Button onClick={handleDownload} className="w-full">
          <Download className="mr-2 h-4 w-4" />
          {t("export.downloadPdf")}
        </Button>
      </CardContent>
    </Card>
  );
}
