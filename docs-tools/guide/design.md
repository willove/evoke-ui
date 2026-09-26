# 设计规范（`--et-*`）

工具界面（工作台）的视觉基准。**只放"工具框架层"该管的度量**：品牌色、中性色阶、语义色在
`--eb-*`（business-ui），办公语义在 `--ot-*`（产品层）——上层只准引用下层，禁止反向回流。

令牌单一事实源是 `packages/evoke-tools-ui/src/styles/variables.css`；本页与 `pnpm tokens:export`
产出的 `design-tokens/evoke-tools-ui.{light,dark}.json` 同源，构建期 `check-density.mjs` 逐项对照。

## 双层架构

| 层 | 令牌族 | 覆盖时机 |
| --- | --- | --- |
| 语义层（主题 API 入口） | `--et-chrome-*` `--et-density-*` `--et-focus-*` `--et-z-*` `--et-state-*` | 产品可覆盖 |
| 设计层（度量常量） | `--et-size-*` `--et-space-*` `--et-radius-*` `--et-duration-*` `--et-icon-*` `--et-menu-*` `--et-panel-*` `--et-statusbar-*` | 一般不覆盖 |

命名：`--et-<域>-<对象>[-<属性>][-<状态>]`，例：`--et-chrome-toolarea-height`、`--et-size-toolbtn-large`。

## 三档密度

密度是**根级属性**（`<html data-density>`，由 `EtProvider` 写入），不是组件 prop。
组件只引用令牌，禁止用 `size` prop 分支实现密度。

```vue
<et-provider density="compact">
  <app />
</et-provider>
```

| 令牌 | 紧凑 | 默认 | 宽松 |
| --- | --- | --- | --- |
| `--et-density-base-font` | 12px | 13px | 14px |
| `--et-density-caption-font` | 11px | 12px | 13px |
| `--et-density-control-height` | 24px | 32px | 40px |
| `--et-size-toolbtn-large` | 48px | 56px | 64px |
| `--et-size-toolbtn-small` | 24px | 28px | 36px |
| `--et-size-row`（工具界面列表行） | 20px | 24px | 28px |
| `--et-icon-sm` | 14px | 16px | 20px |
| `--et-icon-lg` | 20px | 24px | 28px |
| `--et-space-inline` / `--et-space-block` | 2 / 6 | 4 / 8 | 6 / 12 |

控件高 24/32/40 对齐 Fluent UI 的 small/medium/large 实测阶梯（Input/Dropdown 同值），
不发明自己的档位。

## chrome 度量与预算

各带高度与合计预算都是 `calc()` 派生：改分量，预算自动跟随。

| 令牌 | 用途 | 默认档 |
| --- | --- | --- |
| `--et-chrome-titlebar-height` | 标题栏 | 32px |
| `--et-chrome-tabstrip-height` | tab 条 | 26px |
| `--et-chrome-toolarea-height` | 工具区（控件行 + 组标题行） | 72px |
| `--et-chrome-toolarea-collapsed` | 折叠态工具区 | 0px |
| `--et-chrome-auxbar-height` | 辅助栏位（产品层可承载公式栏） | 26px |
| `--et-chrome-statusbar-height` | 状态栏 | 24px |
| `--et-chrome-group-label-height` | 组标题行（固定，不随内容撑开） | 16px |
| `--et-chrome-top-budget` | 顶部合计预算 | 156px |
| `--et-chrome-total-budget` | chrome 合计预算 | 180px |

折叠后顶部 = 标题栏 + tab 条 + 辅助栏 = 84px（`--et-chrome-collapsed-top-budget`）。
G7 门把"布局属性禁字面量 px"做成构建期硬检查；真实装配下的不变量由视觉断言覆盖。

## 控件尺寸与状态

| 令牌 | 用途 | 默认档 |
| --- | --- | --- |
| `--et-toolbtn-icon-box` | 大钮图标盒（固定方形） | 24px |
| `--et-toolbtn-caption-line-height` | 大钮 caption 行高（整数钉死） | 16px |
| `--et-menu-item-height` | 菜单项高（随密度，与控件高一致） | 32px |
| `--et-menu-icon-gutter` | 菜单项图标位固定宽（无图标也留位） | 20px |
| `--et-panel-header-height` | 面板标题栏 | 28px |
| `--et-statusbar-item-gap` | 状态栏条目间距 | 12px |
| `--et-toolbtn-caret-size` | 「按钮+下拉」指示尺寸 | 14px |

状态视觉只做底色/文字色差异：

