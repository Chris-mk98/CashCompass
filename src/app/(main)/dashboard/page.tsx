import { useTranslations } from "next-intl";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("dashboard.accrual")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.noData")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.cash")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.noData")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Link
          href="/transactions/new"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("dashboard.addTransaction")}
        </Link>
        <Link
          href="/import"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          <Upload className="mr-2 h-4 w-4" />
          {t("dashboard.smartImport")}
        </Link>
      </div>
    </div>
  );
}
