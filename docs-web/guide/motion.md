# 动效

Evoke UI 的动效主张是「**克制而有生命**」：位移用平滑曲线、浮现用 spring 弹性、其余一律
`0.2s ease-in-out`。所有动效遵循 `prefers-reduced-motion`，系统开启「减弱动态效果」时自动关闭。

每个演示都配了「重新播放」—— 通过重挂载（`:key` 递增）再次触发同一动效。

<script setup>
import { ref } from 'vue'
const revealKey = ref(0)
const countKey = ref(0)
const marqueeKey = ref(0)
</script>

## 动效令牌

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--ev-ease-spring` | `cubic-bezier(0.3, 1.3, 0.3, 1)` | 弹性入场（滑块、徽标弹入） |
| `--ev-ease-smooth` | `cubic-bezier(0.34, 0.69, 0.1, 1)` | 位移滑动（轮播、开关、卡片） |
| `--ev-ease-out` | `cubic-bezier(0.215, 0.61, 0.355, 1)` | 淡入 |
| `--ev-duration-fast / base / slow / slower` | 0.15 / 0.2 / 0.3 / 0.5s | 时长阶 |

## v-reveal 滚动入场

元素进入视口时浮现。五种方向变体 + 交错延迟，默认只触发一次（`once: false` 可反复触发）：

<DemoBlock title="五种入场变体" description="点「重新播放」或再次滚过本区块即可复现。">

<div style="display:flex; justify-content:flex-end; margin-bottom:12px;">
  <EvButton size="small" variant="outline" icon="refresh" @click="revealKey++">重新播放</EvButton>
</div>
<div :key="revealKey" class="reveal-demo">
  <div v-reveal="{ type: 'up', delay: 0 }" class="reveal-demo__card">up</div>
  <div v-reveal="{ type: 'left', delay: 80 }" class="reveal-demo__card">left</div>
  <div v-reveal="{ type: 'right', delay: 160 }" class="reveal-demo__card">right</div>
  <div v-reveal="{ type: 'zoom', delay: 240 }" class="reveal-demo__card">zoom</div>
  <div v-reveal="{ type: 'fade', delay: 320 }" class="reveal-demo__card">fade</div>
</div>

```vue
<div v-reveal="{ type: 'zoom', delay: 240 }">…</div>
```

</DemoBlock>

## 数字滚动

[EvStatistic](/components/statistic) 的 `animated` 属性让数值进入视口时从 0 滚到目标值：
easeOutExpo 缓动（起步迅猛、收尾徐缓），自动解析前后缀（`120K+`、`99.99%`、`¥68`）：

<DemoBlock title="count-up" description="点「重新播放」再看一遍；duration 越长收尾越从容。">

<div style="display:flex; justify-content:flex-end; margin-bottom:12px;">
  <EvButton size="small" variant="outline" icon="refresh" @click="countKey++">重新播放</EvButton>
</div>
<div :key="countKey" style="display:flex; gap:48px; justify-content:center;">
  <EvStatistic value="1,200+" label="周下载" align="center" animated />
  <EvStatistic value="99.99%" label="可用性" align="center" animated />
  <EvStatistic value="38" label="组件" align="center" animated />
</div>

```vue
<EvStatistic value="1,200+" label="周下载" align="center" animated :duration="1600" />
```

</DemoBlock>

## 内建动效的组件

| 组件 | 动效 |
| --- | --- |
| [EvMarquee](/components/marquee) | 无限滚动横幅；文本模式 = 商场 LED 大字（实心/描边交替） |
| [EvTabs](/components/tabs) | capsule 分段滑块弹性跟随激活项 |
| [EvFeatureGrid](/components/feature-grid) | cards 默认交错入场（`reveal` / `stagger` 控制） |
| [EvHero](/components/hero) | `reveal` 开启后徽章→标题→描述→动作 90ms 错峰入场 |
| [EvNavbar](/components/navbar) | `hide-on-scroll` 下滑隐藏上滑浮现；滚动磨砂 |
| [EvCarousel](/components/carousel) | 平滑位移轮播 + 自动播放 |
| [EvCard](/components/card) / [EvArticleCard](/components/article-card) | 悬浮轻抬 + 封面缓放 |
| [EvFaq](/components/faq) | grid-rows 平滑展开 |
| [EvSwitch](/components/switch) / [EvIconGrid](/components/icon-grid) | spring 滑块 / 徽标弹入 |

## 动感文本滚动

<DemoBlock title="商场 LED 风格大字横幅" description="EvMarquee 文本模式：大写大字 + 实心/描边交替 + 主色分隔符；hover 暂停。点「重新播放」重看一次入场。">

<div style="display:flex; justify-content:flex-end; margin-bottom:12px;">
  <EvButton size="small" variant="outline" icon="refresh" @click="marqueeKey++">重新播放</EvButton>
</div>
<EvMarquee
  :key="marqueeKey"
  :items="['Evoke UI', 'CLEAN NAVY', '轻与快', 'DELIGHTFUL MOTION', '明暗一体']"
  separator="star-fill"
  :duration="14000"
  text-size="44px"
/>

```vue
<EvMarquee
  :items="['EVOKE UI', 'CLEAN NAVY', '轻与快', 'DELIGHTFUL MOTION']"
  separator="star-fill"
  alternate-outline
  :duration="14000"
  text-size="44px"
/>
```

</DemoBlock>

## 重新触发动效的通用手法

一次性动效（reveal / count-up）重放的最简方式是**重挂载**——给容器绑定递增的 `:key`：

```vue
<script setup>
import { ref } from 'vue'
const countKey = ref(0)
</script>

<template>
  <EvButton size="small" variant="outline" icon="refresh" @click="countKey++">
    重新播放
  </EvButton>
  <EvStatistic :key="countKey" value="1,200+" animated />
</template>
```

<style>
.reveal-demo {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.reveal-demo__card {
  flex: 1;
  min-width: 90px;
  padding: 24px 12px;
  text-align: center;
  border: 1px solid var(--ev-border-color-light);
  border-radius: var(--ev-radius-md);
  background: var(--ev-fill-1);
  font-size: 13px;
  color: var(--ev-text-secondary);
}
</style>
