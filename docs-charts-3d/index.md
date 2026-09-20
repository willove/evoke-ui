---
layout: home
---

<div class="cd-hero">
  <p class="cd-hero__badge">v0.1.0 · 零依赖 Canvas 三维图表库 · 轨道交互 · 透视投影自绘 · 无需 WebGL</p>
  <h1 class="cd-hero__title">
    Charts <span class="accent">3D</span>
  </h1>
  <p class="cd-hero__desc">
    Vue 3 三维图表库：三维柱状、空间折线、散点云、曲面高度场与三维饼环。拖拽旋转、滚轮缩放、
    悬浮拾取开箱即用，绘制层为自研透视投影管线，不依赖 WebGL 与任何第三方渲染引擎，
    与 Evoke Charts 共用主题与色系。
  </p>
  <div class="cd-hero__actions">
    <a class="cd-hero__btn cd-hero__btn--primary" href="/chart/">快速上手</a>
    <a class="cd-hero__btn cd-hero__btn--ghost" href="/chart/api">
      API 参考
      <CdIcon name="arrow-right" :size="15" />
    </a>
    <a class="cd-hero__btn cd-hero__btn--ghost" href="https://www.npmjs.com/package/@wil-works/charts-3d" target="_blank" rel="noopener">npm 主页</a>
  </div>
  <div class="cd-hero__stats">
    <div class="cd-hero__stat"><strong>5</strong><span>三维图型</span></div>
    <div class="cd-hero__stat"><strong>0</strong><span>第三方运行时依赖（仅 Vue 3 peer）</span></div>
    <div class="cd-hero__stat"><strong>360°</strong><span>轨道环绕 · 滚轮缩放 · 键盘可控</span></div>
    <div class="cd-hero__stat"><strong>PNG + SVG</strong><span>位图与真矢量双导出</span></div>
  </div>
</div>

<div class="cd-features">
  <div class="cd-feature">
    <div class="cd-feature__icon"><CdIcon name="box" :size="20" /></div>
    <h3 class="cd-feature__title">真透视自绘</h3>
    <p class="cd-feature__desc">透视投影 + 画家算法深度排序 + 面法线光照，立体感来自光影而非贴图；全部跑在 Canvas 2D 上。</p>
  </div>
  <div class="cd-feature">
    <div class="cd-feature__icon"><CdIcon name="play" :size="20" /></div>
    <h3 class="cd-feature__title">轨道交互</h3>
    <p class="cd-feature__desc">拖拽环绕、滚轮与双指缩放、Shift 平移、双击复位、方向键微调、自动旋转；悬浮数据拾取与视角解耦。</p>
  </div>
  <div class="cd-feature">
    <div class="cd-feature__icon"><CdIcon name="moon" :size="20" /></div>
    <h3 class="cd-feature__title">主题与暗色跟随</h3>
    <p class="cd-feature__desc">与 Evoke Charts 同一套系列色槽位与内置色系，换主题、切暗色三维图即跟随；无令牌环境回落内置色板。</p>
  </div>
  <div class="cd-feature">
    <div class="cd-feature__icon"><CdIcon name="grid" :size="20" /></div>
    <h3 class="cd-feature__title">三维坐标框</h3>
    <p class="cd-feature__desc">墙面与轴线取边跟随相机，任意视角下网格永远垫底、标签永远可读；刻度标签自动防碰撞。</p>
  </div>
  <div class="cd-feature">
    <div class="cd-feature__icon"><CdIcon name="download" :size="20" /></div>
    <h3 class="cd-feature__title">导出</h3>
    <p class="cd-feature__desc">toDataURL 输出 PNG 位图，exportSVG 按绘制指令录制重放，三维图也能导出可缩放的真矢量文件。</p>
  </div>
  <div class="cd-feature">
    <div class="cd-feature__icon"><CdIcon name="shield" :size="20" /></div>
    <h3 class="cd-feature__title">无障碍</h3>
    <p class="cd-feature__desc">画布带 role="img" 与 aria-label，悬浮信息经 aria-live 播报，方向键即可环绕视角。</p>
  </div>
