<template>
  <div
    ref="containerRef"
    class="eb-virtual-list eb-virtual-list"
    :style="{ height: containerHeight }"
    @scroll.passive="onScroll"
  >
    <div class="eb-virtual-list__spacer" :style="{ height: totalSize + 'px' }">
      <div
        v-for="item in visibleItems"
        :key="getKey(item)"
        class="eb-virtual-list__item"
        :style="{ transform: `translateY(${item.__offset}px)` }"
        :data-eb-vl-index="item.__index"
      >
        <slot :item="item.__raw" :index="item.__index" />
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * EbVirtualList — 虚拟滚动基元（万级数据只渲染可视窗口）
 *
 * 两种模式：
 * - 固定行高：传 itemSize（数字），纯数学定位
 * - 动态行高：不传 itemSize，渲染后实测高度回填偏移表（估算值 40px 起步，滚动中收敛）
 *
 * 配套：Listy（eb-listy 别名注册）、Select 虚拟化均基于本组件
 */
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { inBrowser } from '../../utils/dom'

defineOptions({ name: 'EbVirtualList' })

const props = defineProps({
  /** 数据源 */
  items: { type: Array, default: () => [] },
  /** 唯一键字段名或 (item) => key 函数；缺省用索引 */
  itemKey: { type: [String, Function], default: '' },
  /** 固定行高（px）；不传则进入动态实测模式 */
  itemSize: { type: Number, default: undefined },
  /** 容器高度（数字 px 或任意 CSS 高度值） */
  height: { type: [Number, String], default: 280 },
  /** 视口外上下各多渲染的条数 */
  buffer: { type: Number, default: 5 },
  /** 动态模式行高估算值（px） */
  estimatedSize: { type: Number, default: 40 },
  /** 距底部多少 px 时触发 scroll-bottom */
  bottomThreshold: { type: Number, default: 20 },
})

const emit = defineEmits(['scroll', 'scroll-bottom', 'range-change'])

const containerRef = ref(null)
const scrollTop = ref(0)
const viewportH = ref(0)

const DEFAULT_ESTIMATE = 40

const containerHeight = computed(() => {
  if (typeof props.height === 'number') return `${props.height}px`
  // 纯数字字符串（height="160"）补 px，避免无效高度导致容器被内容撑开、虚拟化失效
  const h = String(props.height).trim()
  return /^\d+(\.\d+)?$/.test(h) ? `${h}px` : h
})

// ─── 高度与偏移表（动态模式） ───
const sizes = ref([])
const offsets = computed(() => {
  const arr = new Array(sizes.value.length)
  let acc = 0
  for (let i = 0; i < sizes.value.length; i++) {
    arr[i] = acc
    acc += sizes.value[i]
  }
  return arr
})
const totalSize = computed(() =>
  props.itemSize != null
    ? props.items.length * props.itemSize
    : sizes.value.length
      ? offsets.value[sizes.value.length - 1] + sizes.value[sizes.value.length - 1]
      : 0,
)

function getSize(i) {
  return props.itemSize != null ? props.itemSize : sizes.value[i] ?? props.estimatedSize ?? DEFAULT_ESTIMATE
}

function getKey(item, index) {
  if (typeof props.itemKey === 'function') return props.itemKey(item.__raw, item.__index)
  if (props.itemKey) return item.__raw?.[props.itemKey] ?? item.__index
  return index
}

/** 包装渲染条目：携带原数据 / 索引 / 偏移 */
const visibleItems = computed(() => {
  const { start, end } = range.value
  const out = []
  for (let i = start; i <= Math.min(end, props.items.length - 1); i++) {
    out.push({ __raw: props.items[i], __index: i, __offset: props.itemSize != null ? i * props.itemSize : offsets.value[i] })
  }
  return out
})

// ─── 可视窗口计算 ───
const range = computed(() => {
  const count = props.items.length
  if (!count) return { start: 0, end: -1 }
  let start
  if (props.itemSize != null) {
    start = Math.floor(scrollTop.value / props.itemSize) - props.buffer
  } else {
    start = findIndexByOffset(scrollTop.value) - props.buffer
  }
  start = Math.max(0, start)
  let visibleCount = Math.ceil(viewportH.value / getSize(start))
  let end = start + visibleCount + props.buffer * 2
  if (end >= count) end = count - 1
  return { start, end }
})

function findIndexByOffset(offset) {
  const arr = offsets.value
  let lo = 0
  let hi = arr.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (arr[mid] <= offset) lo = mid
    else hi = mid - 1
  }
  return lo
}

watch(
  () => [range.value.start, range.value.end],
  ([s, e]) => emit('range-change', { start: s, end: e }),
  { immediate: true },
)

// ─── 滚动 ───
let bottomFired = false
function onScroll(e) {
  const el = e.target
  scrollTop.value = el.scrollTop
  viewportH.value = el.clientHeight
  emit('scroll', el.scrollTop)
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - props.bottomThreshold
  if (nearBottom && !bottomFired) {
    bottomFired = true
    emit('scroll-bottom')
  } else if (!nearBottom) {
    bottomFired = false
  }
}

// ─── 动态模式：渲染后实测高度回填 ───
async function measureRendered() {
  if (props.itemSize != null || !inBrowser()) return
  await nextTick()
  const el = containerRef.value
  if (!el) return
  const nodes = el.querySelectorAll('[data-eb-vl-index]')
  let changed = false
  const next = sizes.value.slice()
  for (const node of nodes) {
    const i = Number(node.getAttribute('data-eb-vl-index'))
    const h = node.getBoundingClientRect().height
    if (h > 0 && next[i] !== h) {
      next[i] = h
      changed = true
    }
  }
  if (changed) sizes.value = next
}

function syncSizes() {
  sizes.value = props.items.map((_, i) => sizes.value[i] ?? props.estimatedSize ?? DEFAULT_ESTIMATE)
}

watch(() => props.items.length, syncSizes, { immediate: true })

// items 引用变化（替换数组）时重置窗口与实测表
watch(
  () => props.items,
  () => {
    bottomFired = false
  },
)

const RO = typeof ResizeObserver !== 'undefined' ? ResizeObserver : null
let contentRo = null

onMounted(() => {
  const el = containerRef.value
  if (!el || !inBrowser()) return
  viewportH.value = el.clientHeight
  // 内容高度变化（图片加载 / 实测回填）后重新测量
  if (RO) {
    contentRo = new RO(() => measureRendered())
    const spacer = el.firstElementChild
    if (spacer) contentRo.observe(spacer)
  }
  measureRendered()
})

// ─── 对外 API ───
function scrollTo(index, align = 'start') {
  const el = containerRef.value
  if (!el) return
  const i = Math.max(0, Math.min(index, props.items.length - 1))
  const top = props.itemSize != null ? i * props.itemSize : offsets.value[i]
  const size = getSize(i)
  el.scrollTop = align === 'center' ? top - (el.clientHeight - size) / 2 : top
}
function scrollToTop() {
  const el = containerRef.value
  if (el) el.scrollTop = 0
}
function getVisibleRange() {
  return { ...range.value }
}

defineExpose({ scrollTo, scrollToTop, getVisibleRange })
</script>

<style src="./style.css"></style>
