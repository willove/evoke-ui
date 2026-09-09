# PullRefresh 下拉刷新

`EwPullRefresh` 提供对齐原生 App 的下拉刷新手势：内容区顶部下拉 → 释放触发 `refresh`，
`v-model` 同步加载中状态，加载完成后置 `false` 自动展示成功态并收回。滚动容器不在顶部时
不拦截手势（页面可正常上滚）；超过触发距离后 1/3 阻尼跟手，形成「越拉越紧」的手感。

## 基础用法

<DemoBlock title="内容流下拉刷新" description="在 375px 演示壳内的滚动区顶部下拉（触摸设备）或观察状态流转；释放越过阈值后进入加载中，1.2 秒后完成。">

<MobileStage title="品牌内容站">
  <ew-pull-refresh v-model="refreshing" @refresh="onRefresh" style="min-height: 100%;">
    <div class="mb-page">
      <div v-for="a in articles" :key="a.title" class="mb-card mb-card--pad">
        <div class="mb-card__title">{{ a.title }}</div>
        <div class="mb-card__label" style="margin-top: 4px;">{{ a.meta }}</div>
      </div>
    </div>
  </ew-pull-refresh>
</MobileStage>

```vue
<script setup>
import { ref } from 'vue'

const refreshing = ref(false)

async function onRefresh() {
  await reloadFirstScreen()
  refreshing.value = false // 置 false 后自动展示「刷新成功」并收回
}
</script>

<template>
  <EwPullRefresh v-model="refreshing" @refresh="onRefresh">
    <ArticleList :items="articles" />
  </EwPullRefresh>
</template>
```

</DemoBlock>

<script setup>
import { ref } from 'vue'

const refreshing = ref(false)
const r2 = ref(false)
const articles = ref([
  { title: 'Clean Navy 设计语言解读', meta: '设计 · 09-01' },
  { title: '官网动效的克制与叙事', meta: '动效 · 08-24' },
  { title: '明暗双主题的令牌架构', meta: '工程 · 08-15' },
  { title: '网格系统的致密美学', meta: '组件 · 08-08' },
  { title: '阴影只做「托起」不做「投影」', meta: '视觉 · 07-30' },
])
function onRefresh() {
  setTimeout(() => {
    refreshing.value = false
  }, 1200)
}
function onRefresh2() {
  setTimeout(() => {
    r2.value = false
  }, 1200)
}
</script>

## 自定义提示与阈值

`head-height` 调整触发距离（同时是头部高度）；四段文案均可覆盖，头部整体可用
`#head` 插槽替换（插槽参数 `{ status, distance }` 支持完全自定义动画）。

<DemoBlock title="短阈值 + 自定义文案" description="head-height 40、文案定制，便于在触屏上快速体验。">

<MobileStage>
  <ew-pull-refresh
    v-model="r2"
    :head-height="40"
    pulling-text="继续拉"
    loosing-text="松手"
    loading-text="更新中"
    success-text="已是最新"
    @refresh="onRefresh2"
    style="min-height: 100%;"
  >
    <div class="mb-page">
      <div class="mb-card mb-card--pad">
        <div class="mb-card__title">下拉试试</div>
        <div class="mb-card__label" style="margin-top: 4px;">触屏设备下拉此区域释放即可触发</div>
      </div>
    </div>
  </ew-pull-refresh>
</MobileStage>

```vue
<EwPullRefresh
  v-model="refreshing"
  :head-height="40"
  pulling-text="继续拉"
  loosing-text="松手"
  loading-text="更新中"
  success-text="已是最新"
  @refresh="onRefresh"
>
  <ArticleList :items="articles" />
</EwPullRefresh>
```

</DemoBlock>

## API

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| modelValue | boolean | false | 刷新中状态（v-model）；加载完成置 false，自动展示成功态后收回 |
| disabled | boolean | false | 禁用下拉手势 |
| head-height | number | 50 | 触发刷新的下拉距离（px），同时是头部高度 |
| success-duration | number | 500 | 成功态停留时长（ms），0 表示直接收回 |
| animation-duration | number | 300 | 收回/展开动画时长（ms） |
| pulling-text | string | 下拉刷新 | 未到阈值时的提示 |
| loosing-text | string | 释放刷新 | 越过阈值后的提示 |
| loading-text | string | 加载中… | 加载中的提示 |
| success-text | string | 刷新成功 | 完成后的提示 |

### 事件

| 名称 | 参数 | 说明 |
| --- | --- | --- |
| refresh | — | 释放越过阈值时触发，此时进入 loading |
| change | (status, oldStatus) | 状态流转：normal / pulling / loosing / loading / success |
| update:modelValue | (boolean) | v-model 同步 |

### 插槽

| 名称 | 参数 | 说明 |
| --- | --- | --- |
| default | — | 滚动内容 |
| head | { status, distance } | 自定义头部，替换默认提示 |
