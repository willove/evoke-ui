<script setup>
/**
 * 内置图标总览：核心集按 Remix 分类分组；完整图标库（Remix 全量 3229 个，
 * 原生命名）点击按钮按需加载后纳入搜索与展示。点击任意图标复制其名称。
 * 数据来自组件库导出的 REMIX_ICON_META（由 generate-remix-icons.mjs 生成）。
 */
import { computed, ref } from 'vue'
import {
  getIconByNameSync,
  getIconNames,
  loadFullIcons,
  isFullIconsLoaded,
  REMIX_ICON_META,
  REMIX_ICON_VERSION,
} from '@wil-works/evoke-business-ui'

const CATEGORY_LABELS = {
  Arrows: '箭头与方向',
  System: '系统',
  Design: '设计',
  Document: '文档',
  Editor: '编辑',
  Business: '商务',
  Communication: '沟通',
  Device: '设备',
  Media: '媒体',
  Weather: '天气',
  'User & Faces': '用户',
  Development: '开发',
  Finance: '金融',
  Buildings: '建筑',
  Logos: '品牌 Logo',
  Map: '地图出行',
  Food: '食饮',
  'Game & Sports': '游戏运动',
  'Health & Medical': '健康医疗',
  Others: '其他',
}

const keyword = ref('')
const copied = ref('')
const fullLoading = ref(false)
const fullLoaded = ref(isFullIconsLoaded())
const renderTick = ref(0)

async function handleLoadFull() {
  fullLoading.value = true
  try {
    await loadFullIcons()
    fullLoaded.value = true
    renderTick.value++
  } finally {
    fullLoading.value = false
  }
}

const groups = computed(() => {
  void renderTick.value
  const kw = keyword.value.trim().toLowerCase()
  const byCategory = new Map()
  for (const [name, meta] of Object.entries(REMIX_ICON_META)) {
    if (kw && !name.toLowerCase().includes(kw) && !meta.remix.toLowerCase().includes(kw)) continue
    if (!byCategory.has(meta.category)) byCategory.set(meta.category, [])
    byCategory.get(meta.category).push(name)
  }
  return [...byCategory.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([category, names]) => ({
      category,
      label: CATEGORY_LABELS[category] ?? category,
      names: names.sort(),
    }))
})

// 完整图标库（原生命名）：按关键词过滤，渲染上限 300 个防 DOM 爆炸
const MAX_FULL_RENDER = 300
const fullGroup = computed(() => {
  void renderTick.value
  if (!fullLoaded.value) return null
  const kw = keyword.value.trim().toLowerCase()
  const names = getIconNames('full').filter((n) => !kw || n.toLowerCase().includes(kw)).sort()
  return { label: '完整图标库（Remix 原生命名）', names: names.slice(0, MAX_FULL_RENDER), total: names.length }
})

const total = computed(() => {
  void renderTick.value
  const kw = keyword.value.trim().toLowerCase()
  const core = groups.value.reduce((sum, g) => sum + g.names.length, 0)
  if (!fullGroup.value) return core
  const fullMatched = getIconNames('full').filter((n) => !kw || n.toLowerCase().includes(kw)).length
  return core + fullMatched
})

// 文件类型图标族（xlsx/xls/excel 等多别名指向同一资源的入口名）
const fileTypeNames = [
  'file-excel', 'file-word', 'file-ppt', 'file-pdf', 'file-zip',
  'file-music', 'file-video', 'file-code', 'file-image', 'file-text',
]

async function copyName(name) {
  try {
    await navigator.clipboard.writeText(name)
    copied.value = name
    setTimeout(() => {
      if (copied.value === name) copied.value = ''
    }, 1200)
  } catch {
    /* 剪贴板不可用时静默 */
  }
}
</script>

