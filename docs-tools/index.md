---
layout: home
---

<script setup>
import HomeStage from './demos/HomeStage.vue'
</script>

<div class="td-hero">
  <p class="td-hero__badge">v1.4.1 · 内测版 · 36 个组件入口</p>
  <h1 class="td-hero__title">
    Evoke <span class="accent">Tools</span> UI
  </h1>
  <p class="td-hero__desc">
    产品级 GUI 框架：命令驱动、三档密度、可停靠工作台、键盘优先。
    36 个组件入口分两层：common-tools 通用层（29）+ office-tools 办公子类（7）。
  </p>
  <div class="td-hero__actions">
    <a class="td-hero__btn td-hero__btn--primary" href="/guide/getting-started">快速开始</a>
    <a class="td-hero__btn td-hero__btn--ghost" href="/components/tool-button">
      组件目录
      <TdIcon name="arrow-right" :size="15" />
    </a>
    <a class="td-hero__btn td-hero__btn--ghost" href="/examples/">案例</a>
  </div>
  <div class="td-hero__stats">
    <div class="td-hero__stat"><strong>29 + 7</strong><span>组件入口（通用层 + 办公层）</span></div>
    <div class="td-hero__stat"><strong>7</strong><span>构建期质量门</span></div>
    <div class="td-hero__stat"><strong>24 / 32 / 40</strong><span>三档密度控件高</span></div>
    <div class="td-hero__stat"><strong>432</strong><span>单测 + 28 视觉回归</span></div>
  </div>
</div>

<div class="td-stage">
  <div class="td-stage__bar">
    <span class="td-stage__dot" /><span class="td-stage__dot" /><span class="td-stage__dot" />
    <span>工具区 · 命令表驱动（点一下试试）</span>
  </div>
  <div class="td-stage__body"><HomeStage /></div>
  <p class="td-stage__foot">这一段不是截图：点的、悬停的都是真组件，改命令表即改界面。</p>
</div>

<div class="td-features">
  <div class="td-feature">
    <div class="td-feature__icon"><TdIcon name="command" :size="20" /></div>
    <h3 class="td-feature__title">命令是唯一事实源</h3>
    <p class="td-feature__desc">每个可点控件绑命令 id，enabled / active 只有一处实现；工具区、右键、命令面板、键位表四处可达且状态一致。</p>
  </div>
  <div class="td-feature">
    <div class="td-feature__icon"><TdIcon name="layout" :size="20" /></div>
    <h3 class="td-feature__title">工作台即数据</h3>
    <p class="td-feature__desc">停靠、面板、尺寸、折叠是一棵可序列化的树，持久化读回；坏档降级到默认布局，不白屏。</p>
  </div>
  <div class="td-feature">
    <div class="td-feature__icon"><TdIcon name="keyboard" :size="20" /></div>
    <h3 class="td-feature__title">键盘优先</h3>
    <p class="td-feature__desc">焦点漫游、快捷键解析、组字守卫与浮层焦点陷阱都是框架契约；面板尺寸可用纯键盘调整。</p>
  </div>
  <div class="td-feature">
    <div class="td-feature__icon"><TdIcon name="shield" :size="20" /></div>
    <h3 class="td-feature__title">浮层有焦点契约</h3>
    <p class="td-feature__desc">对话框、菜单、提示统一滚动锁定、焦点陷阱与 Esc 归还，三处行为一致，行为可断言。</p>
  </div>
  <div class="td-feature">
    <div class="td-feature__icon"><TdIcon name="grid" :size="20" /></div>
    <h3 class="td-feature__title">三档密度</h3>
    <p class="td-feature__desc">紧凑 / 默认 / 宽松写在根上（<code>html[data-density]</code>），切换即时生效，组件内部不做密度分支。</p>
  </div>
  <div class="td-feature">
    <div class="td-feature__icon"><TdIcon name="palette" :size="20" /></div>
    <h3 class="td-feature__title">令牌切片</h3>
    <p class="td-feature__desc">三层令牌 <code>--eb-* → --et-* → --ot-*</code>：底座继承、框架自持、画布调色板随主题联动。</p>
  </div>
</div>

<div class="td-sibling">
  <p class="td-sibling__eyebrow">peer</p>
  <h2 class="td-sibling__title">底座是 Business UI</h2>
  <p class="td-sibling__desc">tools-ui 的 peer 依赖就是同族的中后台组件库：reset、底座件与 --eb-* 令牌都来自它。图表能力在同族的 Evoke Charts，三站共用一套设计语言。</p>
  <a class="td-sibling__btn" href="https://evoke-business-ui.wil-works.com" target="_blank" rel="noopener">
    访问 Business UI 文档
    <TdIcon name="arrow-right" :size="14" />
  </a>
</div>

<div class="td-banner">
  <div class="td-banner__text">
    <h3>八个完整装配</h3>
    <p>表格工作台、日志分析器、SQL 查询台、代码编辑器……点得动，也看得到整份源码。</p>
  </div>
  <a class="td-banner__btn" href="/examples/">看案例</a>
</div>

<div class="td-cats">
  <h2>分区速览</h2>
  <div class="td-cats__grid">
    <a class="td-cat" href="/examples/">
      <strong>案例</strong><span>8 个完整装配（可运行）</span>
    </a>
    <a class="td-cat" href="/common/">
      <strong>通用层 common</strong><span>29 件：基准件 / 壳 / 命令面 / 面板</span>
    </a>
    <a class="td-cat" href="/office/">
      <strong>办公层 office</strong><span>7 件：功能区 / 公式栏 / 表页签 / 画布宿主</span>
    </a>
    <a class="td-cat" href="/guide/commands">
      <strong>命令驱动</strong><span>命令表与状态单源</span>
    </a>
    <a class="td-cat" href="/guide/workbench">
      <strong>工作台与停靠</strong><span>布局树 / 持久化 / 折叠</span>
    </a>
    <a class="td-cat" href="/guide/keyboard">
      <strong>键盘与焦点</strong><span>快捷键 / 焦点陷阱</span>
    </a>
  </div>
</div>

<div class="td-quickstart">
  <h2>30 秒上手</h2>
  <h3>1. 安装</h3>

```bash
pnpm add @wil-works/evoke-tools-ui @wil-works/evoke-business-ui vue
```

  <h3>2. 挂插件</h3>

```js
import { createApp } from 'vue'
import EvokeToolsUI from '@wil-works/evoke-tools-ui'
import '@wil-works/evoke-tools-ui/styles'
import '@wil-works/evoke-business-ui/styles'
import App from './App.vue'

createApp(App).use(EvokeToolsUI).mount('#app')
```

  <h3>3. 写一个工具钮</h3>

```vue
<template>
  <et-provider>
    <et-tool-button icon="copy" label="复制" size="small" tip="复制" />
  </et-provider>
</template>
```

  <p class="td-quickstart__more">按需引入（子路径 / runtime / icons）与真实装配见<a href="/guide/getting-started">快速开始</a>，两层清单见<a href="/common/">common-tools</a> 与<a href="/office/">office-tools</a>。</p>
</div>