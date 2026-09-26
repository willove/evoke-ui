# @wil-works/evoke-tools-ui

![npm version](https://img.shields.io/npm/v/%40wil-works%2Fevoke-tools-ui) ![npm version](https://img.shields.io/badge/version-v1.2.1-blue)

Evoke Tools UI —— 纯 JS Vue3 **产品级 GUI 框架**（命名空间 `--et-*`）。

服务对象：要把界面做成**一个软件**的产品——文档/画布居中，工具退到边缘，
chrome（标题栏 / 工具区 / 状态栏）环绕内容；常驻布局、键盘优先、命令驱动。

- 设计语言白皮书：[`DESIGN.md`](./DESIGN.md)
- 计划全文：仓库根 `plans/tools-ui/01–07`
- 文档站：`docs-tools/`（指南 6 页 + 33 件组件页全覆盖 + 非办公域 recipe）

## 版本与 API 稳定性承诺（v1.0 起）

`@wil-works/evoke-tools-ui` 自 **1.0.0** 起遵守语义化版本，以下为承诺范围：

| 面 | 承诺 | 说明 |
| --- | --- | --- |
| 组件 `props` / `emits` / `slots` | **冻结**：只增不改不删（minor 新增、patch 修缺陷） | 删除或改名走 major；新增 prop 总有默认值，不改既有渲染 |
| `./runtime` 契约（函数签名与返回结构） | **冻结**：同上 | 返回结构新增字段 = minor；删除/改名 = major |
| 令牌 `--et-*` | **冻结**：值可随主题变，**名字不删不改** | 新令牌 minor 新增；消费方直接引用单个令牌的写法不受影响 |
| class 钩子 `et-*` / `is-*` 状态类 | **冻结** | 产品按类做样式覆盖/测试选择器；改名 = major |
| 子路径导出（`./styles`、`./runtime`、`./icons`、`./<component>`） | **冻结** | 新增组件子路径 = minor |
| 兜底行为 | **承诺级**：图标未命中回落显式兜底图标、布局损坏降级默认布局不白屏、存储异常静默降级 | 这三条是框架级承诺，变更走 major 并提前一个 minor 弃用警告 |

**弃用流程**：要删的东西先在 minor 里标记弃用（运行时 dev warn 一条，不刷屏），
至少一个 minor 之后才在 major 删除。**1.0 之后没有"顺手改名"**——改名就是破坏性变更。

## 质量门与测试层（构建前置）

七道门（G1 令牌 / G2 图标 / G3 命令面 / G4 可访问名 / G5 组字 / G6 文案 / G7 几何）挂入
`pnpm build:tools`；发布前 `node scripts/pre-release-check.mjs` 跑版本展示点守卫 + 图标数 +
**组件数宣称核对（G8，M4 新增）**。测试层 L1 契约 / L2 组件 / L3 视觉（基线入库，CI 的
visual 作业锁定）/ L4 集成（workbench 装配）/ L5 复用检验（非办公域）。

## 安装与使用

```bash
pnpm add @wil-works/evoke-tools-ui @wil-works/evoke-business-ui vue
```

```js
import { createApp } from 'vue'
import EvokeToolsUI from '@wil-works/evoke-tools-ui'
import '@wil-works/evoke-tools-ui/styles'
import '@wil-works/evoke-business-ui/styles' // 底座样式（reset + --eb-* + 暗色）

const app = createApp(App)
app.use(EvokeToolsUI)
```

## 三档密度

密度是根级属性（`<html data-density>`），由 `EtProvider` 写入；组件只引用令牌。

```vue
<et-provider density="compact">
  <app />
</et-provider>
```

紧凑 24 / 默认 32 / 宽松 40 的控件高对齐 Fluent UI 的 small/medium/large 阶梯。

## L2 工具区（M1）

```vue
<et-ribbon-bar
  v-model="activeTab"
  v-model:collapsed="collapsed"
  :schema="ribbonSchema"
  :registry="commandRegistry"
  :context-tabs="contextTabs"
  :ctx="{ hasSelection: true }"
  persist-key="my-app-ribbon"
  @command="onCommand"
/>
```

- 命令表驱动：`createCommandRegistry()` + schema（tab→组→条目），`mergeSchema` 打补丁；
- 真折叠（Ctrl+F1 / ⌥⌘R / 双击）与 peek 浮层；分量降级与溢出「更多」禁换行；
- 同一命令表再驱动 `<et-command-palette>`（⌘K）与 `<et-context-menu>`（右键）。

## L3 工作台（M2）

```vue
<et-workbench v-model:layout="layout" :default-layout="DEFAULT" persist-key="my-app"
  @layout-corrupted="onCorrupted">
  <template #toolbar><et-ribbon-bar :schema="..." :registry="..." /></template>
  <template #panel="{ panel }"><my-panel :id="panel.id" /></template>
  <template #documents><et-document-tabs v-model="doc" :documents="docs" /></template>
  <main>画布</main>
  <template #statusbar>就绪</template>
</et-workbench>
```

- 布局即数据：`createLayoutTree` / `togglePanelCollapsed` / `hidePanel` / `maximizePanel`（纯函数，
  `./runtime` 出口）；`EtWorkbench` 是唯一写树处；
- `EtDock`（stack 并列分摊尺寸 / tabs 档）+ `EtPanel`（28px 标题栏 + 折叠/最大化/关闭）+
  `EtScrollArea` + `EtEmptyState`（一句引导 + 一个主钮）+ `EtDocumentTabs`（脏标记/关闭/溢出）。

## L4 外壳件（M3）

```vue
<et-title-bar title="我的工具" doc-title="报表.xlsx" @window-control="onWinCtl" />
<et-workbench ...>…</et-workbench>
<et-status-bar :items="[{ key: 'ready', label: '就绪' }]" zoom="100%" />
<et-theme-bridge />   <!-- 零 DOM：主题 → 画布 --ot-* 调色板 -->
<et-dialog v-model="open" title="新建" confirm-text="创建" @confirm="onConfirm" />
<et-backstage v-model="backstage"><template #nav>…</template>…</et-backstage>
<et-toast v-model="toastOpen" message="已保存" />
<et-banner type="warn" title="有未保存改动" />
```

- **主题桥**：`EtThemeBridge` 零 DOM，把主题令牌解析成画布 `--ot-*`（登记表无硬编码色值）；
- **双宿主**：`EtTitleBar` 的窗口控制位 Web 不渲染 / 桌面 mac 左序 / Win·Linux 右序（`host` prop 可钉死）；
- **焦点三处一致**：Dialog / Backstage / 命令面板共用 `runtime/focus/trap`（Tab 循环 + Esc 收敛 +
  焦点归还触发器）；backstage 开关不引发画布尺寸跳动。

## 子路径导出

| 入口 | 内容 |
| --- | --- |
| `.` | 全部组件 + 运行时契约 + 图标机制 |
| `./styles` | `--et-*` 令牌 + 暗色 + 基础样式 |
| `./runtime` | L0 契约：命令注册表 / 菜单 schema / 工具区状态机 / 键位表 / 焦点漫游 / 布局树 / 画布调色板 / 焦点陷阱 / 宿主探测 |
| `./icons` | 图标解析兜底 + 领域别名注册 API |
| `./<component>` | 按需引入，如 `@wil-works/evoke-tools-ui/tool-button` |

## 质量门（构建前置，违规即失败）

| 门 | 判据 | 脚本 |
| --- | --- | --- |
| G1 | 令牌纯度 / 回流禁令 / 引用完整 / 依赖白名单 | `scripts/check-token-rule.mjs` |
| G7 | 布局属性禁字面量 px、z-index 走阶梯、工具组契约 | `scripts/check-geometry.mjs` |
| G2 | 悬空图标名 = 失败 | `scripts/check-icon-names.mjs` |
| G4 | 图标按钮必须 aria-label | `scripts/a11y-names.mjs` |
| G5 | window/document 级 keydown 必过组字守卫 | `scripts/ime-guard.mjs` |
| G3 | 命令引用已注册 / surfaces 合法 / 状态单点实现 | `scripts/check-command-surface.mjs` |
| G6 | 模板禁 § 引用、禁成段说明、禁开发说明字样 | `scripts/check-copy.mjs` |
| —— | 三档密度 / chrome 预算与设计文档表格逐项一致 | `scripts/check-density.mjs` |

## 开发

```bash
pnpm build:tools            # 五道门 + vue-tsc 类型产物 + 子路径存根
pnpm vitest run packages/evoke-tools-ui   # 一组件一测试
pnpm tokens:export          # 令牌 JSON（design-tokens/evoke-tools-ui.*.json）
pnpm example:tools-workbench   # 工作台装配示例（源码级 HMR）
```

## 边界（不做什么）

不做业务组件、不做办公语义（不认识"单元格/公式/工作表"）、不做官网件、不做图表、
不绑定数据获取/状态管理/路由、不做移动端专属形态、不引入第三方组件库。
能复用 business-ui 的一律复用；扩展不得修改底座既有语义。