```
--et-state-hover-bg      → var(--eb-fill-color-light)   hover 禁跳强调色，只加深一档
--et-state-active-bg     → var(--eb-fill-color)
--et-state-selected-fg   → var(--eb-color-primary)
--et-state-disabled-fg   → var(--eb-text-color-disabled)
--et-focus-ring-color    → var(--eb-color-primary)      宽 2px，offset 1px
```

## 层级（z-index 阶梯）

`--et-z-chrome`（100）→ `--et-z-panel`（200）→ `--et-z-popover`（跟随 `--eb-z-index-popper`）
→ `--et-z-peek`（2100）→ `--et-z-modal`（3000）→ `--et-z-notify`（4000）。
组件内禁写 `z-index: 9999`。

## 圆角 / 动效 / 图标

- 圆角：`--et-radius-sm/md/lg` = 2/4/6px（比中后台小一档）。
- 动效时长引用 `--eb-duration-*`；默认态**无位移无缩放**，只过渡背景/边框/颜色。
- 图标档位：xs 14（状态栏）/ sm 16（菜单项、小钮）/ md 20 / lg 24（工具区大钮）/ xl 28；
  同容器尺寸档 ≤2；默认 line 风格，fill 仅用于激活/选中；图标与文字间距用 `--et-icon-gap-*`。
- 图标未命中禁渲染空白：回落显式兜底图标 `question-circle`（dev 下 `console.warn`）；
  构建期 G2 门把悬空名做成失败。

## 主题与暗色

明暗继承 `html.dark`（business-ui）；`--et-*` 不新增色板，只声明"与亮色不同映射"的少数项
（`src/styles/dark.css`）。品牌换色继承 `setPrimaryColor()`；画布侧调色板桥接（`EtThemeBridge`，
M3）由产品层 `--ot-*` 提供语义名。

## 命令契约（M1）

命令是单一事实源：id / title / desc / icon / keys / enabled(ctx) / active(ctx) / run(ctx)。

```js
import { createCommandRegistry } from '@wil-works/evoke-tools-ui/runtime'

const registry = createCommandRegistry()
registry.register({
  id: 'bold',
  title: '加粗',
  keys: 'mod+b',                                   // 登记期校验拼写
  surfaces: ['toolbar', 'menu', 'context', 'palette'],
  enabled: (ctx) => !!ctx.hasSelection,             // 唯一一处推演
  active: (ctx) => !!ctx.format?.bold,
  run: () => {},
})
```

- **状态一处实现**：`registry.state(id, ctx)` 是唯一出口；工具区 / 右键 / 命令面板三处同源
  （G3 门在构建期禁组件本地推演 `enabled`/`active`）。
- **四处可达**：`buildReachabilityReport({ registry, schemas })` 自动核对每条命令至少在一个可达面。
- **schema 驱动工具区**：tab → 组 → 条目；条目形态由 `grid.rowSpan = 2`（大钮）/ `width`（输入类控件）
  声明；产品用 `mergeSchema` 在默认 schema 上打补丁，`pruneSchema` 剪空节点。
- **分量降级**：`scaleGroup` 三档（FULL → 小图标 → 整组变下拉），`planGroupScaleTiers` 按实测宽度
  逐组降档，仍放不下整组收进行尾「更多」——禁换行。
- **真折叠**：`Ctrl+F1` / `⌥⌘R` / 双击 tab 条；折叠后高度 0，命令经 peek 浮层可达（用户操作，
  非测试逃生口）；`persistKey` 按产品持久化。
- **键位表**：`buildShortcutTable(registry)` 从命令表生成（不手写列表），`detectKeyConflicts`
  登记期报冲突。

## 工作台契约（M2）

布局是一棵可序列化的树（dock left/right/bottom + 面板），**`EtWorkbench` 是唯一写树处**：

```js
import { createLayoutTree, togglePanelCollapsed } from '@wil-works/evoke-tools-ui/runtime'

const layout = ref(createLayoutTree({
  docks: [
    { id: 'left', side: 'left', panels: [{ id: 'files', title: '文件', size: 300, min: 220 }] },
    { id: 'bottom', side: 'bottom', panels: [{ id: 'log', title: '日志', size: 180 }] },
  ],
}))
```

- **区域槽**：`titlebar` / `documents` / `toolbar`（放 `EtRibbonBar`）/ `canvas`（默认槽）/
  `statusbar` / `panel`（作用域槽 `{ panel, dock }`，按 id 映射内容组件）；
