# 布局与导航壳

<script setup>
import { ref } from 'vue'

const tab = ref('home')
const tabPages = {
  home: { title: '首页', desc: '品牌首屏与精选内容' },
  work: { title: '作品', desc: '案例集与设计细节' },
  about: { title: '关于', desc: '团队、服务与合作方式' },
}
const liked = ref(false)
</script>

移动站点的骨架与桌面同源，但三段结构固定：**顶部精简导航**（logo + 高频动作）、
**中部单列内容**（纵向叙事流）、**底部固定区**（标签栏或吸底 CTA）。桌面的横向
多级导航在移动端没有生存空间——一级入口进底部标签栏，次级入口进抽屉或页脚。

## 页面壳

页面壳按「真机全宽、桌面居中」双向兼容：

```css
.mb-shell {
  max-width: 420px;   /* 桌面浏览器预览时呈现为居中手机列 */
  margin: 0 auto;
  min-height: 100dvh; /* 真机动态视口 */
}
```

内容区独立滚动（`overflow-y: auto` + `overscroll-behavior: contain`），底部固定区
吸底不动；全面屏安全区用 `env(safe-area-inset-bottom)` 适配（EwTabbar 已内置）。

## 底部标签栏

一级导航压平为 3~5 个底部页签，用 `EwTabbar` 承载：真机上 `fixed` 默认吸底 +
安全区适配 + 自动等高占位；页内内容切换由 `v-model` 驱动。

<DemoBlock title="Tabbar 驱动的页面切换" description="点击底部页签，内容区实时切换；badge 角标与页面数据同源。">

<MobileStage>
  <div class="mb-page">
    <div class="mb-card mb-card--pad">
      <div class="mb-card__title">{{ tabPages[tab].title }}</div>
      <div class="mb-card__label" style="margin-top: 4px;">{{ tabPages[tab].desc }}</div>
    </div>
  </div>
  <template #bottom>
    <ew-tabbar v-model="tab" :fixed="false">
      <ew-tabbar-item name="home">首页</ew-tabbar-item>
      <ew-tabbar-item name="work" badge="3">作品</ew-tabbar-item>
      <ew-tabbar-item name="about">关于</ew-tabbar-item>
    </ew-tabbar>
  </template>
</MobileStage>

```vue
<script setup>
import { ref } from 'vue'

const tab = ref('home')
</script>

<template>
  <component :is="pages[tab]" />

  <!-- 真机：fixed 吸底 + 安全区适配 + 自动占位 -->
  <EwTabbar v-model="tab">
    <EwTabbarItem name="home">首页</EwTabbarItem>
    <EwTabbarItem name="work" badge="3">作品</EwTabbarItem>
    <EwTabbarItem name="about">关于</EwTabbarItem>
  </EwTabbar>
</template>
```

</DemoBlock>

完整 API 见 [Tabbar 组件文档](/mobile/components/tabbar)。

## 顶部导航的移动表达

EwNavbar 在移动端只保留**一个高频动作位**（如「联系我们」「下载」），次级链接收进
抽屉或页脚——不要把桌面导航链接原样搬到窄屏。移动端层级感由「页栈返回」承担：
二级页面导航栏 = 返回箭头 + 页标题 + 单个动作位，标题即位置。

<DemoBlock title="二级页面导航栏" description="返回箭头 + 居中标题 + 右侧单动作；动作位只放一个高频操作。">

<MobileStage title="作品详情">
  <div class="mb-page">
    <div class="mb-card mb-card--pad">
      <div class="mb-card__title">云笔记工作台 · 视觉稿</div>
      <div class="mb-card__label" style="margin-top: 4px;">Clean Navy · 2026-08</div>
    </div>
    <div class="mb-card mb-card--pad">
      <div class="mb-card__label">设计说明：以藏青墨色为基底，留白切分层次，卡片轻抬 2px。</div>
    </div>
  </div>
  <template #action>
    <span style="font-size: 14px; color: var(--ew-color-primary);" @click="liked = !liked">{{ liked ? '已收藏' : '收藏' }}</span>
  </template>
</MobileStage>

</DemoBlock>

规则：右侧动作位只放**一个**文字级高频操作，更多操作进底部动作面板
（[ActionSheet](/mobile/components/action-sheet)），不要在导航栏堆按钮组。
