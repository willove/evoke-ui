---
layout: home
---

<script setup>
import HomeStage from './demos/HomeStage.vue'
</script>

<div class="td-hero">
  <p class="td-hero__badge">v1.2.1 · 内测版 · 33 个组件入口 · 七道构建门 · Vue 3 纯 JS</p>
  <h1 class="td-hero__title">Evoke <span class="accent">Tools UI</span></h1>
  <p class="td-hero__desc">
    把界面做成<strong>一个软件</strong>的 Vue 3 框架：命令驱动、三档密度、可停靠工作台、键盘优先。
    下面这个工具区是真组件——改命令表即改界面。
  </p>
  <div class="td-hero__actions">
    <a class="td-hero__btn td-hero__btn--primary" href="/guide/getting-started">快速上手</a>
    <a class="td-hero__btn td-hero__btn--ghost" href="/guide/commands">命令驱动</a>
    <a class="td-hero__btn td-hero__btn--ghost" href="https://www.npmjs.com/package/@wil-works/evoke-tools-ui" target="_blank" rel="noopener">npm 主页</a>
  </div>
  <div class="td-hero__stage">
    <div class="td-hero__stage-bar">
      <span class="td-hero__stage-dot" /><span class="td-hero__stage-dot" /><span class="td-hero__stage-dot" />
      <span>工具区 · 命令表驱动（点一下试试）</span>
    </div>
    <HomeStage />
  </div>
  <div class="td-hero__stats">
    <div class="td-hero__stat"><strong>33</strong><span>组件入口（分层契约）</span></div>
    <div class="td-hero__stat"><strong>7</strong><span>构建期质量门</span></div>
    <div class="td-hero__stat"><strong>24 / 32 / 40</strong><span>三档密度控件高</span></div>
    <div class="td-hero__stat"><strong>432</strong><span>单测 + 28 视觉回归</span></div>
  </div>
</div>

<div class="td-features">
  <div class="td-feature">
    <div class="td-feature__title"><TdIcon name="command" :size="17" /> 命令是唯一事实源</div>
    <p class="td-feature__desc">
      每个可点控件绑命令 id，<code>enabled / active</code> 只有一处实现。同一个命令在工具区、右键、
      命令面板、键位表四处可达且状态一致——"加一个功能 = 加一行数据"。
    </p>
  </div>
  <div class="td-feature">
    <div class="td-feature__title"><TdIcon name="layout" :size="17" /> 工作台即数据</div>
    <p class="td-feature__desc">停靠 / 面板 / 尺寸 / 折叠是一棵可序列化的树，持久化读回，坏档降级不白屏。</p>
  </div>
  <div class="td-feature">
    <div class="td-feature__title"><TdIcon name="keyboard" :size="17" /> 键盘优先</div>
    <p class="td-feature__desc">焦点漫游、焦点陷阱、快捷键与组字守卫都是框架契约；面板尺寸可纯键盘调。</p>
  </div>
  <div class="td-feature">
    <div class="td-feature__title"><TdIcon name="palette" :size="17" /> 令牌切片</div>
    <p class="td-feature__desc"><code>--eb-* → --et-* → --ot-*</code> 三层令牌，画布调色板随主题联动。</p>
  </div>
</div>
