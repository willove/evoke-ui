# 设计规范

中后台界面的视觉基准：色彩、间距、字体、圆角与阴影、动效。开发直接使用对应的 `--eb-*` 令牌，改令牌即改主题（含暗色自动跟随）；令牌完整清单可用 `pnpm tokens:export` 导出为 JSON。

## 色彩

### 品牌与语义色

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--eb-color-primary` | #175DFF | 主操作、选中态、链接 |
| `--eb-color-success` | #16a34a | 成功、通过、在线 |
| `--eb-color-warning` | #d97706 | 警告、待处理、风险提示 |
| `--eb-color-danger` | #dc2626 | 错误、失败、危险操作 |
| `--eb-color-info` | #64748b | 中性信息、说明 |

每个语义色带 `light-3 / light-5 / light-7 / light-8 / light-9` 浅色梯度（Tag / Alert / 进度等组件的内层用色）与 `-rgb` 三元组（透明度派生用）。运行时换色用 `setPrimaryColor(hex)` / `setSemanticColors()`，全库梯度自动重派生。

### 中性色

| 层级 | 令牌 | 值 |
| --- | --- | --- |
| 正文主色 | `--eb-text-color-primary` | #111827 |
| 正文常规 | `--eb-text-color-regular` | #374151 |
| 次要文字 | `--eb-text-color-secondary` | #6b7280 |
| 占位文字 | `--eb-text-color-placeholder` | #9ca3af |
| 禁用文字 | `--eb-text-color-disabled` | #d1d5db |
| 页面底 | `--eb-bg-color-page` | #f9fafb |
| 容器底 | `--eb-bg-color` | #ffffff |
| 边框（常规 / 轻 / 重） | `--eb-border-color(-light/-dark)` | #e0e3ea / #e8ebf1 / #d6d9e0 |

文字层级按「越重要越深」取用；对比度实测数据见[「无障碍与对比度」](/guide/accessibility)。

### 扩展分类色

数据可视化、状态分类标签可用 8 个扩展色：`ext-cyan / teal / violet / magenta / indigo / lime / amber / slate`。相邻分类取色相间隔开的两色，避免同屏出现明度接近的相邻色。

## 间距

4px 网格，`--eb-space-1` 到 `--eb-space-12`（4 / 8 / 12 / 16 / 20 / 24 / 28 / 32 / 40 / 48px）。

- 组件内元素间距：space-1 ~ space-3（4–12px）
- 组件与组件：space-4 ~ space-6（16–24px）
- 区块之间：space-8 起（32px+）
- 页面留白：容器两侧 space-6 ~ space-8，禁止 0 边距贴边

## 字体

字族：`--eb-font-family`（Inter + 系统栈，中文回退 PingFang SC / Microsoft YaHei）。

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--eb-font-size-xs` | 12px | 辅助说明、表单错误提示 |
| `--eb-font-size-sm` | 13px | 次要信息、标签 |
| `--eb-font-size-base` | 14px | 正文、控件默认字号 |
| `--eb-font-size-md` | 16px | 小标题、强调正文 |
| `--eb-font-size-lg` | 20px | 区块标题 |
| `--eb-font-size-xl` ~ `3xl` | 24–40px | 页面级标题、数据大屏 |

字重三档：regular 400（正文）/ medium 500（控件、强调）/ semibold 600（标题）。行高：紧凑 1.3（标题）、常规 1.57（正文）、宽松 1.8（说明段落）。数字统计场景用 `font-variant-numeric: tabular-nums`（表格与统计组件已内置）。

## 圆角与阴影

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--eb-radius-sm` | 4px | 小控件（checkbox、tag） |
| `--eb-radius-md` | 6px | 输入框、按钮（默认） |
| `--eb-radius-lg` | 8px | 卡片、面板 |
| `--eb-radius-xl` | 12px | 弹窗、大容器 |
| `--eb-radius-full` | 9999px | 胶囊 |

阴影五档（`--eb-shadow-1` ~ `5`），克制不抢内容：1–2 档给卡片悬浮，3 档给下拉浮层，4–5 档给模态弹窗。暗色下阴影整体加深，令牌自动重映射。

## 动效

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--eb-duration-fast` | 0.1s | hover / 边框 / 底色反馈 |
| `--eb-duration-base` | 0.2s | 展开、位移过渡 |
| `--eb-duration-slow` | 0.3s | 弹层进出场 |
| `--eb-duration-slower` | 0.45s | 大面积区块、抽屉 |

缓动默认 `--eb-ease-out`（快进慢收）；弹性场景（徽标弹入、轻抬）用 `--eb-ease-out-back`。系统开启「减弱动态效果」时，动效组件自动关闭，无需逐个处理。
