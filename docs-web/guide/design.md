---
outline: [2, 3]
---

# 设计语言

Evoke UI 的设计主线是「**安静优雅**」。官网是产品的第一印象，它要传达情绪与氛围，
而不是堆叠信息 —— 这与中后台 Dashboard 的诉求截然不同，因此需要一套专门为站点设计的语言。

## 官网 UI ≠ 中后台 UI

| 维度 | 中后台 Dashboard | 官网 / 产品站（本库） |
| --- | --- | --- |
| 目标 | 信息效率、操作密度 | 情绪传达、品牌氛围 |
| 排版 | 13~14px 中字重，紧凑网格 | **细字重展示标题**（weight 400 大字）、1.7 透气正文 |
| 色彩 | 语义色驱动，强状态 | 主色克制给焦点，大面积留白与淡雾底 |
| 层次 | 边框 + 分割线切分 | **留白切分**，边框更轻、阴影更弥散 |
| 动效 | 即时反馈为主 | 滚动浮现、悬浮微抬、spring 弹入 |

## 五条设计准则

1. **细字重展示体** —— 标题默认 weight 400 + `-0.02em` 字距，大而轻；需要冲击时再切 `--ev-display-weight-strong: 600`
2. **呼吸感** —— 区块间距 96px 级、正文行高 1.7、标题 `text-wrap: balance`；结构靠留白而非线
3. **安静组件** —— 边框用最轻一档（`#F0F2F8`），阴影是"托起"不是"投影"；主色 `#0D70FF` 只给交互焦点与关键 CTA
4. **微交互有弹性** —— hover 徽标弹入、卡片轻抬 2~3px；其余一律 0.2s ease-in-out
5. **明暗一体** —— 全部语义令牌在 `html.dark` 下重映射，暗色不是反色而是重新调音

## 令牌一览

| 分组 | 令牌 |
| --- | --- |
| 主色 | `--ev-color-primary`（#0D70FF）及 light-3/5/7/8/9、dark-2、rgb 游标 |
| 墨色 | `--ev-color-ink`（#1A2947）`--ev-color-ink-secondary` `--ev-color-ink-muted` |
| 背景 | `--ev-bg-page/soft/muted/container` `--ev-gradient-hero` |
| 边框/填充 | `--ev-border-color(-light/-dark)` `--ev-fill-1/2/3` |
| 粉彩 | `--ev-pastel-cream/blue/mint/pink/lime` |
| 展示体 | `--ev-display-weight(-strong)` `--ev-display-letter-spacing` `--ev-display-line-height` |
| 动效 | `--ev-ease-spring/smooth` `--ev-duration-fast/base/slow/slower` |
| 形状 | `--ev-radius-sm…2xl/full` `--ev-shadow-1…4` |

## 组件与语言的关系

- **EvHero / EvSection**：光带渐变底 + 细字重标题，是设计语言的门面
- **EvSearchBox / EvIconGrid**：三段式大搜索栏与致密图标网格，是工具站与开源项目站首页的焦点组件
- **EvCard**：粉彩贴纸与深色精选两种卡面，覆盖作品集与转化场景
- **EvPricingCard / EvFaq / EvCta / EvNewsletter**：完整的转化链路区块
- **v-reveal**：滚动入场时的统一浮现动效，配合 spring 微交互
