---
layout: home
---

<div class="bd-hero">
  <p class="bd-hero__badge">v0.3.2 · 中后台组件库</p>
  <h1 class="bd-hero__title">
    Evoke <span class="accent">Business</span> UI
  </h1>
  <p class="bd-hero__desc">
    面向中后台管理界面的 Vue3 组件库：基础组件覆盖按钮、表单、表格、弹层等常见界面元素，
    业务组件面向筛选、表格、审计等数据管理场景组合使用，另内置 Canvas 自绘图表引擎。
  </p>
  <div class="bd-hero__actions">
    <a class="bd-hero__btn bd-hero__btn--primary" href="/guide/getting-started">快速开始</a>
    <a class="bd-hero__btn bd-hero__btn--ghost" href="/components/overview">
      组件总览
      <BdIcon name="arrow-right" :size="15" />
    </a>
    <a class="bd-hero__btn bd-hero__btn--ghost" href="/examples/live/dashboard">在线示例中心</a>
  </div>
  <div class="bd-hero__stats">
    <div class="bd-hero__stat"><strong>150+</strong><span>通用与业务组件</span></div>
    <div class="bd-hero__stat"><strong>20+</strong><span>图表类型（Canvas 自绘）</span></div>
    <div class="bd-hero__stat"><strong>8 套</strong><span>场景示例工程</span></div>
    <div class="bd-hero__stat"><strong>433</strong><span>内置图标（可按需扩展）</span></div>
  </div>
</div>

<div class="bd-features">
  <div class="bd-feature">
    <div class="bd-feature__icon"><BdIcon name="code" :size="20" /></div>
    <h3 class="bd-feature__title">一致的 API 约定</h3>
    <p class="bd-feature__desc">组件统一 kebab-case 事件名与 v-model 约定，props / events / slots 按同一套规则组织，查阅一个组件的用法即可类推到其他组件。</p>
  </div>
  <div class="bd-feature">
    <div class="bd-feature__icon"><BdIcon name="grid" :size="20" /></div>
    <h3 class="bd-feature__title">业务组件</h3>
    <p class="bd-feature__desc">筛选表单、数据表格、状态标签、审计时间线、导入导出面板、列设置等，面向中后台数据管理页面组合使用。</p>
  </div>
  <div class="bd-feature">
    <div class="bd-feature__icon"><BdIcon name="zap" :size="20" /></div>
    <h3 class="bd-feature__title">Canvas 自绘图表</h3>
    <p class="bd-feature__desc">折线、饼图、热力、K 线等 20+ 图表类型，绘制层不依赖第三方图形库；tooltip / 图例 / 联动 / 导出内建。</p>
  </div>
  <div class="bd-feature">
    <div class="bd-feature__icon"><BdIcon name="moon" :size="20" /></div>
    <h3 class="bd-feature__title">设计令牌与暗色模式</h3>
    <p class="bd-feature__desc">语义化 CSS 变量分层（颜色 / 字体 / 间距 / 圆角 / 动效），切换暗色只需一个类名，品牌主色可覆盖。</p>
  </div>
  <div class="bd-feature">
    <div class="bd-feature__icon"><BdIcon name="globe" :size="20" /></div>
    <h3 class="bd-feature__title">国际化与无障碍</h3>
    <p class="bd-feature__desc">内置中英文语言包与 locale 切换，浮层组件带焦点陷阱、滚动锁定与键盘可达性处理。</p>
  </div>
  <div class="bd-feature">
    <div class="bd-feature__icon"><BdIcon name="shield" :size="20" /></div>
    <h3 class="bd-feature__title">Electron / 离线可用</h3>
    <p class="bd-feature__desc">模块顶层不访问 DOM、字体 base64 内联、file:// 协议可运行，适配桌面端与内网环境。</p>
  </div>
</div>

<div class="bd-sibling">
  <p class="bd-sibling__eyebrow">sibling</p>
  <h2 class="bd-sibling__title">做官网或营销页？</h2>
  <p class="bd-sibling__desc">看看同族的姊妹库 Evoke UI：Clean Navy 设计语言的 Vue3 官网组件库，49 个组件、明暗双主题与运行时换色，官网、落地页与个人主页开箱即用。</p>
  <a class="bd-sibling__btn" href="https://evoke-ui.wil-works.com" target="_blank" rel="noopener">
    访问 Evoke UI 文档
    <BdIcon name="arrow-right" :size="14" />
  </a>
</div>

<div class="bd-banner">
  <div class="bd-banner__text">
    <h3>全屏示例中心</h3>
    <p>工作台、CRUD 列表、分步表单、订单详情、项目协作、报销审批、知识库、移动端 H5——八个场景在线运行，无需本地启动任何工程。</p>
  </div>
  <a class="bd-banner__btn" href="/examples/live/dashboard">立即体验</a>
</div>

<div class="bd-cats">
  <h2>组件分区</h2>
  <div class="bd-cats__grid">
    <a class="bd-cat" href="/components/overview">
      <strong>总览</strong><span>全部组件一览与检索</span>
    </a>
    <a class="bd-cat" href="/components/search-filter">
      <strong>业务组件</strong><span>筛选 / 表格 / 审计…</span>
    </a>
    <a class="bd-cat" href="/components/button">
      <strong>通用与布局</strong><span>按钮 / 文本 / 卡片 / 栅格…</span>
    </a>
    <a class="bd-cat" href="/components/form">
      <strong>数据录入</strong><span>表单家族 / 选择器 / 上传…</span>
    </a>
    <a class="bd-cat" href="/components/table">
      <strong>数据展示</strong><span>表格 / 描述列表 / 时间轴…</span>
    </a>
    <a class="bd-cat" href="/chart">
      <strong>图表</strong><span>折线 / 饼图 / 热力 / K 线…</span>
    </a>
  </div>
</div>

<div class="bd-quickstart">
  <h2>30 秒上手</h2>
  <h3>1. 安装</h3>

```bash
npm install @wil-works/evoke-business-ui
# 或
pnpm add @wil-works/evoke-business-ui
```

  <h3>2. 引入</h3>

```js
import { createApp } from 'vue'
import EvokeBusinessUI from '@wil-works/evoke-business-ui'
import '@wil-works/evoke-business-ui/styles'
import App from './App.vue'

const app = createApp(App)
app.use(EvokeBusinessUI)
app.mount('#app')
```

  <h3>3. 在页面中使用</h3>

```vue
<template>
  <eb-search-filter v-model="query" :fields="fields" @search="onSearch" />
  <eb-data-table
    title="订单列表"
    :columns="columns"
    :data="rows"
    :total="total"
    v-model:page="page"
    @page-change="load"
  />
</template>

<script setup>
// 组件全局注册后直接使用；fields / columns 均为配置式声明
</script>
```

  <p class="bd-quickstart__more">更多能力见<a href="/guide/getting-started">快速开始</a>与<a href="/components/overview">组件总览</a>。</p>
</div>

