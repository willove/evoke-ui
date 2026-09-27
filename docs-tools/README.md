# Evoke Tools UI 文档站

tools-ui 的独立文档站，与 `docs/`（business）、`docs-charts/` 两站**同一套家族外壳**
（同构的 `td-*` / `bd-*` / `cd-*` 布局与令牌：警示横幅 + 顶栏/官方库下拉/搜索 + 侧栏分组 +
居中式首页），机制上共用动态 demo 块 + 源码级消费 + ApiTable。

## 站点分区

| 分区 | 路径 | 内容 |
| --- | --- | --- |
| 指南 | `/guide/*` | 快速开始 / 命令驱动 / 工作台布局 / 主题与画布桥 / 键盘优先 / 配方 |
| 通用 | `/common/` | common-tools：基准件 / 通用壳 / 命令面 / 面板 / 反馈 / 输入（29 件，不含办公语义） |
| 办公 | `/office/` | office-tools：功能区 / 溢出菜单 / 后台页 / 表页签 / 公式栏 / 画布宿主 / 画布桥（7 件） |
| 组件 | `/components/*` | 36 个组件入口的逐页 Props / Emits / 行为（分类与叶名见 `/common/`、`/office/`） |
| 案例 | `/examples/*` | 8 个完整装配（`examples/cases/*.vue` 真组件，`DocExample` 内嵌可运行 + 源码） |
| 契约 | `/guide/design` | `--et-*` 全量令牌与命名/门禁契约 |

组件目录**不手写**：侧栏、两个概览页与站内搜索都从包内分类单一来源
`packages/evoke-tools-ui/src/taxonomy.js` 派生（两层 + 用途分类 + 粒度），改分类只改那一处。

案例页写法：`examples/cases/XxxCase.vue`（`et-*` 装配，460px 舞台 + 真交互）+
`examples/<案例>.md`（`<DocExample :code="xxxSource">` + 用到的组件 + 实现要点）。
新增案例要同步 `theme/meta.js` 的 `EXAMPLES_NAV`。

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
- **视觉基线重录**：`visual/tools.spec.mjs-snapshots/` 里的基线分平台入库
  （`-tools-darwin.png` 本地 mac 录 / `-tools-linux.png` CI 录）。**真实视觉变更**
  （组件/令牌/示例 DOM 变了）→ 先本地 `pnpm exec playwright test --project=tools
  --update-snapshots` 重录 mac 基线并提交；Linux 基线由 CI 的
  `visual-baseline` 作业（Actions → CI → Run workflow → 勾选 update_visual_baselines）
  在同平台重录并自动回推。守卫与录制必须同平台，否则必然红。
- 站点根域名下的路径即站点根（`base` 默认 `/`，勿改成子路径除非换了托管形态）；
- 版本展示点在 `index.md` hero 徽标，由 G8 发布一致性门核对，勿手改。
