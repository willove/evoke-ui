# 滚动叙事

苹果式产品页的核心手法：**滚动条就是时间轴**。向下滚动，笔记本缓缓开盖、
参数逐条亮起；向上滚动，整个过程原样回溯——动画进度与滚动位置严格同步，
不抢滚动条的 control，也没有「播动画时页面停住」的割裂感。

Evoke UI 把它拆成两个形态，与 [v-reveal](/guide/motion) 的触发型入场互补：

- **触发型**（v-reveal）：元素进视口 → 播一次。适合入场点缀；
- **进度驱动型**（本页）：元素在视口里的穿越程度 = 动画进度，双向可逆。适合产品叙事。

## EvScrollScene 场景

`EvScrollScene` 外层按 `duration` 拉出滚动长度，内层 sticky 钉在视口里；
进度经作用域插槽 `{ progress }` 与 CSS 变量 `--ev-scene-progress`（0..1）双通道暴露。
纯 CSS 消费用 `calc()`——笔记本开合就是一行 transform：

<DemoBlock title="随滚动开合的笔记本" description="缓慢向下滚动：屏幕随开盖角度渐亮，标题浮出；向上滚动整个过程原样回溯。">

<EvScrollScene :duration="260">
  <template #default>
    <div class="sl-stage">
      <p class="sl-hint">继续向下滚动 ↓</p>
      <div class="sl-laptop">
        <div class="sl-lid">
          <div class="sl-screen">
            <p class="sl-screen-title">开盖，即赴工作状态</p>
            <p class="sl-screen-sub">12 亿色原彩屏 · 自适应 120Hz</p>
          </div>
        </div>
        <div class="sl-base">
          <span class="sl-notch"></span>
        </div>
      </div>
      <p class="sl-caption">厚度 11.5mm · 全天续航</p>
    </div>
  </template>
</EvScrollScene>

```vue
<EvScrollScene :duration="260">
  <template #default>
    <div class="sl-lid">
      <!-- 闭合 -92° → 直立 0°，滚动条就是时间轴 -->
      <div class="sl-screen">…</div>
    </div>
  </template>
</EvScrollScene>

<style>
.sl-lid {
  transform-origin: 50% 100%;
  transform: rotateX(calc(-92deg + var(--ev-scene-progress) * 92deg));
}
.sl-screen {
  opacity: calc(var(--ev-scene-progress) * 1.4 - 0.25);
}
</style>
```

</DemoBlock>

要点：

- 屏幕亮起用 `opacity: calc(var(--ev-scene-progress) * 1.4 - 0.25)`——calc 超界自动收敛到 0..1；
- 只动 `transform` 与 `opacity`（合成器层），滚动全程不掉帧；
- 用户系统开了「减少动态效果」时，组件自动把进度钉在终态 1，页面静态呈现开盖完成的样子，
  不需要宿主写任何判断；
- JS 消费（canvas 图片序列刷帧、`video.currentTime = progress × 时长`）走插槽值，
  与 CSS 变量同源同值。

## 分步功能区

「滚一下进入下一个功能模块」用原生 **scroll-snap** 实现：吸附是浏览器原生行为，
温和可打断，滚轮、触摸板、键盘、读屏全都自然工作——不要做滚轮劫持式的整页翻页。

容器加 `ev-snap-y`（proximity 温和吸附）、每个分栏加 `ev-snap-start`：

<DemoBlock title="分步功能介绍" description="在下面的演示窗格内滚动，功能栏会轻吸到窗格顶部；再向下滚进入下一栏，向上滚回溯。">

<div class="snap-demo ev-snap-y">
  <div class="snap-pane ev-snap-start">
    <span class="snap-idx">01</span>
    <div>
      <p class="snap-title">一屏一个重点</p>
      <p class="snap-desc">proximity 模式只在靠近吸附位时轻推一下，中间浏览不受打扰。</p>
    </div>
  </div>
  <div class="snap-pane ev-snap-start">
    <span class="snap-idx">02</span>
    <div>
      <p class="snap-title">原生滚动，无劫持</p>
      <p class="snap-desc">滚轮、触摸板惯性、键盘与读屏全部保持浏览器默认行为。</p>
    </div>
  </div>
  <div class="snap-pane ev-snap-start">
    <span class="snap-idx">03</span>
    <div>
      <p class="snap-title">双向可逆</p>
      <p class="snap-desc">向上滚即回到上一栏，与触发型入场动画的分工见上。</p>
    </div>
  </div>
