<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vitepress'
import CompArt from '../.vitepress/theme/CompArt.vue'
import { CATEGORIES } from '../.vitepress/theme/meta.js'

const router = useRouter()
const keyword = ref('')

const groups = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return CATEGORIES
  return CATEGORIES.map((cat) => ({
    ...cat,
    components: cat.components.filter(
      (c) => c.name.toLowerCase().includes(q) || c.zh.toLowerCase().includes(q),
    ),
  })).filter((cat) => cat.components.length)
})

const total = CATEGORIES.reduce((n, cat) => n + cat.components.length, 0)

function go(path) {
  router.go(path)
}
</script>

# 组件总览

Evoke Business UI 目前提供 **{{ total }} 个组件**，按「业务组件、通用组件、布局、数据录入、数据展示、反馈、导航」分区组织：业务组件面向中后台数据管理场景组合使用，通用组件覆盖按钮、表单、表格等常见界面元素，全部组件遵循同一套命名与 v-model 约定。

另有 **5 个移动端专属组件**（NavBar 页头、PullRefresh 下拉刷新、LoadMore 加载更多、ActionSheet 动作面板、Tabbar 底部标签栏）独立收录在[移动端板块 · 移动端组件](/mobile/)分区，不与桌面通用组件混排；各组件文档页顶部的电脑 / 手机图标标注其平台兼容档位（双端兼容 / 仅桌面 / 移动端专属）。

<div class="ov-search">
  <input v-model="keyword" class="ov-search__input" type="text" placeholder="搜索组件，如：table / 筛选 / 日期" autocomplete="off">
</div>

<template v-for="cat in groups" :key="cat.key">
<div class="ov-group">
  <h2 class="ov-group__title">{{ cat.name }}<span class="ov-group__count">{{ cat.components.length }}</span></h2>
  <div class="ov-grid">
    <a
      v-for="c in cat.components"
      :key="c.path"
      class="ov-card"
      :href="c.path"
      @click.prevent="go(c.path)"
    >
      <span class="ov-card__head">{{ c.name }}<i v-if="c.zh" class="ov-card__zh">{{ c.zh }}</i></span>
      <span class="ov-card__art"><CompArt :name="c.name" /></span>
    </a>
  </div>
</div>
</template>

<div v-if="!groups.length" class="ov-empty">没有匹配「{{ keyword }}」的组件</div>

## 没找到想要的组件？

- 业务场景组件在持续补充；
- 也可以直接参考[全屏示例中心](/examples/live/dashboard)，很多场景可以用现有组件组合出来。
