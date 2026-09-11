<template>
  <div class="eb-splitter-panel" :style="panelStyle">
    <div class="eb-splitter-panel__content">
      <slot />
    </div>
  </div>

  <div
    v-if="!isLast"
    class="eb-splitter__bar"
    :class="[
      ctx.layout.value === 'horizontal' ? 'is-horizontal' : 'is-vertical',
      nextPanelResizable ? 'is-draggable' : 'is-disabled',
      barDragging ? 'is-dragging' : '',
    ]"
    @mousedown="onBarMouseDown"
  >
    <div class="eb-splitter__bar-handle">
      <button
        v-if="collapsibleConfig.start && panelIndex > 0"
        type="button"
        class="eb-splitter__bar-btn"
        aria-label="向前折叠"
        @click.stop="onCollapseStart"
      >
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <path
            v-if="ctx.layout.value === 'horizontal'"
            d="M10 3L5 8L10 13"
            stroke="currentColor" stroke-width="1.5" fill="none"
            stroke-linecap="round" stroke-linejoin="round"
          />
          <path
            v-else
            d="M3 10L8 5L13 10"
            stroke="currentColor" stroke-width="1.5" fill="none"
            stroke-linecap="round" stroke-linejoin="round"
          />
        </svg>
      </button>
      <button
        v-if="collapsibleConfig.end"
        type="button"
        class="eb-splitter__bar-btn"
        aria-label="向后折叠"
        @click.stop="onCollapseEnd"
      >
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <path
            v-if="ctx.layout.value === 'horizontal'"
            d="M6 3L11 8L6 13"
            stroke="currentColor" stroke-width="1.5" fill="none"
            stroke-linecap="round" stroke-linejoin="round"
          />
          <path
            v-else
            d="M3 6L8 11L13 6"
            stroke="currentColor" stroke-width="1.5" fill="none"
            stroke-linecap="round" stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * EbSplitterPanel — 分隔面板子面板
 * inject 父级上下文，自渲染面板内容与拖拽条；size 受控 / defaultSize 非受控 / min / max / collapsible
 */
import { computed, inject, onMounted, onBeforeUnmount, watch, ref } from 'vue'

defineOptions({ name: 'EbSplitterPanel' })

const props = defineProps({
  size: { type: [Number, String], default: undefined },
  defaultSize: { type: [Number, String], default: undefined },
  min: { type: [Number, String], default: undefined },
  max: { type: [Number, String], default: undefined },
  resizable: { type: Boolean, default: true },
  collapsible: { type: [Boolean, Object], default: false },
})

const ctx = inject('evSplitter')

if (!ctx) {
  throw new Error('EbSplitterPanel must be used inside EbSplitter')
}

const uid = ref(ctx.allocateUid())

onMounted(() => {
  ctx.registerPanel({
    uid: uid.value,
    size: props.size,
    defaultSize: props.defaultSize,
    min: props.min,
    max: props.max,
    resizable: props.resizable,
    collapsible: props.collapsible,
  })
})

onBeforeUnmount(() => {
  ctx.unregisterPanel(uid.value)
})

watch(
  () => ({
    size: props.size,
    defaultSize: props.defaultSize,
    min: props.min,
    max: props.max,
    resizable: props.resizable,
    collapsible: props.collapsible,
  }),
  (updates) => {
    ctx.updatePanel(uid.value, updates)
  },
  { deep: true },
)

const panelIndex = computed(() => ctx.getPanelIndex(uid.value))

const panelStyle = computed(() => {
  const idx = panelIndex.value
  if (idx < 0) return {}
  const size = ctx.sizes.value[idx] ?? 0
  if (ctx.layout.value === 'horizontal') {
    return { width: `${size}px`, flexShrink: '0', flexGrow: '0' }
  }
  return { height: `${size}px`, flexShrink: '0', flexGrow: '0' }
})

const isLast = computed(() => panelIndex.value >= ctx.getPanelCount() - 1)

// 拖拽条可用性：本面板与下一面板均可拖拽（startDrag 时两侧都校验）
const nextPanelResizable = computed(() => ctx.isPanelResizable(panelIndex.value))

const barDragging = computed(() => ctx.draggingIndex.value === panelIndex.value)

const collapsibleConfig = computed(() => {
  const c = props.collapsible
  if (!c) return { start: false, end: false }
  if (typeof c === 'boolean') return { start: c, end: c }
  return { start: c.start ?? false, end: c.end ?? false }
})

function onBarMouseDown(e) {
  ctx.startDrag(panelIndex.value, e)
}

function onCollapseStart() {
  ctx.collapsePanel(panelIndex.value, 'start')
}

function onCollapseEnd() {
  ctx.collapsePanel(panelIndex.value, 'end')
}
</script>

<style src="./style.css"></style>
