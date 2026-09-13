---
layout: home
---

<div class="cd-hero">
  <p class="cd-hero__badge">v0.4.0 · 零依赖 Canvas 图表库 · 内置色系 · 双轴 · 交互规范</p>
  <h1 class="cd-hero__title">
    Evoke <span class="accent">Charts</span>
  </h1>
  <p class="cd-hero__desc">
    Vue 3 图表库：折线、柱状、饼环、散点、热力、K 线等 20+ 图表类型，ECharts 风格的 options
    配置式声明，绘制层全部自研 Canvas 2D，不依赖任何第三方图表引擎，也不依赖 Evoke 其他组件库。
  </p>
  <div class="cd-hero__actions">
    <a class="cd-hero__btn cd-hero__btn--primary" href="/chart/">快速上手</a>
    <a class="cd-hero__btn cd-hero__btn--ghost" href="/chart/api">
      API 参考
      <CdIcon name="arrow-right" :size="15" />
    </a>
    <a class="cd-hero__btn cd-hero__btn--ghost" href="https://www.npmjs.com/package/@wil-works/evoke-charts" target="_blank" rel="noopener">npm 主页</a>
  </div>
  <div class="cd-hero__stats">
    <div class="cd-hero__stat"><strong>20+</strong><span>图表类型</span></div>
    <div class="cd-hero__stat"><strong>0</strong><span>第三方运行时依赖（仅 Vue 3 peer）</span></div>
    <div class="cd-hero__stat"><strong>PNG + SVG</strong><span>位图与真矢量双导出</span></div>
    <div class="cd-hero__stat"><strong>--ev-*</strong><span>令牌取色，换主题即跟随</span></div>
  </div>
</div>

<div class="cd-features">
  <div class="cd-feature">
    <div class="cd-feature__icon"><CdIcon name="code" :size="20" /></div>
    <h3 class="cd-feature__title">配置式声明</h3>
    <p class="cd-feature__desc">一个 options 对象描述类型、数据与样式，直角坐标系家族共用 labels + series 数据模型，换类型不改数据结构。</p>
  </div>
  <div class="cd-feature">
    <div class="cd-feature__icon"><CdIcon name="moon" :size="20" /></div>
    <h3 class="cd-feature__title">主题与暗色跟随</h3>
    <p class="cd-feature__desc">从宿主的 --ev-* 令牌实时取色，换主题、切暗色图表即跟随；无令牌环境回落内置色板。</p>
  </div>
  <div class="cd-feature">
    <div class="cd-feature__icon"><CdIcon name="zap" :size="20" /></div>
    <h3 class="cd-feature__title">交互内建</h3>
    <p class="cd-feature__desc">tooltip、图例点选、十字准线、dataZoom 缩放、框选刷选、多图联动、导出与还原工具箱，无需额外插件。</p>
  </div>
  <div class="cd-feature">
    <div class="cd-feature__icon"><CdIcon name="layers" :size="20" /></div>
    <h3 class="cd-feature__title">零依赖自绘</h3>
    <p class="cd-feature__desc">全部绘制自研 Canvas 2D，仅 peer 依赖 Vue 3；模块顶层不访问 DOM，SSR 环境安全。</p>
  </div>
  <div class="cd-feature">
    <div class="cd-feature__icon"><CdIcon name="download" :size="20" /></div>
    <h3 class="cd-feature__title">导出</h3>
    <p class="cd-feature__desc">toDataURL 输出 PNG 位图，exportSVG 基于渲染指令录制重放，输出可编辑的真矢量文件。</p>
  </div>
  <div class="cd-feature">
    <div class="cd-feature__icon"><CdIcon name="shield" :size="20" /></div>
    <h3 class="cd-feature__title">无障碍</h3>
    <p class="cd-feature__desc">画布带 role="img" 与 aria-label，悬浮信息经 aria-live 播报，键盘与读屏场景可用。</p>
  </div>
</div>

