# CashCompass

복식부기 가계부 웹앱 (모바일 입력용). 현금 흐름은 **현금주의**, 손익은 **발생주의**로 관리합니다.

## 회계 구조

| 구분 | 계정 |
|---|---|
| 자산 | 신한은행, 농협은행, 법인카드 미수금 |
| 부채 | KB 마이너스통장, 신한카드·농협카드·법인카드 미지급금 |
| 자본 | 기초순자산 |
| 수익 | 급여, 용돈, 기타수입 |
| 비용 | 식비, 교통, … , 이자비용 (설정에서 추가) |

| 거래 | 차변 | 대변 |
|---|---|---|
| 개인카드 사용 (사용일) | 비용 | 카드 미지급금 |
| 법인카드 사용 (사용일) | 법인카드 미수금 | 법인카드 미지급금 |
| 법인카드 승인 입금 (건별) | 은행 | 법인카드 미수금 |
| 법인카드 미승인 → 개인비용 | 비용 | 법인카드 미수금 |
| 카드대금 출금 | 카드 미지급금 | 은행 |
| 급여·용돈 | 신한은행 | 수익 |
| KB에서 인출 / 입금 | 은행 / KB | KB / 은행 |

- **손익(발생주의)**: 거래일 기준 수익·비용 계정 합계. 법인카드는 개인비용 전환 건만 비용.
- **현금(현금주의)**: 실제 계좌(신한·농협·KB)의 입출금. KB 마이너스통장은 통장에 찍히는 잔액(음수)으로 표시.

## 카드 이용기간과 출금일

| 카드 | 이용기간 | 출금 | 계좌 |
|---|---|---|---|
| 신한카드 | 12일 ~ 다음 달 11일 | 종료월 25일 | 신한은행 |
| 농협카드 | 18일 ~ 다음 달 17일 | 종료월 다음 달 1일 | 농협은행 |
| 법인카드 | 12일 ~ 다음 달 11일 | 종료월 다음 달 1일 | 농협은행 |

설정 화면에서 바꿀 수 있습니다.

## 로컬 실행

```bash
cp .env.example .env   # DATABASE_URL, APP_PASSWORD 입력
npm install
npm run db:push        # 테이블 생성
npm run db:seed        # 기본 계정·카드 생성
npm run dev
npm test               # 이용기간·손익 계산 테스트
```

## AWS 배포 (App Runner + RDS)

```
휴대폰 ──HTTPS──▶ App Runner (Next.js 컨테이너)
                     │ VPC 커넥터
                     ▼
               RDS PostgreSQL (private subnet, 외부 접근 불가)
```

| 구성 | 내용 |
|---|---|
| `Dockerfile` | Next.js 이미지. 기동 시 `scripts/start.sh`가 스키마 반영(`prisma db push`)과 기본 데이터(upsert)를 수행 |
| `infra/cloudformation.yaml` | VPC·private subnet, RDS(db.t4g.micro), Secrets Manager(DB·앱 비밀번호), App Runner 서비스(0.25 vCPU / 1 GB, 인스턴스 1개) |
| `scripts/deploy.sh` | 이미지 빌드 → ECR 푸시 → CloudFormation 배포 |

사전 준비: AWS CLI 로그인(`aws configure`), Docker.

```bash
APP_PASSWORD=원하는비밀번호 ./scripts/deploy.sh   # 최초 배포 (RDS 생성에 10~15분)
./scripts/deploy.sh                               # 이후 코드 변경 배포
```

마지막에 출력되는 `https://….awsapprunner.com` 주소로 접속합니다. 리전은 기본 `ap-northeast-2`(서울), `AWS_REGION`으로 변경할 수 있습니다.

- DB 비밀번호는 자동 생성되어 Secrets Manager에만 저장되고, App Runner가 실행 시 주입합니다.
- 스택을 삭제해도 RDS는 스냅샷을 남깁니다.
- 예상 비용(서울): App Runner 약 $5~8/월(대부분 유휴 상태 기준) + RDS db.t4g.micro·20GB 약 $20/월 + Secrets Manager 약 $1/월.
