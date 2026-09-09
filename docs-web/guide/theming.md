# 主题与暗色模式

## 设计令牌（--ew-* 命名空间）

全库仅使用 `--ew-*` 单一命名空间（构建期 `check-token-rule.mjs` 强制，禁用其它库的令牌前缀），双层架构：

**语义层（主题 API 入口）**

| 令牌 | 默认值 | 说明 |
| --- | --- | --- |
| `--ew-color-primary` | `#0D70FF` | Launch Blue 主色（light-3/5/7/8/9、dark-2、rgb 游标配套） |
| `--ew-text-primary/regular/secondary` | `#1A2947` 系 | 藏青墨色文本层级 |
| `--ew-bg-page/soft/muted/container` | `#FFFFFF` 系 | 页面 / hero 淡蓝灰 / 淡雾 / 卡面 |
| `--ew-border-color(-light/-dark)` | `#E4E8F1` 系 | 边框 |
| `--ew-fill-1/2/3` | `#F5F7FC` 系 | 填充与悬浮底 |
| `--ew-pastel-cream/blue/mint/pink/lime` | — | 粉彩卡片底 |
| `--ew-color-accent-lime/orange` | — | 促销点缀 |

**设计层（本库设计语言）**

| 令牌 | 说明 |
| --- | --- |
| `--ew-ease-spring` | 弹性微交互曲线 `cubic-bezier(0.3, 1.3, 0.3, 1)` |
| `--ew-duration-fast/base/slow/slower` | 0.15 / 0.2 / 0.3 / 0.5s |
| `--ew-space-1…20` | 4px 网格间距 |
| `--ew-font-size-xs…5xl` | 字号阶（base 15px） |
| `--ew-radius-sm…2xl/full` | 6 / 10 / 14 / 20 / 28 / 999px |
| `--ew-shadow-1…4` | 藏青染色软阴影四级 |
| `--ew-display-letter-spacing` | 展示型标题字距 `-0.03em` |
| `--ew-container-width` | 内容容器宽 1152px |

## 暗色模式

组件库不自动开启暗色，两步接入：

### 1. useTheme（推荐）

```vue
<script setup>
import { EwThemeToggle } from '@wil-works/evoke-ui'
// 或底层 API：const { isDark, toggleTheme, setTheme } = useTheme()
</script>

<template>
  <!-- 日/月图标随状态切换，内部基于 useTheme -->
  <EwThemeToggle variant="soft" />
</template>
```

- 优先级：localStorage 记忆（key `ew-theme`）> 系统偏好
- 机制：切换 `html.dark` 类，`variables.css` 内 `html.dark` 块重映射全部语义令牌
- `app.use(EvokeUI)` 时自动初始化一次（读记忆/系统偏好并落类）

### 2. 直接操作

```js
document.documentElement.classList.add('dark') // 开启暗色
```

::: tip 与文档站一致
VitePress 默认主题同样以 `html.dark` 驱动暗色 —— 本文档站右上角切换按钮即同时驱动库的暗色令牌，下列演示可直接体验。
:::

<DemoBlock title="明暗切换实测" description="点击切换右上角或下方按钮，卡片与按钮令牌即时重映射。">

<div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
  <EwThemeToggle variant="soft" />
  <EwThemeToggle round />
  <EwCard tone="cream" sticker style="padding:16px 20px;">贴纸卡：奶油底在暗色下呈暖褐调</EwCard>
</div>

</DemoBlock>

## 令牌定制

覆盖语义层令牌即可整体换肤（组件层全部经令牌取值）：

```css
:root {
  --ew-color-primary: #7c3aed;
  --ew-color-primary-light-9: #f3ecfe;
  --ew-radius-lg: 12px;
}
```