<template>
  <div class="icon-gallery">
    <div class="icon-gallery__toolbar">
      <input
        v-model="keyword"
        class="icon-gallery__search"
        type="search"
        placeholder="搜索图标名，如 arrow、check、file…"
      />
      <span class="icon-gallery__count">
        {{ total }} 个 · 核心 {{ Object.keys(REMIX_ICON_META).length }} · Remix Icon v{{ REMIX_ICON_VERSION }}
      </span>
    </div>

    <div v-if="!fullLoaded" class="icon-gallery__full-cta">
      <button type="button" class="icon-gallery__load" :disabled="fullLoading" @click="handleLoadFull">
        {{ fullLoading ? '加载中…' : '加载完整图标库（Remix 全量 3229 个，约 1.6MB，按需加载）' }}
      </button>
    </div>

    <section v-for="group in groups" :key="group.category" class="icon-gallery__group">
      <h3 class="icon-gallery__title">
        {{ group.label }}<span class="icon-gallery__title-count">{{ group.names.length }}</span>
      </h3>
      <div class="icon-gallery__grid">
        <button
          v-for="name in group.names"
          :key="name"
          type="button"
          class="icon-gallery__cell"
          :title="`点击复制 ${name}`"
          @click="copyName(name)"
        >
          <eb-icon :name="name" :size="20" />
          <span class="icon-gallery__name">{{ copied === name ? '已复制' : name }}</span>
        </button>
      </div>
    </section>

    <section v-if="fullGroup" class="icon-gallery__group">
      <h3 class="icon-gallery__title">
        {{ fullGroup.label }}<span class="icon-gallery__title-count">{{ fullGroup.total }}</span>
      </h3>
      <div class="icon-gallery__grid">
        <button
          v-for="name in fullGroup.names"
          :key="name"
          type="button"
          class="icon-gallery__cell"
          :title="`点击复制 ${name}`"
          @click="copyName(name)"
        >
          <eb-icon :name="name" :size="20" />
          <span class="icon-gallery__name">{{ copied === name ? '已复制' : name }}</span>
        </button>
      </div>
      <p v-if="fullGroup.total > fullGroup.names.length" class="icon-gallery__more">
        匹配 {{ fullGroup.total }} 个，仅展示前 {{ fullGroup.names.length }} 个，请细化关键词
      </p>
    </section>

    <p v-if="!total" class="icon-gallery__empty">没有匹配「{{ keyword }}」的图标</p>

    <section v-if="!keyword" class="icon-gallery__group">
      <h3 class="icon-gallery__title">
        文件类型<span class="icon-gallery__title-count">{{ fileTypeNames.length }}</span>
      </h3>
      <div class="icon-gallery__grid">
        <button
          v-for="name in fileTypeNames"
          :key="name"
          type="button"
          class="icon-gallery__cell"
          :title="`点击复制 ${name}`"
          @click="copyName(name)"
        >
          <eb-icon :name="name" :size="20" />
          <span class="icon-gallery__name">{{ copied === name ? '已复制' : name }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.icon-gallery__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 0 20px;
  flex-wrap: wrap;
}

.icon-gallery__full-cta {
  margin: 0 0 20px;
}

.icon-gallery__load {
  padding: 8px 16px;
  border: 1px dashed var(--eb-color-primary, #175dff);
  border-radius: 6px;
  background: var(--eb-fill-color-light, rgba(23, 93, 255, 0.04));
  color: var(--eb-color-primary, #175dff);
  font-size: 13px;
  cursor: pointer;
}

.icon-gallery__load:hover:not(:disabled) {
  background: var(--eb-color-primary-light-9, rgba(23, 93, 255, 0.1));
}

.icon-gallery__load:disabled {
  opacity: 0.6;
  cursor: wait;
}

.icon-gallery__more {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--eb-text-color-secondary, #909399);
}

.icon-gallery__search {
  flex: 0 1 280px;
  padding: 7px 12px;
  border: 1px solid var(--eb-border-color, #dcdfe6);
  border-radius: 6px;
  background: var(--eb-bg-color, transparent);
  color: var(--eb-text-color-primary, inherit);
  font-size: 13px;
  outline: none;
}

.icon-gallery__search:focus {
  border-color: var(--eb-color-primary, #175dff);
}

.icon-gallery__count {
  font-size: 12px;
  color: var(--eb-text-color-secondary, #909399);
}

.icon-gallery__group {
  margin-bottom: 28px;
}

.icon-gallery__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 10px;
  color: var(--eb-text-color-primary, inherit);
}

.icon-gallery__title-count {
  font-size: 12px;
  font-weight: 400;
  color: var(--eb-text-color-secondary, #909399);
}

.icon-gallery__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 6px;
}

.icon-gallery__cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 4px 8px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--eb-text-color-primary, inherit);
  cursor: pointer;
}

.icon-gallery__cell:hover {
  background: var(--eb-fill-color-light, rgba(23, 93, 255, 0.06));
  border-color: var(--eb-color-primary-light-7, rgba(23, 93, 255, 0.18));
  color: var(--eb-color-primary, #175dff);
}

.icon-gallery__name {
  max-width: 100%;
  /* 固定行高：中文名（已复制）与英文名行盒高度一致，避免点击复制时页面抖动 */
  height: 14px;
  line-height: 14px;
  font-size: 11px;
  color: var(--eb-text-color-secondary, #909399);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.icon-gallery__cell:hover .icon-gallery__name {
  color: var(--eb-color-primary, #175dff);
}

.icon-gallery__empty {
  font-size: 13px;
  color: var(--eb-text-color-secondary, #909399);
}
</style>
