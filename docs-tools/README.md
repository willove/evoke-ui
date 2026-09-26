# Evoke Tools UI 文档站

tools-ui 的独立文档站（参考 evoke-charts 站的机制：动态 demo + 源码级消费 + 定制首屏）。

## 开发与构建

```bash
pnpm docs-tools:dev      # 本地开发（源码级 alias，两库改动即时生效）
pnpm docs-tools:build    # 构建到 .vitepress/dist
pnpm docs-tools:preview  # 本地预览构建产物（端口 4176）
```

## 部署（与其它三站同路径）

服务器是宝塔 + nginx 静态托管，**一站一个子域名**，部署走仓库根的脚本：

```bash
# 1) 首次：复制 scripts/.env.deploy.example 为 scripts/.env.deploy，
#    填 DEPLOY_SSH 与 DEPLOY_TOOLS_DIR（宝塔建站后生成的站点根目录）
# 2) 部署本站在全部四站里：
./scripts/deploy-docs.sh all
#    或只部署本站：
./scripts/deploy-docs.sh tools
```

- 上线前 CI 会先跑 `pnpm docs-tools:build` 验证可构建；
- 站点根域名下的路径即站点根（`base` 默认 `/`，勿改成子路径除非换了托管形态）；
- 版本展示点在 `index.md` hero 徽标，由 G8 发布一致性门核对，勿手改。
