"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  BarChart3,
  Menu,
  TrendingUp,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { logout } from "@/actions/auth";
import { cn } from "@/lib/utils";

const tabItems = [
  { href: "/dashboard", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { href: "/transactions", icon: ArrowLeftRight, labelKey: "nav.transactions" },
  { href: "/budget", icon: PiggyBank, labelKey: "nav.budget" },
  { href: "/charts", icon: BarChart3, labelKey: "nav.charts" },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <>
      {/* Top bar */}
      <header className="flex h-14 items-center justify-between border-b bg-card px-4 md:hidden">
        <Link href="/dashboard" className="text-lg font-bold">
          {t("app.name")}
        </Link>
        <Sheet>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" />}
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <SheetHeader>
              <SheetTitle>{t("nav.settings")}</SheetTitle>
            </SheetHeader>
            <nav className="mt-4 space-y-1 px-4">
              <Link
                href="/projection"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
              >
                <TrendingUp className="h-4 w-4" />
                {t("nav.projection")}
              </Link>
              <Link
                href="/settings/categories"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
              >
                <Settings className="h-4 w-4" />
                {t("nav.categories")}
              </Link>
              <Link
                href="/settings/payment-methods"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
              >
                <Settings className="h-4 w-4" />
                {t("nav.paymentMethods")}
              </Link>
              <Link
                href="/settings/account"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
              >
                <Settings className="h-4 w-4" />
                {t("nav.account")}
              </Link>
              <form action={logout} className="pt-2 border-t">
                <Button
                  type="submit"
                  variant="ghost"
                  className="w-full justify-start gap-3 text-muted-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  {t("nav.logout")}
                </Button>
              </form>
            </nav>
          </SheetContent>
        </Sheet>
      </header>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card md:hidden">
        <div className="flex h-16 items-center justify-around">
          {tabItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors",
                pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{t(item.labelKey)}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
