<template>
  <div class="ev-icon-grid">
    <!-- 间距类挂在包装层：SearchBox inheritAttrs:false 会把 class 透传到内部 input -->
    <div v-if="searchable" class="ev-icon-grid__search">
      <slot name="search">
        <EvSearchBox
          v-model="keyword"
          v-model:category="activeCategory"
          :categories="categoryOptions"
          :placeholder="placeholder"
        >
          <template v-if="$slots['search-suffix']" #suffix>
            <slot name="search-suffix" />
          </template>
        </EvSearchBox>
      </slot>
    </div>

    <div v-if="loading" class="ev-icon-grid__state">
      <EvIcon name="loading" :size="20" class="is-rotating" />
      <span>Loading icons…</span>
    </div>

    <template v-else-if="sections.length">
      <section v-for="sec in sections" :key="sec.key" class="ev-icon-grid__section">
        <h3 class="ev-icon-grid__title">
          {{ sec.label }}
          <span class="ev-icon-grid__count">{{ sec.icons.length }}</span>
        </h3>
        <div class="ev-icon-grid__grid">
          <button
            v-for="icon in sec.icons"
            :key="icon.name"
            type="button"
            class="ev-icon-grid__cell"
            :class="{ 'is-copied': copiedName === icon.name }"
            :title="`Copy '${icon.name}'`"
            :aria-label="`复制图标名 ${icon.name}`"
            @click="pick(icon)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                v-for="(p, i) in icon.paths"
                :key="i"
                :d="p.d"
                :fill-rule="p.fillRule"
                :fill="p.fill"
              />
            </svg>
            <span class="ev-icon-grid__name">{{ icon.name }}</span>
            <span class="ev-icon-grid__plus" aria-hidden="true">
              <EvIcon :name="copiedName === icon.name ? 'check' : 'plus'" :size="12" />
            </span>
          </button>
        </div>
      </section>
    </template>

    <div v-else class="ev-icon-grid__state">
      <span>No icons found<template v-if="keyword"> for “{{ keyword }}”</template></span>
    </div>
  </div>
</template>

<script setup>
/**
 * EvIconGrid — 可搜索图标网格（remixicon.com 站点的核心界面语言）
 *
 * 内置展示集 900+ 图标（动态 chunk，按需加载）：分类分节 + 计数胶囊 +
 * 关键词/分类过滤 + 点击复制图标名（remixicon 交互语言）
 *
 * 也可通过 icons 属性注入自定义集合：[{ name, category, paths }]
 * paths 为 { viewBox, paths: [{ d, fillRule?, fill? }] }
 */
import { ref, computed, onMounted, watch } from 'vue'
import EvIcon from '../icon/index.vue'
import EvSearchBox from '../search-box/index.vue'
import { useCopy } from '../../composables/useCopy'

const props = defineProps({
  /** 自定义图标集 [{ name, category, paths }]；缺省用内置展示集 */
  icons: { type: Array, default: null },
  /** 展示搜索栏 */
  searchable: { type: Boolean, default: true },
  placeholder: { type: String, default: 'Search icons' },
  /** 点击单元格是否复制图标名 */
  copyOnSelect: { type: Boolean, default: true },
})

const emit = defineEmits(['select', 'copy'])

const keyword = ref('')
const activeCategory = ref('')
const loading = ref(!!props.icons === false)
const builtIn = ref([])
const copiedName = ref('')
const { copy } = useCopy()

// 内置展示集：动态加载（独立 chunk，主包不承担体积）
onMounted(async () => {
  if (props.icons) {
    loading.value = false
    return
  }
  try {
    const m = await import('../icon/showcase.js')
    builtIn.value = Object.entries(m.evShowcasePaths).map(([name, paths]) => ({
      name,
      category: m.EV_SHOWCASE_META[name]?.category || 'Others',
      categoryZh: m.EV_SHOWCASE_META[name]?.categoryZh,
      paths: paths.paths,
      viewBox: paths.viewBox,
    }))
  } finally {
    loading.value = false
  }
})

watch(
  () => props.icons,
  () => {
    if (props.icons) builtIn.value = []
  }
)

const pool = computed(() => {
  if (props.icons) {
    return props.icons.map((it) => ({
      name: it.name,
      category: it.category || 'Default',
      categoryZh: it.categoryZh,
      paths: it.paths?.paths || [],
      viewBox: it.paths?.viewBox || '0 0 24 24',
    }))
  }
  return builtIn.value
})

// 分类下拉：All + 出现过的分类（按首次出现排序）
const categoryOptions = computed(() => {
  const seen = []
  for (const it of pool.value) {
    if (!seen.includes(it.category)) seen.push(it.category)
  }
  return ['All', ...seen]
})

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  const cat = activeCategory.value
  return pool.value.filter((it) => {
    if (cat && cat !== 'All' && it.category !== cat) return false
    if (kw && !it.name.toLowerCase().includes(kw)) return false
    return true
  })
})

// 过滤后按分类分节（保持分类首次出现顺序）
const sections = computed(() => {
  const map = new Map()
  for (const it of filtered.value) {
    if (!map.has(it.category)) map.set(it.category, [])
    map.get(it.category).push(it)
  }
  return [...map.entries()].map(([key, icons]) => ({
    key,
    label: icons[0]?.categoryZh || key,
    icons,
  }))
})

async function pick(icon) {
  emit('select', icon.name)
  if (props.copyOnSelect) {
    const ok = await copy(icon.name)
    if (ok) {
      emit('copy', icon.name)
      copiedName.value = icon.name
      setTimeout(() => {
        if (copiedName.value === icon.name) copiedName.value = ''
      }, 1200)
    }
  }
}
</script>

<style src="./style.css"></style>