- **持久化**：`persistKey` 非空即读回 + 变更写盘（`layoutEquals` 无变更不写；异常静默）；
- **损坏降级**：坏 prop / 坏 JSON / 半坏树 → 默认布局 + `layout-corrupted` 事件 + dev warn，
  **不白屏**；降级后修好的树覆写存储（损坏只提示一次）；
- **停靠呈现**：`presentation`（默认 `stack` 同屏并列、尺寸分摊；`tabs` 单渲染位 tab 化）进树，
  刷新不丢；面板 `hidden` 是显式状态，重置布局可恢复；
- **`EtDocumentTabs`**：脏标记（圆点 + aria 双通道）、关闭确认可选、溢出列表复用
  `planOverflow`；**复用检验**：非办公域（日志分析器）同一套框架零改逻辑搭出完整工作台。

## 画布契约与取证（消费方必读）

tools-ui 只做到 chrome 与命令面：**画布内容的渲染契约归消费方引擎**。框架的四条兜底——
图标未命中回落显式兜底、布局损坏降级默认布局不白屏、存储异常静默、命令状态单点同源——
都不覆盖画布，也不该覆盖（框架插入画布重绘钩子就越过 `--ot-*` 边界了）。

消费方引擎的硬契约（office-works P1-10 的教训，2026-09-26）：

- **几何变更必须可见于渲染器**：宿主直接改视图状态（zoom / scroll / freeze / 行列规格）后，
  渲染器要么自己对几何签名做帧比对（签名变即重绘），要么每个变更点显式 requestRender。
  "让宿主记得调"的约定必漏——漏一处的形态就是画布停在旧几何，点一下画布才渲染
  （点击走 mousedown → setSelection → requestRender，成了当时唯一能触达渲染器的路径）；
- **取证实证要元素级**：画布有没有真重绘，用**元素级截图哈希**证明，不要用整页截图——
  演示条上的读数（如「110%」）本身就在改像素，整页比对会被污染出假阳性；
- **滚轮同罪**：wheel handler 改几何后同样要触达渲染器，别把"镜像 aria 断言"当画布重绘的证据。

## 已知限制（M0/M1/M2）

- **Dropdown / Select 的浮层挂不上 `et-*` 类**：底座 `EbDropdown` / `EbSelect` 的浮层经
  `<Teleport to="body">` 渲染，popper 容器类固定、不接受外部注入（`EbTooltip` 可以）。
  因此 `--et-menu-*` 的密度覆盖写在全局底座浮层类上（`.eb-dropdown__popper` /
  `.eb-select__dropdown`）——加载了本库样式的工具界面即生效；要"et-* 真挂到这两类浮层"
  需底座加类钩子，属底座改动，M1 单独评估。
- **底座槽位语义**（实现时踩过，记录备查）：`EbTooltip` 的默认子内容是**触发器**、
  具名 `content` 才是浮层内容；`EbDropdown` 的默认子内容同样会顶掉触发器，菜单须放
  `#dropdown` 槽。上层包装件已按此接线并在 JSDoc 注明。
- **`EbTooltip` 的 `trigger` 校验集缺 `'manual'`**（`EbPopper` 有）：想完全接管触发路径
  （`EtScreenTip` 的 hover+focus 双路）目前会吃一条 dev warn，组件侧用"默认 hover +
  切档后重调 show()"绕过，行为有测试锁定；底座补 `'manual'` 属底座改动，M1 评估。
- **`EtSplitter` 的键盘 resize 未做**：拖拽条由底座 `EbSplitterPanel` 渲染，键盘增强放进
  M2 的面板树运行时（框架自有代码面）再做。
- **组标题行 y 对齐的前提是同排组都有 label**（label 为空不渲染标题行，计划契约如此）；
  混排场景的等高占位由 L2 `EtRibbonBar` 负责。
- **EtCommandPalette 的执行体归消费方**（`runOnSelect` 默认 false，与工具区/右键的 `@command`
  约定一致；true 为便捷模式：选中即 `registry.run`）。
- **chrome 横带的分隔线不要用 `border`**：border 会吃掉 1px 内容盒，工具区内容就比
  `--et-chrome-toolarea-height` 少 1px，组标题行的 y 会漂（示例用
  `box-shadow: inset …` 画分隔，视觉断言"组标题行同一 y"因此成立）。

## 令牌导出

```bash
pnpm tokens:export   # → design-tokens/evoke-tools-ui.{light,dark}.json（提交进仓）
```

令牌值变更 = 可能破坏所有消费方视觉基线 → 走版本号 minor/major，并在 CHANGELOG 标注。
