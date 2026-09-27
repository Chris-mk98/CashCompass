// 모든 날짜는 "YYYY-MM-DD" 문자열로 다룬다 (타임존 문제 방지).

export function ymd(year: number, month: number, day: number): string {
  // month는 1부터 시작. 범위를 넘으면 Date.UTC가 연/월을 넘겨준다.
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

export function parse(date: string): [number, number, number] {
  const [y, m, d] = date.split("-").map(Number);
  return [y, m, d];
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = parse(date);
  return ymd(y, m, d + days);
}

export function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  return ymd(y, m + n, 1).slice(0, 7);
}

export function todayKST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

export function toDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

export function fromDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
