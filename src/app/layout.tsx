import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: "CashCompass" };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const nav = [
  ["/", "홈"],
  ["/new", "입력"],
  ["/pnl", "손익"],
  ["/cash", "현금"],
  ["/corp", "법인"],
  ["/entries", "분개장"],
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-zinc-100 text-zinc-900">
        <header className="flex items-center justify-between px-4 pt-4">
          <Link href="/" className="text-lg font-bold">CashCompass</Link>
          <Link href="/settings" className="text-sm text-zinc-500">설정</Link>
        </header>
        <main className="mx-auto max-w-xl px-4 pb-24 pt-3">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 border-t border-zinc-200 bg-white">
          <div className="mx-auto grid max-w-xl grid-cols-6">
            {nav.map(([href, label]) => (
              <Link key={href} href={href} className="py-3 text-center text-sm">{label}</Link>
            ))}
          </div>
        </nav>
      </body>
    </html>
  );
}
