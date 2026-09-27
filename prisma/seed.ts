import { PrismaClient, AccountType } from "@prisma/client";

const prisma = new PrismaClient();

const accounts: [string, AccountType, boolean?][] = [
  ["신한은행", "ASSET", true],
  ["농협은행", "ASSET", true],
  ["법인카드 미수금", "ASSET"],
  ["KB 마이너스통장", "LIABILITY", true],
  ["신한카드 미지급금", "LIABILITY"],
  ["농협카드 미지급금", "LIABILITY"],
  ["법인카드 미지급금", "LIABILITY"],
  ["기초순자산", "EQUITY"],
  ["급여", "INCOME"],
  ["용돈", "INCOME"],
  ["기타수입", "INCOME"],
  ["식비", "EXPENSE"],
  ["카페/간식", "EXPENSE"],
  ["교통", "EXPENSE"],
  ["쇼핑", "EXPENSE"],
  ["생활", "EXPENSE"],
  ["통신", "EXPENSE"],
  ["의료", "EXPENSE"],
  ["문화/여가", "EXPENSE"],
  ["경조사", "EXPENSE"],
  ["이자비용", "EXPENSE"],
  ["기타지출", "EXPENSE"],
];

async function main() {
  for (const [i, [name, type, isCash]] of accounts.entries()) {
    await prisma.account.upsert({
      where: { name },
      update: {},
      create: { name, type, isCash: isCash ?? false, sortOrder: i },
    });
  }
  const id = async (name: string) =>
    (await prisma.account.findUniqueOrThrow({ where: { name } })).id;

  const cards = [
    // 12일~다음 달 11일 사용 → 종료월 25일 출금 (신한은행)
    { name: "신한카드", kind: "PERSONAL", cycleStartDay: 12, paymentDay: 25, paymentMonthOffset: 0, payable: "신한카드 미지급금", bank: "신한은행" },
    // 18일~다음 달 17일 사용 → 종료월 다음 달 1일 출금 (농협은행)
    { name: "농협카드", kind: "PERSONAL", cycleStartDay: 18, paymentDay: 1, paymentMonthOffset: 1, payable: "농협카드 미지급금", bank: "농협은행" },
    // 전전월 12일~전월 11일 사용 → 1일 출금 (농협은행)
    { name: "법인카드", kind: "CORPORATE", cycleStartDay: 12, paymentDay: 1, paymentMonthOffset: 1, payable: "법인카드 미지급금", bank: "농협은행" },
  ] as const;
  for (const c of cards) {
    await prisma.card.upsert({
      where: { name: c.name },
      update: {},
      create: {
        name: c.name,
        kind: c.kind,
        cycleStartDay: c.cycleStartDay,
        paymentDay: c.paymentDay,
        paymentMonthOffset: c.paymentMonthOffset,
        payableAccountId: await id(c.payable),
        bankAccountId: await id(c.bank),
      },
    });
  }
}

main().finally(() => prisma.$disconnect());
