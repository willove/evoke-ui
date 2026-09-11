<template>
  <div ref="containerRef" class="eb-splitter" :class="layout === 'horizontal' ? 'is-horizontal' : 'is-vertical'">
    <slot />
  </div>
</template>

<script setup>
/**
 * EbSplitter — 分隔面板容器
 * 面板注册 + 尺寸分摊 + 拖拽（min/max 夹角互不越界）+ 折叠；
 * resize 事件回传百分比数组。子面板 EbSplitterPanel 通过 inject 自渲染拖拽条。
 */
import { computed, provide, ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  layout: {
    type: String,
    default: 'horizontal',
    validator: (v) => ['horizontal', 'vertical'].includes(v),
  },
})

const emit = defineEmits(['resize'])

const containerRef = ref(null)
const containerSize = ref(0)

// ─── 面板注册 ───
const panels = reactive([])
const sizes = ref([])
let nextUid = 0

function registerPanel(entry) {
  panels.push(entry)
  sizes.value.push(0)
  recalculate()
}

function unregisterPanel(uid) {
  const idx = panels.findIndex((p) => p.uid === uid)
  if (idx >= 0) {
    panels.splice(idx, 1)
    sizes.value.splice(idx, 1)
    recalculate()
  }
}

function updatePanel(uid, updates) {
  const panel = panels.find((p) => p.uid === uid)
  if (panel) {
    Object.assign(panel, updates)
    recalculate()
  }
}

function getPanelIndex(uid) {
  return panels.findIndex((p) => p.uid === uid)
}

function getPanelCount() {
  return panels.length
}

provide('evSplitter', {
  layout: computed(() => props.layout),
  sizes,
  containerSize,
  registerPanel,
  unregisterPanel,
  updatePanel,
  allocateUid: () => nextUid++,
  getPanelIndex,
  getPanelCount,
  isPanelResizable: (index) => panels[index]?.resizable !== false && panels[index + 1]?.resizable !== false,
  startDrag,
  collapsePanel,
  draggingIndex: computed(() => draggingIndex.value),
})

// ─── 尺寸解析 ───
function parseSizeValue(value, containerPx) {
  if (value === undefined || value === null) return null
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.endsWith('%')) {
    return (parseFloat(value) / 100) * containerPx
  }
  return parseFloat(value)
}

function recalculate() {
  const container = containerRef.value
  if (!container) return

  const totalSize = props.layout === 'horizontal' ? container.clientWidth : container.clientHeight
  containerSize.value = totalSize

  if (panels.length === 0 || totalSize === 0) return

  const result = []
  let remaining = totalSize
  let unassignedCount = 0

  for (let i = 0; i < panels.length; i++) {
    const panel = panels[i]
    const sizeValue = panel.size ?? panel.defaultSize
    const parsed = parseSizeValue(sizeValue, totalSize)
    if (parsed !== null) {
      result[i] = parsed
      remaining -= parsed
    } else {
      result[i] = -1
      unassignedCount++
    }
  }

  if (unassignedCount > 0) {
    const share = remaining / unassignedCount
    for (let i = 0; i < result.length; i++) {
      if (result[i] === -1) result[i] = share
    }
  }

  sizes.value = result
}

// ─── 拖拽逻辑 ───
const draggingIndex = ref(null)
const dragStartPos = ref(0)
const dragStartSizes = ref([])

function startDrag(barIndex, e) {
  e.preventDefault()
  const panelA = panels[barIndex]
  const panelB = panels[barIndex + 1]
  if (panelA.resizable === false || panelB.resizable === false) return

  draggingIndex.value = barIndex
  dragStartPos.value = props.layout === 'horizontal' ? e.clientX : e.clientY
  dragStartSizes.value = [...sizes.value]

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
  document.body.style.cursor = props.layout === 'horizontal' ? 'col-resize' : 'row-resize'
  document.body.style.userSelect = 'none'
}

function onMouseMove(e) {
  if (draggingIndex.value === null) return

  const currentPos = props.layout === 'horizontal' ? e.clientX : e.clientY
  const delta = currentPos - dragStartPos.value
  const idx = draggingIndex.value
  const totalSize = containerSize.value

  const panelA = panels[idx]
  const panelB = panels[idx + 1]

  const minA = parseSizeValue(panelA.min, totalSize) ?? 0
  const maxA = parseSizeValue(panelA.max, totalSize) ?? totalSize
  const minB = parseSizeValue(panelB.min, totalSize) ?? 0
  const maxB = parseSizeValue(panelB.max, totalSize) ?? totalSize

  const startA = dragStartSizes.value[idx]
  const startB = dragStartSizes.value[idx + 1]
  const totalAB = startA + startB

  let newA = startA + delta
  let newB = startB - delta

  newA = Math.max(minA, Math.min(maxA, newA))
  newB = totalAB - newA
  newB = Math.max(minB, Math.min(maxB, newB))
  newA = totalAB - newB

  sizes.value[idx] = newA
  sizes.value[idx + 1] = newB

  emitResize()
}

function onMouseUp() {
  draggingIndex.value = null
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// ─── 折叠 ───
function collapsePanel(panelIndex, direction) {
  if (direction === 'start' && panelIndex > 0) {
    sizes.value[panelIndex - 1] += sizes.value[panelIndex]
    sizes.value[panelIndex] = 0
  } else if (direction === 'end' && panelIndex < panels.length - 1) {
    sizes.value[panelIndex + 1] += sizes.value[panelIndex]
    sizes.value[panelIndex] = 0
  }
  emitResize()
}

function emitResize() {
  const totalSize = containerSize.value
  if (totalSize === 0) return
  const result = sizes.value.map((px) => `${((px / totalSize) * 100).toFixed(2)}%`)
  emit('resize', result)
}

// ─── 生命周期 ───
watch(
  () => props.layout,
  () => recalculate(),
)

let resizeObserver = null

onMounted(() => {
  if (containerRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      const container = containerRef.value
      if (!container) return
      const newSize = props.layout === 'horizontal' ? container.clientWidth : container.clientHeight
      if (newSize !== containerSize.value) {
        containerSize.value = newSize
        recalculate()
        emitResize()
      }
    })
    resizeObserver.observe(containerRef.value)
  }
  recalculate()
  // 初始布局完成后同步一次尺寸（消费方初始化分栏用）
  emitResize()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
})
</script>

<style src="./style.css"></style>
