# 移动端适配

<script setup>
import { ref } from 'vue'

const refreshing = ref(false)
const tab = ref('home')
const loadStatus = ref('idle')
const articles = ref([
  { title: 'Clean Navy 设计语言解读', meta: '设计 · 09-01' },
  { title: '官网动效的克制与叙事', meta: '动效 · 08-24' },
  { title: '明暗双主题的令牌架构', meta: '工程 · 08-15' },
  { title: '网格系统的致密美学', meta: '组件 · 08-08' },
  { title: '阴影只做「托起」不做「投影」', meta: '视觉 · 07-30' },
])
let page = 1
function onRefresh() {
  setTimeout(() => {
    page = 1
    loadStatus.value = 'idle'
    refreshing.value = false
  }, 1200)
}
function onLoadMore() {
  setTimeout(() => {
    page += 1
    if (page >= 3) loadStatus.value = 'noMore'
    else loadStatus.value = 'idle'
  }, 1200)
}
</script>

Evoke UI 面向官网与纯前端站点，移动端与桌面共用同一套组件与令牌：适配发生在**页面范式层**
而不是分支构建——不做独立移动端包，不引入第二套组件。本板块给出前台站点的 Web 级移动端
设计范式：桌面版本做好之后，移动版本按同一套设计语言自然兼容，尽可能减少开发者的负担。

## 设计原则

1. **单列叙事**。官网在移动端从「多栏网格」退化为「纵向叙事流」：Hero 大字重标题自动换行、
   特性网格降为单列或两列、对比表横向滚动或折叠。一屏只讲一件事。
2. **触控优先**。可点目标不小于 44×44px；hover 微交互（卡片轻抬、加号徽标弹入）只做增强，
   不承载信息——触屏上看不到 hover，关键信息必须在静态态就可见。
3. **首屏让位内容**。移动端 Hero 收紧上下留白（96px 级区块节奏降为 48~64px），首屏至少
   露出标题 + 主 CTA；导航精简为 logo + 高频动作，次级入口进底部标签栏或抽屉。
4. **底部动线**。移动端高频操作（咨询、购买、回顶部）沉到底部：悬浮 CTA、底部标签栏、
   底部动作面板——拇指热区在屏幕下三分之一。
5. **内容流加载**。文章流、案例流用「下拉刷新 + 加载更多」对齐原生 App 手感，替代页码器。

## 桌面 → 移动 适配速查表

| 桌面场景 | 移动表达 | 说明 |
| --- | --- | --- |
| Hero 首屏大版式 | 紧凑首屏 | 留白减半、标题换行、副文 1.7 行高，首屏可见主 CTA |
| FeatureGrid 特性网格 | 单列 / 两列卡片 | 网格降维，图 + 标题 + 一句话，点按进详情 |
| ComparisonTable 对比表 | 折叠 / 横向滚动 | 三列以上在 375px 放不下，优先折叠为核心行 |
| PricingCard 多卡并排 | 纵向堆叠 + 推荐卡置顶 | 主推卡深色渐变语言保留 |
| Navbar 横向导航 | 精简 + 底部标签栏 | 高频入口进 [Tabbar](/mobile/components/tabbar)，次级进抽屉 |
| Footer 多栏链接 | 精简版权行 | 次要链接收进「更多」 |
| ContactForm 多栏表单 | 单列 + 吸底提交 | label 上置，见[表单与转化](/mobile/forms) |
| ArticleCard / 内容流 | 下拉刷新 + 加载更多 | 见[内容流](/mobile/content)与 PullRefresh / LoadMore |
| hover 菜单 / 浮层 | ActionSheet 动作面板 | 触屏无 hover，见 [ActionSheet](/mobile/components/action-sheet) |
| Pagination 页码器 | 加载更多 | 窄屏上页码跳转无意义 |

## 移动专属组件

五个移动端高频能力已组件化，与中后台库 evoke-business-ui 的 Ev 版本同名同 API，
两端范式一致：

| 组件 | 场景 | 文档 |
| --- | --- | --- |
| EvNavBar 页头 | H5 页面头部：返回 + 标题 + 动作 | [组件文档](/mobile/components/nav-bar) |
| EvPullRefresh 下拉刷新 | 内容流顶部，对齐原生 App 手感 | [组件文档](/mobile/components/pull-refresh) |
| EvLoadMore 加载更多 | 列表尾部，点击或触底自动加载 | [组件文档](/mobile/components/load-more) |
| EvActionSheet 动作面板 | 对象级操作菜单，替代 hover 菜单 | [组件文档](/mobile/components/action-sheet) |
| EvTabbar 底部标签栏 | H5 站点一级导航吸底 | [组件文档](/mobile/components/tabbar) |

