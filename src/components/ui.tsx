import Link from "next/link";
import { addMonths } from "@/lib/dates";

export function won(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

export function Section({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="mb-4 rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Row({ label, value, sub, strong }: { label: React.ReactNode; value: React.ReactNode; sub?: React.ReactNode; strong?: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-3 border-b border-zinc-100 py-2 last:border-0 ${strong ? "font-semibold" : ""}`}>
      <div className="min-w-0">
        <div className="truncate">{label}</div>
        {sub && <div className="text-xs text-zinc-500">{sub}</div>}
      </div>
      <div className="shrink-0 text-right tabular-nums">{value}</div>
    </div>
  );
}

export function MonthNav({ month, path }: { month: string; path: string }) {
  const [y, m] = month.split("-");
  return (
    <div className="mb-4 flex items-center justify-between">
      <Link className="btn-sm" href={`${path}?m=${addMonths(month, -1)}`}>◀</Link>
      <span className="font-semibold">{y}년 {Number(m)}월</span>
      <Link className="btn-sm" href={`${path}?m=${addMonths(month, 1)}`}>▶</Link>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-2 text-sm text-zinc-500">{children}</p>;
}
