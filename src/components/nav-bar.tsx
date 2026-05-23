"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  BarChart3,
  TrendingUp,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/actions/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { href: "/transactions", icon: ArrowLeftRight, labelKey: "nav.transactions" },
  { href: "/budget", icon: PiggyBank, labelKey: "nav.budget" },
  { href: "/charts", icon: BarChart3, labelKey: "nav.charts" },
  { href: "/projection", icon: TrendingUp, labelKey: "nav.projection" },
] as const;

const settingsItems = [
  { href: "/settings/categories", labelKey: "nav.categories" },
  { href: "/settings/payment-methods", labelKey: "nav.paymentMethods" },
  { href: "/settings/account", labelKey: "nav.account" },
] as const;

export function NavBar() {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="text-lg font-bold">
          {t("app.name")}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {t(item.labelKey)}
          </Link>
        ))}

        <div className="pt-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase text-muted-foreground">
            {t("nav.settings")}
          </p>
          {settingsItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Settings className="h-4 w-4" />
              {t(item.labelKey)}
            </Link>
          ))}
        </div>
      </nav>

      <div className="border-t p-3">
        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
            {t("nav.logout")}
          </Button>
        </form>
      </div>
    </aside>
  );
}
