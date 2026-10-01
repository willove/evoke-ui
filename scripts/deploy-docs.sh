#!/usr/bin/env bash
# 部署文档站到服务器（宝塔面板 + nginx 静态托管）
# 用法: ./scripts/deploy-docs.sh [all|business|ui|charts]
set -euo pipefail

cd "$(dirname "$0")/.."

ENV_FILE="scripts/.env.deploy"
if [ ! -f "$ENV_FILE" ]; then
  echo "缺少配置文件 $ENV_FILE"
  echo "请复制 scripts/.env.deploy.example 为 scripts/.env.deploy 并填写服务器信息"
  exit 1
fi
# shellcheck source=/dev/null
source "$ENV_FILE"

TARGET="${1:-all}"

deploy() {
  local name="$1" dist="$2" remote="$3"
  echo "==> 部署 ${name} -> ${DEPLOY_SSH}:${remote}"
  rsync -avz --delete \
    --exclude=".user.ini" \
    --exclude=".well-known/" \
    "${dist}/" "${DEPLOY_SSH}:${remote}/"
  ssh "${DEPLOY_SSH}" "find '${remote}' ! -name '.user.ini' -exec chown www:www {} +"
}

case "$TARGET" in
  business)
    pnpm docs:build
    deploy "Evoke Business UI 文档站" "docs/.vitepress/dist" "$DEPLOY_BUSINESS_DIR"
    ;;
  ui)
    pnpm docs-web:build
    deploy "Evoke UI 文档站" "docs-web/.vitepress/dist" "$DEPLOY_UI_DIR"
    ;;
  charts)
    pnpm docs-charts:build
    deploy "Evoke Charts 文档站" "docs-charts/.vitepress/dist" "$DEPLOY_CHARTS_DIR"
    ;;
  all)
    pnpm docs:build
    deploy "Evoke Business UI 文档站" "docs/.vitepress/dist" "$DEPLOY_BUSINESS_DIR"
    pnpm docs-web:build
    deploy "Evoke UI 文档站" "docs-web/.vitepress/dist" "$DEPLOY_UI_DIR"
    pnpm docs-charts:build
    deploy "Evoke Charts 文档站" "docs-charts/.vitepress/dist" "$DEPLOY_CHARTS_DIR"
    ;;
  *)
    echo "用法: $0 [all|business|ui|charts]"
    exit 1
    ;;
esac

echo "部署完成"
