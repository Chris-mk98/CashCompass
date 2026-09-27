"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { toDate } from "@/lib/dates";
import { AUTH_COOKIE, authToken } from "@/lib/auth";
import { CORP_RECEIVABLE } from "@/lib/data";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const int = (f: FormData, k: string) => {
  const n = Number(str(f, k).replaceAll(",", ""));
  if (!Number.isInteger(n) || n <= 0) throw new Error(`${k} 값이 올바르지 않습니다`);
  return n;
};
const date = (f: FormData, k = "date") => toDate(str(f, k));
const memo = (f: FormData) => str(f, "memo") || null;

async function corpReceivableId() {
  return (await prisma.account.findUniqueOrThrow({ where: { name: CORP_RECEIVABLE } })).id;
}

function done(path = "/") {
  revalidatePath("/", "layout");
  redirect(path);
}

export async function login(formData: FormData) {
  const password = str(formData, "password");
  if (password !== process.env.APP_PASSWORD) redirect("/login?error=1");
  (await cookies()).set(AUTH_COOKIE, await authToken(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/");
}

// 카드 사용: 개인카드는 비용 / 카드 미지급금, 법인카드는 법인카드 미수금 / 법인카드 미지급금
export async function addCardUse(formData: FormData) {
  const card = await prisma.card.findUniqueOrThrow({ where: { id: int(formData, "cardId") } });
  const debitAccountId =
    card.kind === "CORPORATE" ? await corpReceivableId() : int(formData, "categoryId");
  await prisma.entry.create({
    data: {
      date: date(formData),
      kind: "CARD_USE",
      debitAccountId,
      creditAccountId: card.payableAccountId,
      amount: int(formData, "amount"),
      memo: memo(formData),
      cardId: card.id,
    },
  });
  done(`/new?type=card&cardId=${card.id}&ok=1`);
}

export async function addIncome(formData: FormData) {
  await prisma.entry.create({
    data: {
      date: date(formData),
      kind: "INCOME",
      debitAccountId: int(formData, "bankAccountId"),
      creditAccountId: int(formData, "incomeAccountId"),
      amount: int(formData, "amount"),
      memo: memo(formData),
    },
  });
  done("/new?type=income&ok=1");
}

export async function addGeneral(formData: FormData) {
  const debitAccountId = int(formData, "debitAccountId");
  const creditAccountId = int(formData, "creditAccountId");
  if (debitAccountId === creditAccountId) throw new Error("차변과 대변 계정이 같습니다");
  await prisma.entry.create({
    data: {
      date: date(formData),
      kind: "GENERAL",
      debitAccountId,
      creditAccountId,
      amount: int(formData, "amount"),
      memo: memo(formData),
    },
  });
  done("/new?type=general&ok=1");
}

async function corpUse(formData: FormData) {
  const use = await prisma.entry.findUniqueOrThrow({
    where: { id: int(formData, "entryId") },
    include: { card: true, settledBy: true },
  });
  if (use.card?.kind !== "CORPORATE" || use.kind !== "CARD_USE") throw new Error("법인카드 사용 건이 아닙니다");
  if (use.settledBy) throw new Error("이미 정산된 건입니다");
  return use;
}

// 법인카드 승인 입금: 은행 / 법인카드 미수금
export async function reimburseCorp(formData: FormData) {
  const use = await corpUse(formData);
  await prisma.entry.create({
    data: {
      date: date(formData),
      kind: "CORP_REIMBURSE",
      debitAccountId: int(formData, "bankAccountId"),
      creditAccountId: use.debitAccountId,
      amount: use.amount,
      memo: use.memo,
      settlesEntryId: use.id,
    },
  });
  done("/corp");
}

// 법인카드 미승인 → 개인비용: 비용 / 법인카드 미수금 (사용일 기준으로 비용 인식)
export async function corpToPersonal(formData: FormData) {
  const use = await corpUse(formData);
  await prisma.entry.create({
    data: {
      date: use.date,
      kind: "CORP_TO_PERSONAL",
      debitAccountId: int(formData, "categoryId"),
      creditAccountId: use.debitAccountId,
      amount: use.amount,
      memo: use.memo,
      settlesEntryId: use.id,
    },
  });
  done("/corp");
}

// 카드대금 출금: 카드 미지급금 / 결제 계좌
export async function payStatement(formData: FormData) {
  const card = await prisma.card.findUniqueOrThrow({ where: { id: int(formData, "cardId") } });
  await prisma.entry.create({
    data: {
      date: date(formData),
      kind: "CARD_PAYMENT",
      debitAccountId: card.payableAccountId,
      creditAccountId: card.bankAccountId,
      amount: int(formData, "amount"),
      memo: `${card.name} 대금`,
      cardId: card.id,
      statementDue: date(formData, "due"),
    },
  });
  done(`/cash?m=${str(formData, "due").slice(0, 7)}`);
}

export async function deleteEntry(formData: FormData) {
  const id = int(formData, "id");
  const settledBy = await prisma.entry.findUnique({ where: { settlesEntryId: id } });
  if (settledBy) redirect(`/entries?error=${encodeURIComponent("정산(승인 입금/개인비용 전환) 기록을 먼저 삭제하세요")}`);
  await prisma.entry.delete({ where: { id } });
  done(`/entries?m=${str(formData, "m")}`);
}

export async function updateCard(formData: FormData) {
  const day = (k: string, max: number) => {
    const n = int(formData, k);
    if (n > max) throw new Error(`${k}는 ${max} 이하여야 합니다`);
    return n;
  };
  await prisma.card.update({
    where: { id: int(formData, "id") },
    data: {
      cycleStartDay: day("cycleStartDay", 28),
      paymentDay: day("paymentDay", 31),
      paymentMonthOffset: Number(str(formData, "paymentMonthOffset")),
      bankAccountId: int(formData, "bankAccountId"),
    },
  });
  done("/settings");
}

export async function addAccount(formData: FormData) {
  const type = str(formData, "type");
  if (type !== "EXPENSE" && type !== "INCOME") throw new Error("잘못된 계정 유형");
  const name = str(formData, "name");
  if (!name) throw new Error("이름을 입력하세요");
  const max = await prisma.account.aggregate({ _max: { sortOrder: true } });
  await prisma.account.create({ data: { name, type, sortOrder: (max._max.sortOrder ?? 0) + 1 } });
  done("/settings");
}
