# 案例：个人博客

内容站的结构比官网更简单：一栏文章流 + 一点关于作者的信息，剩下的交给排版。
本案例演示分类筛选的文章列表、热榜轮播、作者名片与订阅框如何拼成一个完整的博客首页。
品牌与文章均为虚构，源码就在本页，可以直接拷走改内容。

**用到的组件**：[EvNavbar](/components/navbar) · [EvTabs](/components/tabs) · [EvArticleCard](/components/article-card) · [EvSection](/components/section) · [EvCarousel](/components/carousel) · [EvQuote](/components/quote) · [EvProfileCard](/components/profile-card) · [EvTimeline](/components/timeline) · [EvNewsletter](/components/newsletter) · [EvFooter](/components/footer)

<script setup>
import CaseStage from '../.vitepress/theme/CaseStage.vue'
import BlogSite from '../.vitepress/theme/case-sites/BlogSite.vue'
</script>

<CaseStage url="shanyue.blog" live-url="/cases/live/blog">
  <BlogSite />
</CaseStage>

## 搭建要点

- **博客不需要 Hero**：一句 motto + 一句更新频率，比首屏大图更符合内容站的气质。`EvSection` 的 `gap="0"` 让标题区与文章流贴在一起。
- **分类筛选 = `EvTabs` + `computed`**：Tab 只负责切换状态，列表交给 `computed` 过滤；右侧的「N 篇」计数让筛选结果可预期。
- **`EvArticleCard` 用 `tag="a"` 让整卡可点**：封面缺省时用图标占位底，不用为占位图发愁；`hoverable` 默认开启上浮。
- **热榜用 `EvQuote` 塞进 `EvCarousel`**：读者原话比阅读量数字更有说服力，`autoplay` 挂 5 秒并自动悬停暂停。
- **关于区左右分栏**：`EvProfileCard` 讲人，`EvTimeline` + `EvNewsletter` 讲更新与订阅，一张 soft 底卡收拢。

## 关键代码

筛选逻辑全部在一个 `computed` 里，模板只负责渲染：

```vue
<script setup>
import { ref, computed } from 'vue'

const categories = ['全部', '前端', '设计', '随想']
const active = ref('全部')

const filtered = computed(() =>
  active.value === '全部'
    ? posts
    : posts.filter((p) => p.category === active.value)
)
</script>

<template>
  <EvTabs v-model="active" :items="categories.map((c) => ({ label: c, value: c }))" />
  <EvArticleCard
    v-for="p in filtered"
    :key="p.title"
    tag="a"
    :title="p.title"
    :excerpt="p.excerpt"
    :date="p.date"
    :tags="p.tags"
    :icon="p.icon"
  />
</template>
```

热榜轮播：`items` 是普通数组，幻灯内容交给作用域插槽：

```vue
<EvCarousel :items="hot" :autoplay="5000">
  <template #item="{ item }">
    <EvQuote :quote="item.quote" :author="item.author" :role="item.role" />
  </template>
</EvCarousel>
```
