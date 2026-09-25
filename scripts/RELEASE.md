# 发布清单（patch / minor）

> 2026-09-25 v0.16.0 那次发布的实际耗时约 35 分钟，其中真正的构建与发布只占约 5 分钟。
> 这份清单把那 30 分钟的损耗固化成可勾选的步骤。**顺序即耗时优化的顺序。**

## 0. 开始前：确认工作区是可发布状态

```bash
git status --short          # 有多少未提交改动？属于哪条线？
```

- 若混有**别的线**的未提交改动（例如图标扩容 WIP），先决定：等它入库 / 只提交自己的文件。
- **不要整文件 `git add`**——会把无关 hunk 捎进发布提交。v0.16.0 就是这样把图标计数
  438→441 带进了发布提交，而 npm 包按 tag 构建只有 433 个，文档与包对不上，事后补了一个修正提交。
- 暂存后逐个文件过 `git diff --cached`，确认每个 hunk 都是本次发布想要的。

## 1. 版本号与文档展示同步（版本号散在 6 处以上）

| 位置 | 内容 |
|---|---|
| `packages/<pkg>/package.json` | 包版本 |
| `docs/index.md` | business 站 hero 徽标 |
| `docs/.vitepress/theme/meta.js` | business 站页头徽标 |
| `docs-web/index.md` | ui 站三处：品牌标签、发布通告 pill、拼贴标签 |
| `docs-web/.vitepress/theme/Layout.vue` | ui 站内页页头标签 |
| `docs-charts/index.md` + `meta.js` | charts 站（仅当 charts 本次发版） |

漏改任何一处都会被 `docs-site-version` 守卫测试抓住（它遍历文档里所有 `vX.Y.Z`，
不允许出现非当前版本号）。**注意**守卫测试可能是未跟踪的新文件，本地会跑、CI 不一定跑，
别因为它"CI 绿着"就跳过这一步。

## 2. CHANGELOG 归并

`CHANGELOG.md` 顶部 `## [Unreleased]` → `## [<pkg> x.y.z / ...] — YYYY-MM-DD`，
按包分小节。站点 changelog（`docs/guide/changelog.md` 等）是发布说明，随版本走，不在此刻改。

## 3. 跑发布前检查（新增，一条命令）

```bash
node scripts/pre-release-check.mjs
```

覆盖三件事，任一不过 `exit 1`，不要进入打 tag：

1. **版本号守卫**：直接跑 `docs-site-version` 三个测试文件；
2. **图标数量一致性**：文档宣称的图标数 vs 图标源数据实际键数（按包配对，business 文档
   只对 business 源）。这一步专防"文档承诺了包里没有的图标"；
3. **暂存区清单**：逐文件列出 `+N / -N` 行数供人工过目（只提示，不拦截）。

读的是**暂存区 → HEAD → 工作区**，所以暂存了错值即使没提交也会被抓到。

## 4. 提交、打 tag、发 Release

```bash
git push origin main
git tag v<next>            # 建 tag 前必查占用：gh release list；三包共用 v-major 序列不回收
git push origin v<next>
gh release create v<next> --title "..." --notes "..."
```

- **tag 命名**：`v-major` 自增序列，与包版本号错位是正常的（历史上 v0.9.0 给了 charts 0.5.0），
  别试图对齐，也别回收旧 tag。
- Release 一经 `published` 会自动触发 `publish.yml` 发布**全部**包；版本没变的包会被
  "already published" 守卫自动跳过，无需手动选包。

## 5. 验证 npm（别信本地 npm view 缓存）

```bash
# scoped 包的正确编码：只替换 @scope 后面那一个斜杠，别把 https:// 也换掉
curl -s "https://registry.npmjs.org/@wil-works%2fevoke-business-ui" | jq -r '."dist-tags".latest'
```

> 踩过的坑：`sed 's|/|%2f|g'` 会把 URL 里的斜杠一并替换，导致四个包（含确定已发布的）
> 全部返回"未在册"，白查三四分钟。**核验时同时看一个确定已发布的包做对照组**，
> 对照组也查不到就说明是自己的查询写错了。

CI 日志里确认发布成功的标志：`✅ Published package <name>@<version>`。
`[WARN] Skipped OIDC: ERR_PNPM_AUTH_TOKEN_EXCHANGE ... 404` 是**正常的**——
它只是回退到 `NPM_TOKEN` 认证，不代表失败。

## 6. 部署文档站

```bash
pnpm docs:build && pnpm docs-web:build      # 各约 5-10 秒，不是瓶颈
./scripts/deploy-docs.sh business
./scripts/deploy-docs.sh ui
```

- **部署前确认构建来源**：若工作区有别的线的未提交改动，它们会一起进产物
  （文档站吃的是源码 alias，不是 npm 包）。要只发已提交状态，用
  `git stash push -- <该线的文件>` → 构建 → 部署 → `git stash pop`。
- **不要**为了"干净构建"去开 git worktree 再软链 `node_modules`：pnpm 的依赖校验会
  认为 modules 目录不匹配并要求清空（无 TTY 时会中止，但已足够危险），手工补链 vitepress
  又会栽在模块解析上，还会把软链误建进主仓 `node_modules`。stash 方案两分钟搞定。
- charts 站只在 charts 有改动时才部署；单纯修 charts 徽标可随下次 charts 发版带走。

线上抽查：首页徽标版本号 + CSS 产物里是否含本次的关键帧/变量
（如 `grep -c "eb-field-ring" <线上 css>`）。

## 7. 收尾

- 若第 0 步 stash 过别的线的工作，确认 `git stash list` 已空、文件数对得上。
- 汇报里写清：发了哪几个包、tag 名、两站在线版本号、以及**有没有夾带未入库的改动**。

## 耗时参照（v0.16.0 实际）

| 阶段 | 耗时 | 说明 |
|---|---|---|
| 版本号 + CHANGELOG + 甄别未提交改动 | 15 min | 必要工作，被"发现 input-number prop 空转"和甄别拖慢 |
| push / tag / Release / 等 CI | 4 min | 其中约 3 分钟是纯等 publish 流水线 |
| npm 核验 | 3-4 min | 含 URL 编码错误导致的假警报 |
| **worktree 弯路** | **10 min** | 完全可省，改用 stash |
| 构建 + 部署 + 线上抽查 | 3 min | 构建各 5-10 秒，rsync 秒级 |

按本清单执行，第 3 步能在提交前拦住第 0 步的污染，第 6 步不再有 worktree 弯路，
第 5 步不再有假警报——预期可压到 10-12 分钟。
