# @wil-works/evoke-tools-ui

Evoke Tools UI —— 纯 JS Vue3 **产品级 GUI 框架**（命名空间 `--et-*`）。

服务对象：要把界面做成**一个软件**的产品——文档/画布居中，工具退到边缘，
chrome（标题栏 / 工具区 / 状态栏）环绕内容；常驻布局、键盘优先、命令驱动。

- 设计语言白皮书：[`DESIGN.md`](./DESIGN.md)
- 计划全文：仓库根 `plans/tools-ui/01–07`
- 文档站：`docs-tools/`（M0 起交付 `guide/design.md`，组件页随里程碑批交付）

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

## 子路径导出

| 入口 | 内容 |
| --- | --- |
| `.` | 全部组件 + 运行时契约 + 图标机制 |
| `./styles` | `--et-*` 令牌 + 暗色 + 基础样式 |
| `./runtime` | L0 契约：命令注册表 / 菜单 schema / 工具区状态机 / 键位表 / 焦点漫游 |
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
