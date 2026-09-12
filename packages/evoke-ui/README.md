# @wil-works/evoke-ui

> **⚠️ 本包正在开发迭代中，尚未发布正式版：API、组件与视觉细节可能随版本调整，请勿用于生产环境。**

Evoke UI — 纯 JS Vue3 **官网/纯前端站点**组件库，Clean Navy 设计语言（细字重展示排版 · 呼吸感 · 精致微交互），明暗双主题与运行时主题定制开箱即用。

[![npm](https://img.shields.io/npm/v/@wil-works/evoke-ui.svg)](https://www.npmjs.com/package/@wil-works/evoke-ui) · **在线文档**：[evoke-ui.wil-works.com](https://evoke-ui.wil-works.com)

## 特性

- **Clean Navy 设计语言**：藏青墨色 × 淡雾底 × Launch Blue，细字重展示标题与呼吸感排版，明暗双主题（`html.dark` 令牌重映射）
- **运行时主题定制**：主色（淡色阶自动生成）/ 圆角 / 间距 / 容器宽四维配置，`EvConfigProvider` 或 `useThemeConfig` 即时生效
- **签名组件**：`EvSearchBox` 大搜索栏 + `EvIconGrid` 可搜索图标网格（内置 960+ 图标，点击复制图标名）
- **官网区块全家桶**：Hero / 导航页脚 / 定价对比 / FAQ / 文章与个人名片 / 音视频与留言表单，企业站与个人站要素齐备
- **零运行时依赖**：仅 peer vue；图标为生成期静态快照，展示集独立 chunk 按需加载
- **轻量动效**：spring 弹性微交互 + `v-reveal` 滚动浮现指令

> 图标：核心集 39 个语义名内置；展示集 922 个原生名按需加载。组件 class 前缀 `ev-`、令牌前缀 `--ev-*` 为本库独立命名空间。

## 安装

```bash
pnpm add @wil-works/evoke-ui
```

```js
import { createApp } from 'vue'
import EvokeUI from '@wil-works/evoke-ui'
import '@wil-works/evoke-ui/styles'

const app = createApp(App)
app.use(EvokeUI) // 全量注册 Ev* 组件 + v-reveal 指令 + 主题初始化
```

## 组件一览

| 分类 | 组件 |
| --- | --- |
| 基础 | `EvIcon` `EvButton` `EvIconButton` `EvTag` `EvBadge` `EvKeycap` `EvTabs` `EvSwitch` `EvAvatar` `EvAvatarGroup` |
| 表单 | `EvInput` `EvTextarea` `EvSelect` `EvField` |
| 布局 | `EvSection` `EvCard` `EvHero` `EvNavbar` `EvFooter` `EvContainer` `EvConfigProvider` |
| 区块 | `EvSearchBox` `EvIconGrid` `EvFeatureGrid` `EvPricingCard` `EvFaq` `EvQuote` `EvStatistic` `EvAlert` `EvTimeline` `EvComparisonTable` `EvCta` `EvNewsletter` `EvLogoCloud` `EvArticleCard` `EvProfileCard` `EvMarquee` |
| 媒体与交互 | `EvVideo` `EvAudio` `EvCarousel` `EvContactForm` |
| 反馈与主题 | `EvCodeBlock` `EvThemeToggle` |
| 移动端 | `EvNavBar` `EvTabbar` `EvTabbarItem` `EvActionSheet` `EvPullRefresh` `EvLoadMore` |

组合式 API：`useTheme`（明暗切换）/ `useCopy`（剪贴板）/ `useThemeConfig`（主题四维定制 + `applyPreset` 风格方案）；
预设：`EV_STYLE_PRESETS`（企业官网/个人站/设计工作室等一键方案）与颜色/圆角/间距/容器四组单项预设；
指令：`v-reveal`（滚动浮现，五种变体）；图标注册表：`registerIcons` / `getIconByName` / `loadShowcaseIcons`。

## 文档

组件 API、用法示例与主题定制器见在线文档站：[evoke-ui.wil-works.com](https://evoke-ui.wil-works.com)。

## License

MIT（图标形状源自 Remix Icon，Remix Icon License v1.0，免费商用）
