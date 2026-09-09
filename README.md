# Evoke UI Monorepo

- **[@wil-works/evoke-business-ui](packages/evoke-business-ui)** — 面向中后台管理界面的 Vue 3 组件库（本 README 主体）
- **[@wil-works/evoke-ui](packages/evoke-ui)** — 面向官网与纯前端站点的 Vue 3 组件库（Clean Navy 设计语言），文档站 `pnpm docs-web:dev`

---

## Evoke Business UI

面向中后台管理界面的 Vue 3 组件库：**150+ 通用组件、8 个业务场景组件、20+ 种 Canvas 自绘图表**，配套在线文档与 8 套完整场景示例。默认商务蓝主题，支持暗色模式，桌面端（含 Electron）与移动端自适应。

## ✨ 特性

- **组件**：全量注册后以 `<ev-button>`、`<ev-data-table>` 等标签直接使用；覆盖按钮、表单、表格、弹层、布局、导航、数据展示等常见界面元素，虚拟滚动、统计数值、排版家族、锚点、新手引导、命令面板等增强组件齐备
- **业务组件**：筛选表单、数据表格、状态标签、双行单元格、详情描述、导入导出面板、审计时间线、列设置，面向数据管理类页面组合使用
- **图表**：Canvas 自绘折线 / 柱状 / 饼环 / 雷达 / 漏斗等 20+ 图表类型，tooltip、缩放、暗色适配内建，图表绘制本身不依赖第三方图形库
- **图标**：433 个常用单色图标内置（含微信/支付宝等品牌 Logo 与商务、财务类），另有 Remix 全量 3229 个按需加载；文件类型图标（xlsx / docx / pdf…）多别名指向同一资源
- **主题化**：颜色、间距、圆角、动效均由设计令牌驱动，覆盖变量即可换肤；`setPrimaryColor` 一条语句运行时换主色，密度三档可切，明暗模式自动跟随
- **B 端生态**：`usePermission` / `v-permission`（权限判定与指令）、`useTable`（列表页数据流）、`useClipboard` / `v-copy`、`useFullscreen`、`v-infinite-scroll`
- **移动端组件**：下拉刷新、加载更多、动作面板、底部标签栏、导航栏，配安全区适配
- **运行环境**：无 CDN 请求、模块顶层不访问 window / document，file:// 与 Electron 场景可直接运行

## 📜 工程铁律：与第三方组件库完全隔离

本库 **不依赖、不引用、不兼容模拟** 任何第三方组件库。这是构建期强制的铁律，而非约定：

1. **CSS 令牌一律使用 `--ev-*` 单一命名空间**，禁止引入任何第三方组件库的令牌前缀。
2. **禁止引入第三方组件库依赖或命名**（import、字符串、注释均不允许）。
3. `packages/evoke-business-ui/scripts/check-token-rule.mjs` 在每次 `pnpm build` 时扫描 `src/` 与 `package.json`，违规即构建失败；也可手动执行 `pnpm lint:tokens` 检查。

## 🚀 在项目中使用

```bash
pnpm add @wil-works/evoke-business-ui
```

```js
import { createApp } from 'vue'
import EvokeBusinessUI from '@wil-works/evoke-business-ui'
import '@wil-works/evoke-business-ui/styles'

createApp(App).use(EvokeBusinessUI).mount('#app')
```

```vue
<template>
  <ev-button type="primary" icon="search" @click="onSearch">搜索</ev-button>
  <ev-data-table title="订单列表" :columns="columns" :data="rows" :total="total" />
</template>
```

完整组件 API 与在线示例见文档站「组件」章节。

## 📚 文档与示例

本仓库内置文档站与示例工程，克隆后即可本地体验：

```bash
pnpm install
pnpm docs:dev        # 文档站（组件文档 + 在线示例中心）
```

场景示例（每条命令独立运行一个完整页面）：

| 命令 | 场景 |
|------|------|
| `pnpm example:ebui-dashboard` | 工作台仪表盘 |
| `pnpm example:ebui-crud-list` | 增删改查列表 |
| `pnpm example:ebui-step-form` | 分步表单 |
| `pnpm example:ebui-detail` | 订单详情页 |
| `pnpm example:ebui-project` | 项目管理 |
| `pnpm example:ebui-approval` | 报销审批流 |
| `pnpm example:ebui-knowledge` | 知识库 |
| `pnpm example:ebui-mobile` | 移动端 |

也可以先在文档站的「示例」章节在线浏览，再到本地运行对应工程。

## 🧪 质量保障

```bash
pnpm test            # 877 个单元测试
pnpm build:ebui      # 构建组件库产物
```

## 📄 许可证

[MIT](./LICENSE)
