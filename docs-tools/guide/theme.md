# 主题与画布桥

EtThemeBridge 把主题令牌桥接成画布调色板：零 DOM、无色值、随主题联动。

## 三层令牌契约

```text
--eb-*/--ew-*   基础（品牌色、中性色阶、间距、圆角、字体基线）
      ↓ 只准被引用
--et-*          工具框架（密度三档、chrome 度量、焦点环、控件尺寸与状态）
      ↓ 只准被引用
--ot-*          办公语义（画布网格 / 选区 / 表头 / 活动格）
```

上层只准引用下层，禁止反向回流，每层独立门禁。全量表见[设计规范](design.md#双层架构)，本页不重复。

## 零 DOM 的桥

```vue
<et-theme-bridge />
```

放进工作台画布区即可：不占布局、不吃事件、render 返回 null。`palette` prop 可整体替换以追加角色，`target` 支持 `'html'` / CSS 选择器 / Element 实例。

## 登记表

`CANVAS_PALETTE` 是画布角色到主题侧令牌名的唯一事实源，加角色只改这张表：

| 画布角色 | 主题侧令牌 |
| --- | --- |
| `canvas-bg` | `--eb-bg-color` |
| `canvas-grid-line` | `--eb-border-color-lighter` |
| `canvas-header-bg` | `--eb-fill-color-light` |
| `canvas-header-text` | `--eb-text-color-primary` |
| `canvas-selection-bg` | `--eb-color-primary-light-9` |
| `canvas-selection-border` | `--eb-color-primary` |
| `canvas-active-cell-border` | `--eb-color-primary` |
| `canvas-comment-bg` | `--eb-color-warning-light-9` |
| `canvas-text` | `--eb-text-color-regular` |
| `canvas-text-muted` | `--eb-text-color-secondary` |

落值统一加 `--ot-` 前缀：角色 `canvas-bg` 写成自定义属性 `--ot-canvas-bg`，画布侧 CSS 引用同名即可。

## 追加画布角色

```js
import { CANVAS_PALETTE } from '@wil-works/evoke-tools-ui/runtime'

const palette = { ...CANVAS_PALETTE, 'canvas-frozen-line': '--eb-border-color' }
```

```vue
<et-theme-bridge :palette="palette" />
```

主题侧没有这个令牌时，空值角色不写 `--ot-*`（不静默注入错色），由画布侧自己兜底。登记表里只有令牌名、没有色值，换品牌色或暗色都不用改它。

## 暗色联动

明暗继承 `html.dark`，品牌换色继承 `setPrimaryColor()`。`observeThemeChanges` 盯 `:root` 的 `class` / `style` / `data-theme` / `data-density`，变化即重跑解析与落值；写值自身也触发订阅，按签名去重，不会自激循环。组件卸载时退订，禁观察器泄漏。

## 相关页

- [EtThemeBridge](/components/theme-bridge)：props 与 `target` 解析规则。
- [设计规范](design.md#主题与暗色)：明暗与品牌换色的继承口径。
- [工作台布局](workbench.md)：桥接件挂在哪一格。