</div>

<div class="cd-sibling">
  <p class="cd-sibling__eyebrow">ecosystem</p>
  <h2 class="cd-sibling__title">同族：二维与三维并排使用</h2>
  <div class="cd-sibling__grid">
    <a class="cd-sibcard cd-sibcard--ui" href="https://evoke-charts.wil-works.com" target="_blank" rel="noopener">
      <div class="cd-sibcard__top">
        <span class="cd-sibcard__icon"><CdIcon name="chart" :size="15" /></span>
        <span class="cd-sibcard__tag">二维图表库</span>
      </div>
      <strong class="cd-sibcard__name">Evoke Charts</strong>
      <p class="cd-sibcard__desc">29 种二维图表：折线、柱状、饼环、热力、K 线等，options 配置式声明，与三维图共用同一套主题与色系。</p>
      <span class="cd-sibcard__link">访问 Evoke Charts 文档 <CdIcon name="arrow-right" :size="13" /></span>
    </a>
    <a class="cd-sibcard cd-sibcard--biz" href="https://evoke-business-ui.wil-works.com" target="_blank" rel="noopener">
      <div class="cd-sibcard__top">
        <span class="cd-sibcard__icon"><CdIcon name="monitor" :size="15" /></span>
        <span class="cd-sibcard__tag">中后台 UI 框架</span>
      </div>
      <strong class="cd-sibcard__name">Evoke Business UI</strong>
      <p class="cd-sibcard__desc">搭中后台管理界面：150+ 通用与业务组件，内嵌二维图表引擎，主题与暗色自动跟随组件库。</p>
      <span class="cd-sibcard__link">访问 Business UI 文档 <CdIcon name="arrow-right" :size="13" /></span>
    </a>
  </div>
</div>

<div class="cd-banner">
  <div class="cd-banner__text">
    <h3>拖一下，转起来</h3>
    <p>所有在线演示都可直接拖拽旋转、滚轮缩放、悬浮查看数值——每一项交互都有可运行的例子。</p>
  </div>
  <a class="cd-banner__btn" href="/chart/bar3d">立即体验</a>
</div>

<div class="cd-cats">
  <h2>分区速览</h2>
  <div class="cd-cats__grid">
    <a class="cd-cat" href="/chart/">
      <strong>总览与选型</strong><span>五种图型的心智模型 / 按数据形态挑图</span>
    </a>
    <a class="cd-cat" href="/chart/bar3d">
      <strong>三维图型</strong><span>柱状 / 折线 / 散点 / 曲面 / 饼环</span>
    </a>
    <a class="cd-cat" href="/guide/camera">
      <strong>相机与交互</strong><span>视角参数 / 缩放平移 / 事件契约</span>
    </a>
    <a class="cd-cat" href="/guide/theme">
      <strong>主题接入</strong><span>换肤跟随 / 暗色 / 内置色系</span>
    </a>
  </div>
</div>

<div class="cd-quickstart">
  <h2>30 秒上手</h2>
  <h3>1. 安装</h3>

```bash
npm install @wil-works/charts-3d
# 或
pnpm add @wil-works/charts-3d
```

  <h3>2. 引入</h3>

```js
import { createApp } from 'vue'
import Charts3d from '@wil-works/charts-3d'
import '@wil-works/charts-3d/styles'
import App from './App.vue'

const app = createApp(App)
app.use(Charts3d) // 全局注册 <EvChart3d />
app.mount('#app')
```

  <h3>3. 在页面中使用</h3>

```vue
<template>
  <EvChart3d :options="options" :height="360" />
</template>

<script setup>
const options = {
  type: 'bar3d',
  labels: ['一月', '二月', '三月', '四月'],
  series: [
    { name: '华东', data: [120, 200, 150, 80] },
    { name: '华南', data: [90, 60, 130, 170] },
  ],
}
</script>
```

  <p class="cd-quickstart__more">更多引入方式见<a href="/guide/install">安装与引入</a>，按数据形态挑图见<a href="/chart">总览与选型</a>。</p>
</div>