</div>

```html
<div class="snap-demo ev-snap-y">
  <section class="snap-pane ev-snap-start">…</section>
  <section class="snap-pane ev-snap-start">…</section>
  <section class="snap-pane ev-snap-start">…</section>
</div>
```

</DemoBlock>

整页官网的分步（每个 EvSection 吸到视口顶）不用手写：给区块加 `snap` prop 即可，
任一区块声明后页面滚动容器自动启用吸附；悬浮顶栏用 CSS `scroll-margin-top` 让位：

```vue
<EvSection eyebrow="Features" title="即时洞察" snap>
  …
</EvSection>
```

## 自定义场景

场景结构不满足时（视差层、多元素错拍），用 `useScrollProgress` 进度原语自行组装，
返回 `{ progress, reduced }`，几何语义与组件一致：

```vue
<script setup>
import { ref } from 'vue'
import { useScrollProgress } from '@wil-works/evoke-ui'

const stage = ref(null)
const { progress } = useScrollProgress(stage)
</script>

<template>
  <div ref="stage">
    <div :style="{ transform: `translateY(${progress * -40}px)` }">视差层</div>
  </div>
</template>
```

<style scoped>
/* ─── 笔记本开合 ─── */
.sl-stage {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 40px;
  background: linear-gradient(180deg, var(--ev-bg-page, #f6f8fb), var(--ev-bg-container, #ffffff));
}
.sl-hint {
  margin: 0;
  font-size: 13px;
  letter-spacing: 0.12em;
  color: var(--ev-text-secondary);
}
.sl-laptop {
  width: min(520px, 80vw);
  perspective: 1600px;
}
.sl-lid {
  position: relative;
  z-index: 2;
  height: 320px;
  border: 12px solid #1c2431;
  border-bottom: none;
  border-radius: 20px 20px 4px 4px;
  background: #0e1420;
  transform-origin: 50% 100%;
  transform: rotateX(calc(-92deg + var(--ev-scene-progress) * 92deg));
  transform-style: preserve-3d;
  box-shadow: 0 -6px 44px rgba(13, 112, 255, 0.12);
}
.sl-screen {
  height: 100%;
  border-radius: 10px 10px 0 0;
  background:
    radial-gradient(120% 90% at 20% 100%, rgba(13, 112, 255, 0.35), transparent 60%),
    linear-gradient(160deg, #16233c, #0b1220 70%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 36px;
  opacity: calc(var(--ev-scene-progress) * 1.4 - 0.25);
}
.sl-screen-title,
.sl-screen-sub {
  margin: 0;
  color: #eef4ff;
  font-weight: 600;
  font-size: 24px;
  letter-spacing: 0.02em;
}
.sl-screen-sub {
  margin-top: 10px;
  font-size: 14px;
  font-weight: 400;
  color: #9db4d8;
}
.sl-base {
  height: 22px;
  margin: 0 -7%;
  border-radius: 6px 6px 16px 16px;
  background: linear-gradient(#2a3345, #171e2b);
  display: flex;
  align-items: center;
  justify-content: center;
}
.sl-notch {
  width: 96px;
  height: 8px;
  border-radius: 0 0 8px 8px;
  background: #0e1420;
}
.sl-caption {
  margin: 0;
  font-size: 14px;
  color: var(--ev-text-secondary);
}

/* ─── 分步吸附 ─── */
.snap-demo {
  height: 420px;
  overflow-y: auto;
  border: 1px solid var(--ev-border-color);
  border-radius: 14px;
  background: var(--ev-bg-page);
}
.snap-pane {
  min-height: 100%;
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 40px 44px;
  box-sizing: border-box;
}
.snap-pane:nth-child(2n) {
  background: var(--ev-bg-container);
}
.snap-idx {
  flex: none;
  font-size: 44px;
  font-weight: 200;
  color: var(--ev-color-primary);
  opacity: 0.5;
}
.snap-title,
.snap-desc {
  margin: 0;
}
.snap-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--ev-text-primary);
}
.snap-desc {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--ev-text-secondary);
}
</style>
