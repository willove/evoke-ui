# 快速开始

## 安装

```bash
pnpm add @wil-works/evoke-ui
```

## 全量引入

```js
import { createApp } from 'vue'
import EvokeUI from '@wil-works/evoke-ui'
import '@wil-works/evoke-ui/styles'

const app = createApp(App)
app.use(EvokeUI) // 注册全部 Ew* 组件 + v-reveal 指令 + 主题初始化
```

## 按需引入

库为 ES Module 单入口，配合构建器 Tree-shaking 即为按需：

```js
import { EwButton, EwHero, EwSearchBox } from '@wil-works/evoke-ui'
import '@wil-works/evoke-ui/styles' // 样式聚合为单一产物，一次引入
```

## 组件一览

| 分类 | 组件 |
| --- | --- |
| 基础 | EwIcon · EwButton · EwIconButton · EwTag · EwBadge · EwKeycap · EwTabs · EwSwitch · EwAvatar · EwAvatarGroup |
| 布局 | EwSection · EwCard · EwHero · EwNavbar · EwFooter · EwContainer · EwConfigProvider |
| 站点区块 | EwSearchBox · EwIconGrid · EwFeatureGrid · EwPricingCard · EwFaq · EwQuote · EwStatistic · EwAlert · EwTimeline · EwComparisonTable · EwCta · EwNewsletter · EwLogoCloud · EwArticleCard · EwProfileCard |
| 媒体与交互 | EwVideo · EwAudio · EwCarousel · EwContactForm |
| 反馈与主题 | EwCodeBlock · EwThemeToggle |

## Composables 与指令

| API | 说明 |
| --- | --- |
| `useTheme()` | 明暗主题（isDark / setTheme / toggleTheme），驱动 `html.dark` 令牌重映射 |
| `useCopy()` | 剪贴板复制（copied 状态自动复位，带 execCommand 降级） |
| `v-reveal` | 滚动浮现指令，支持 `{ delay }` 交错入场 |
| `loadShowcaseIcons()` | 按需加载 900+ 展示图标（独立 chunk），加载后 EwIcon 可用 Remix 原生名渲染 |
| `registerIcons()` | 注册自定义图标 |

## 一个典型官网首页骨架

```vue
<template>
  <EwNavbar :items="nav" logo-text="cumubase" />
  <EwHero title="轻盈优雅的云端笔记" description="一句话讲清价值主张。">
    <template #actions>
      <EwButton pill size="large">立即下载</EwButton>
      <EwButton variant="outline" size="large">了解更多</EwButton>
    </template>
  </EwHero>
  <EwSection eyebrow="features" title="为什么选择我们">
    <EwFeatureGrid variant="cards" :items="features" />
  </EwSection>
  <EwFooter :columns="footerCols" copyright="© 2026 积云数合" />
</template>
```

::: tip 姊妹库推荐
做中后台管理系统？推荐同族的 [Evoke Business UI](https://evoke-business-ui.wil-works.com) —— 150+ 中后台组件、8 个业务场景组件与 20+ 种 Canvas 自绘图表，包名 [`@wil-works/evoke-business-ui`](https://www.npmjs.com/package/@wil-works/evoke-business-ui)。
:::
