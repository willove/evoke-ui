# 内容流

<script setup>
import { ref } from 'vue'

const refreshing = ref(false)
const loadStatus = ref('idle')
const posts = ref([
  { title: 'Clean Navy 设计语言解读', meta: '设计 · 09-01' },
  { title: '官网动效的克制与叙事', meta: '动效 · 08-24' },
  { title: '网格系统的致密美学', meta: '组件 · 08-08' },
  { title: '明暗双主题的令牌架构', meta: '工程 · 08-15' },
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
    posts.value.push(
      { title: `加载的第 ${page} 批内容 A`, meta: '内容 · 今天' },
      { title: `加载的第 ${page} 批内容 B`, meta: '内容 · 今天' },
    )
    if (page >= 3) loadStatus.value = 'noMore'
    else loadStatus.value = 'idle'
  }, 1000)
}
</script>

官网的内容型页面（文章、案例、动态）在移动端是一条**单列内容流**：顶部下拉刷新
对齐原生 App 手感，尾部加载更多替代页码器。EvPullRefresh 与 EvLoadMore 组合即成
完整闭环，业务只需提供「取数据」函数。

## 刷新 + 加载闭环

<DemoBlock title="下拉刷新 + 触底加载" description="触屏设备在流顶部下拉释放即刷新；点击「加载更多」或触底自动加载（autoLoad），两批后转 noMore。">

<MobileStage title="设计日志">
  <ev-pull-refresh v-model="refreshing" @refresh="onRefresh" style="min-height: 100%;">
    <div class="mb-page">
      <div v-for="p in posts" :key="p.title" class="mb-card mb-card--pad">
        <div class="mb-card__title">{{ p.title }}</div>
        <div class="mb-card__label" style="margin-top: 4px;">{{ p.meta }}</div>
      </div>
    </div>
    <ev-load-more v-model:status="loadStatus" :preload="40" @load-more="onLoadMore" />
  </ev-pull-refresh>
</MobileStage>

```vue
<script setup>
import { ref } from 'vue'

const refreshing = ref(false)
const loadStatus = ref('idle')
const posts = ref([])
let page = 0

async function onRefresh() {
  posts.value = await fetchLatest()
  page = 1
  refreshing.value = false // 置 false 自动展示「刷新成功」并收回
}
async function onLoadMore() {
  const next = await fetchPage(++page) // 组件触发时已置 loading
  posts.value.push(...next)
  loadStatus.value = next.length ? 'idle' : 'noMore'
}
</script>

<template>
  <EvPullRefresh v-model="refreshing" @refresh="onRefresh">
    <ArticleCard v-for="p in posts" :key="p.id" v-bind="p" />
    <EvLoadMore v-model:status="loadStatus" :preload="40" @load-more="onLoadMore" />
  </EvPullRefresh>
</template>
```

</DemoBlock>

## 卡片表达

桌面 ArticleCard 的多栏网格在移动端降为**整宽卡片流**：主行标题 + 一行摘要 + 元信息，
封面可选。卡片保留静态信息（触屏无 hover），整卡可点进详情，不做「卡片上的第二个
操作按钮」。

<DemoBlock title="整宽文章卡" description="EvArticleCard 单列排布，hoverable 在触屏上自动无害化。">

<MobileStage title="案例集">
  <div class="mb-page">
    <ev-article-card
      title="云笔记工作台"
      excerpt="以藏青墨色为基底的知识管理界面，留白切分层次。"
      date="2026-08-30"
      :tags="['工作台', 'Clean Navy']"
      :hoverable="true"
    />
    <ev-article-card
      title="品牌官网改版"
      excerpt="特大紧字距标题 + 暖色渐变 Hero 的冲击层语言。"
      date="2026-08-12"
      :tags="['官网', 'Launch Blue']"
    />
  </div>
</MobileStage>

</DemoBlock>

规则：

- **刷新与加载分离**：PullRefresh 管顶部、LoadMore 管尾部，不要把刷新按钮放在页面里。
- **空态与尾态**：没有数据给引导文案（Empty），加载到底给 noMore 收束——组件已内置
  「没有更多了」，不要自绘第二份。