<DemoBlock title="移动范式速览" description="下拉刷新 + 卡片流 + 加载更多 + 底部标签栏，全部为真实可交互组件（375px 视口演示壳）。">

<MobileStage title="品牌内容站">
  <ev-pull-refresh v-model="refreshing" @refresh="onRefresh" style="min-height: 100%;">
    <div class="mb-page">
      <div v-for="a in articles" :key="a.title" class="mb-card mb-card--pad">
        <div class="mb-card__title">{{ a.title }}</div>
        <div class="mb-card__label" style="margin-top: 4px;">{{ a.meta }}</div>
      </div>
    </div>
    <ev-load-more :status="loadStatus" @load-more="onLoadMore" @update:status="loadStatus = $event" />
  </ev-pull-refresh>
  <template #bottom>
    <ev-tabbar v-model="tab" :fixed="false" style="border-top: 1px solid var(--ev-border-color-light);">
      <ev-tabbar-item name="home">首页</ev-tabbar-item>
      <ev-tabbar-item name="articles" badge="5">文章</ev-tabbar-item>
      <ev-tabbar-item name="mine">我的</ev-tabbar-item>
    </ev-tabbar>
  </template>
</MobileStage>

```vue
<script setup>
import { ref } from 'vue'

const refreshing = ref(false)
const articles = ref([{ title: '…', meta: '…' }])
const loadStatus = ref('idle')
const tab = ref('home')

async function onRefresh() {
  await reload()
  refreshing.value = false
}
async function onLoadMore() {
  await fetchNext()
  loadStatus.value = hasMore ? 'idle' : 'noMore'
}
</script>

<template>
  <EvPullRefresh v-model="refreshing" @refresh="onRefresh">
    <ArticleList :items="articles" />
    <EvLoadMore v-model:status="loadStatus" @load-more="onLoadMore" />
  </EvPullRefresh>
  <EvTabbar v-model="tab">
    <EvTabbarItem name="home">首页</EvTabbarItem>
    <EvTabbarItem name="articles" badge="5">文章</EvTabbarItem>
    <EvTabbarItem name="mine">我的</EvTabbarItem>
  </EvTabbar>
</template>
```

</DemoBlock>

## 视口与安全区

页面壳按「真机全宽、桌面居中」双向兼容：`max-width` 约束内容列 + `min-height: 100dvh`
（真机动态视口，规避地址栏收展抖动）。

**安全区是自动的**：Tabbar（吸底 + `safe-area-inset-bottom`）与 ActionSheet（取消栏下缘）
已内置 `env(safe-area-inset-bottom)` 适配，桌面浏览器取值为 0、全面屏真机自动生效，
组件无需任何配置。业务自己的吸底元素（悬浮 CTA、吸底提交栏）用 `useSafeArea()` 读取
实时 insets，页面初始化时调用一次 `ensureViewportFit()`——viewport 缺
`viewport-fit=cover` 时 `env()` 恒为 0，函数会自动补上：

```js
import { useSafeArea, ensureViewportFit } from '@wil-works/evoke-ui'

ensureViewportFit()
const safeArea = useSafeArea() // 响应式 { top, bottom, left, right }（px）
```

```html
<div class="float-cta" :style="{ paddingBottom: safeArea.bottom + 'px' }">…</div>
```

## 演示壳说明

本板块所有演示统一放在 `MobileStage` 演示壳（375px 视口 + 状态栏/导航栏/Home 指示条）
中呈现，组件在其中的表现即真机表现。壳内演示弹层类组件时需声明 `:append-to-body="false"`
（演示壳屏幕层的 transform 会成为内联弹层的包含块，弹层被裁剪在「手机」内）；真机页面
保持默认 Teleport 即可。

## 分页导航

- [布局与导航壳](/mobile/layout) — 页面壳、导航精简、底部标签栏
- [内容流](/mobile/content) — 文章卡 + 下拉刷新 + 加载更多
- [表单与转化](/mobile/forms) — 单列表单、吸底提交、轻反馈
- [案例：H5 官网](/mobile/case) — Web 级移动端整站案例
- [案例：个人中心](/mobile/case-profile) — 身份卡、订单宫格、设置分组
- [案例：商品详情与结算](/mobile/case-shop) — 转化叙事流、吸底操作栏、结算面板
- [案例：登录注册](/mobile/case-auth) — 单列验证表单、协议拦截、第三方兜底
