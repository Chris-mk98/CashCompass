#!/bin/sh
# 이미지 빌드 → ECR 푸시 → CloudFormation 배포
# 사용법: APP_PASSWORD=비밀번호 ./scripts/deploy.sh   (최초 1회만 APP_PASSWORD 필요)
set -e
REGION="${AWS_REGION:-ap-northeast-2}"
STACK=cashcompass
REPO=cashcompass
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
REGISTRY="$ACCOUNT.dkr.ecr.$REGION.amazonaws.com"
IMAGE="$REGISTRY/$REPO:latest"

aws ecr describe-repositories --region "$REGION" --repository-names "$REPO" >/dev/null 2>&1 ||
  aws ecr create-repository --region "$REGION" --repository-name "$REPO" >/dev/null

aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REGISTRY"
docker build --platform linux/amd64 -t "$IMAGE" .
docker push "$IMAGE"

if aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK" >/dev/null 2>&1; then
  # 이미 배포된 경우: App Runner 자동 배포가 새 이미지를 가져간다. 템플릿 변경분만 반영.
  aws cloudformation deploy --region "$REGION" --stack-name "$STACK" \
    --template-file infra/cloudformation.yaml --capabilities CAPABILITY_IAM \
    --parameter-overrides ImageUri="$IMAGE" ${APP_PASSWORD:+AppPassword="$APP_PASSWORD"} \
    --no-fail-on-empty-changeset
else
  : "${APP_PASSWORD:?최초 배포에는 APP_PASSWORD가 필요합니다}"
  aws cloudformation deploy --region "$REGION" --stack-name "$STACK" \
    --template-file infra/cloudformation.yaml --capabilities CAPABILITY_IAM \
    --parameter-overrides ImageUri="$IMAGE" AppPassword="$APP_PASSWORD"
fi

aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='ServiceUrl'].OutputValue" --output text
