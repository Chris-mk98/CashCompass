#!/bin/sh
# App Runner에서는 DB 접속 정보를 개별 환경변수(비밀번호는 Secrets Manager)로 받는다.
set -e
: "${DATABASE_URL:=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT:-5432}/${DB_NAME}?sslmode=require}"
export DATABASE_URL
# RDS는 VPC 내부에 있으므로 스키마 반영과 기본 데이터(upsert)는 기동 시 수행
node_modules/.bin/prisma db push --skip-generate
node_modules/.bin/tsx prisma/seed.ts
exec node_modules/.bin/next start
