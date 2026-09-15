# Evoke UI Monorepo

同一设计血统的三个 Vue 3 库：**Evoke UI** 面向官网与营销页，**Evoke Business UI** 面向中后台管理系统，**Evoke Charts** 是零依赖 Canvas 自绘图表库（与 business-ui 样式打通主题适配）。均基于纯 JS 实现、设计令牌驱动、MIT 开源。

命名空间约定：`ev-*`（evoke-ui 与 evoke-charts，共享 `--ev-*` 令牌面）与 `eb-*`（evoke-business-ui，`--eb-*` 令牌）。

| 包 | 定位 | 文档站 | npm |
|----|------|--------|-----|
| [@wil-works/evoke-ui](packages/evoke-ui) | 官网 / 营销页 / 纯前端站点组件库，Clean Navy 设计语言 | [evoke-ui.wil-works.com](https://evoke-ui.wil-works.com) | [![npm](https://img.shields.io/npm/v/@wil-works/evoke-ui.svg)](https://www.npmjs.com/package/@wil-works/evoke-ui) |
| [@wil-works/evoke-business-ui](packages/evoke-business-ui) | 中后台管理组件库：150+ 通用组件、8 个业务场景组件 | [evoke-business-ui.wil-works.com](https://evoke-business-ui.wil-works.com) | [![npm](https://img.shields.io/npm/v/@wil-works/evoke-business-ui.svg)](https://www.npmjs.com/package/@wil-works/evoke-business-ui) |
| [@wil-works/evoke-charts](packages/evoke-charts) | 零依赖 Canvas 自绘图表库：20+ 种图表类型，主题令牌驱动 | [evoke-charts.wil-works.com](https://evoke-charts.wil-works.com) | [![npm](https://img.shields.io/npm/v/@wil-works/evoke-charts.svg)](https://www.npmjs.com/package/@wil-works/evoke-charts) |

---

## Evoke UI — 官网站点组件库

面向官网、落地页与营销页的 Vue 3 组件库：**60 个组件**，排版疏朗、动效轻盈、明暗双主题与运行时换色开箱即用。

- **站点区块**：Hero、导航栏、页脚、CTA、Marquee、Logo 墙、时间线、FAQ 等官网高频区块开箱即用
- **主题化**：设计令牌驱动，`EvConfigProvider` 一条语句运行时换主色；明暗模式自动跟随
- **图标**：960+ 内置图标，另支持按需扩展
- **交互细节**：搜索框、快捷键浮层、轮播、视频 / 音频播放器、滚动动效等微交互齐备

```bash
pnpm add @wil-works/evoke-ui
```

```js
import { createApp } from 'vue'
import EvokeUI from '@wil-works/evoke-ui'
import '@wil-works/evoke-ui/styles'

createApp(App).use(EvokeUI).mount('#app')
```

```vue
<template>
  <EwHero reveal title="官网的气质，从首屏开始" description="一套为官网与营销页而生的组件库。">
    <template #actions>
      <EwButton pill>立即开始</EwButton>
    </template>
  </EwHero>
</template>
```

组件 API 与在线示例见[文档站](https://evoke-ui.wil-works.com)。

## Evoke Business UI — 中后台组件库

面向中后台管理界面的 Vue 3 组件库：**150+ 通用组件、8 个业务场景组件、20+ 种 Canvas 自绘图表**，配套在线文档与 8 套完整场景示例。默认商务蓝主题，支持暗色模式，桌面端（含 Electron）与移动端自适应。

- **组件**：全量注册后以 `<ev-button>`、`<ev-data-table>` 等标签直接使用；虚拟滚动、统计数值、命令面板、新手引导等增强组件齐备
- **业务组件**：筛选表单、数据表格、状态标签、双行单元格、详情描述、导入导出面板、审计时间线、列设置
- **图表**：Canvas 自绘折线 / 柱状 / 饼环 / 雷达 / 漏斗等 20+ 图表类型，tooltip、缩放、暗色适配内建，不依赖第三方图形库
- **图标**：433 个常用单色图标内置（含微信 / 支付宝等品牌 Logo），Remix 全量 3229 个按需加载
- **B 端生态**：`usePermission` / `v-permission`、`useTable`、`useClipboard` / `v-copy`、`useFullscreen`、`v-infinite-scroll`
- **运行环境**：无 CDN 请求、模块顶层不访问 window / document，file:// 与 Electron 场景可直接运行

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

组件 API 与在线示例见[文档站](https://evoke-business-ui.wil-works.com)，场景示例可在线浏览后本地运行对应工程。

## 工程铁律：与第三方组件库完全隔离

两个库均 **不依赖、不引用、不兼容模拟** 任何第三方组件库。这是构建期强制的铁律，而非约定：

1. **CSS 令牌一律使用 `--ev-*` 单一命名空间**，禁止引入任何第三方组件库的令牌前缀。
2. **禁止引入第三方组件库依赖或命名**（import、字符串、注释均不允许）。
3. 各包的 `scripts/check-token-rule.mjs` 在每次 `pnpm build` 时扫描 `src/` 与 `package.json`，违规即构建失败；也可手动执行 `pnpm lint:tokens` 检查。

## 本地开发

```bash
pnpm install

pnpm docs-web:dev    # Evoke UI 文档站（http://localhost:5173）
pnpm docs:dev        # Evoke Business UI 文档站（组件文档 + 在线示例中心）
pnpm build:eui       # 构建 Evoke UI 产物
pnpm build:ebui      # 构建 Evoke Business UI 产物
pnpm test            # 单元测试
```

Business UI 场景示例（每条命令独立运行一个完整页面）：

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

## 许可证

[MIT](./LICENSE)