<div class="cd-sibling">
  <p class="cd-sibling__eyebrow">ecosystem</p>
  <h2 class="cd-sibling__title">姊妹库：图表之外的整套界面</h2>
  <div class="cd-sibling__grid">
    <a class="cd-sibcard cd-sibcard--ui" href="https://evoke-ui.wil-works.com" target="_blank" rel="noopener">
      <div class="cd-sibcard__top">
        <span class="cd-sibcard__icon"><CdIcon name="globe" :size="15" /></span>
        <span class="cd-sibcard__tag">官网级 UI 框架</span>
      </div>
      <strong class="cd-sibcard__name">Evoke UI</strong>
      <p class="cd-sibcard__desc">做官网、落地页与营销页：Clean Navy 设计语言，58 个组件，明暗双主题与运行时换色开箱即用。</p>
      <span class="cd-sibcard__link">访问 Evoke UI 文档 <CdIcon name="arrow-right" :size="13" /></span>
    </a>
    <a class="cd-sibcard cd-sibcard--biz" href="https://evoke-business-ui.wil-works.com" target="_blank" rel="noopener">
      <div class="cd-sibcard__top">
        <span class="cd-sibcard__icon"><CdIcon name="monitor" :size="15" /></span>
        <span class="cd-sibcard__tag">中后台 UI 框架</span>
      </div>
      <strong class="cd-sibcard__name">Evoke Business UI</strong>
      <p class="cd-sibcard__desc">搭中后台管理界面：150+ 通用与业务组件，内嵌同一图表引擎（&lt;eb-chart&gt;），主题与暗色自动跟随组件库。</p>
      <span class="cd-sibcard__link">访问 Business UI 文档 <CdIcon name="arrow-right" :size="13" /></span>
    </a>
  </div>
  <p class="cd-sibling__more">Business UI 的图表接入细节见<a href="/guide/integration">内嵌于组件库</a>。</p>
</div>

<div class="cd-banner">
  <div class="cd-banner__text">
    <h3>交互与联动</h3>
    <p>图例点选、悬停高亮、十字准线、滑块与滚轮缩放、框选刷选、多图 connect 联动——每一项都有可运行的在线演示。</p>
  </div>
  <a class="cd-banner__btn" href="/chart/interaction">立即体验</a>
</div>

<div class="cd-cats">
  <h2>分区速览</h2>
  <div class="cd-cats__grid">
    <a class="cd-cat" href="/chart/">
      <strong>总览与选型</strong><span>心智模型 / 按问题选图</span>
    </a>
    <a class="cd-cat" href="/chart/line">
      <strong>图表类型</strong><span>折线 / 柱状 / 饼环 / 热力 / K 线…</span>
    </a>
    <a class="cd-cat" href="/chart/interaction">
      <strong>交互与联动</strong><span>tooltip / 缩放 / 刷选 / 联动</span>
    </a>
    <a class="cd-cat" href="/guide/theme">
      <strong>主题接入</strong><span>令牌契约 / 暗色 / 换肤跟随</span>
    </a>
  </div>
</div>

<div class="cd-quickstart">
  <h2>30 秒上手</h2>
  <h3>1. 安装</h3>

```bash
npm install @wil-works/evoke-charts
# 或
pnpm add @wil-works/evoke-charts
```

  <h3>2. 引入</h3>

```js
import { createApp } from 'vue'
import EvokeCharts from '@wil-works/evoke-charts'
import '@wil-works/evoke-charts/styles'
import App from './App.vue'

const app = createApp(App)
app.use(EvokeCharts) // 全局注册 <EvChart />
app.mount('#app')
```

  <h3>3. 在页面中使用</h3>

```vue
<template>
  <EvChart :options="options" :height="320" />
</template>

<script setup>
const options = {
  type: 'line',
  labels: ['一月', '二月', '三月', '四月'],
  series: [{ name: '营收', data: [120, 200, 150, 80] }],
}
</script>
```

  <p class="cd-quickstart__more">更多引入方式见<a href="/guide/install">安装与引入</a>，按数据形态挑图见<a href="/chart">总览与选型</a>。</p>
</div>
