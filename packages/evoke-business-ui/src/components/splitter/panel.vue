<template>
  <div class="eb-splitter-panel" :style="panelStyle">
    <div class="eb-splitter-panel__content">
      <slot />
    </div>
  </div>

  <!--
    拖拽条同时是键盘可操作的分隔器（WAI-ARIA separator）：可拖拽时 role=separator +
    tabindex=0，aria-valuenow/min/max 取前面板（Home/End 与它同语义）。方向轴决定
    哪个方向键：横排布局（左右分栏）用 ←/→，竖排（上下分栏）用 ↑/↓。
  -->
  <div
    v-if="!isLast"
    class="eb-splitter__bar"
    :class="[
      ctx.layout.value === 'horizontal' ? 'is-horizontal' : 'is-vertical',
      nextPanelResizable ? 'is-draggable' : 'is-disabled',
      barDragging ? 'is-dragging' : '',
    ]"
    :role="nextPanelResizable ? 'separator' : undefined"
    :tabindex="nextPanelResizable ? 0 : undefined"
    :aria-orientation="ctx.layout.value === 'horizontal' ? 'vertical' : 'horizontal'"
    :aria-valuenow="Math.round(panelSizeNow)"
    :aria-valuemin="Math.round(panelMinNow)"
    :aria-valuemax="Math.round(panelMaxNow)"
    aria-label="调整面板尺寸"
    @mousedown="onBarMouseDown"
    @keydown="onBarKeydown"
  >
    <div class="eb-splitter__bar-handle">
      <button
        v-if="collapsibleConfig.start && panelIndex > 0"
        type="button"
        class="eb-splitter__bar-btn"
        aria-label="向前折叠"
        @click.stop="onCollapseStart"
      >
        <!-- 方向随布局轴：横排用左右箭头，竖排用上下箭头（形状取自库内 Remix 图标集） -->
        <eb-icon
          :name="ctx.layout.value === 'horizontal' ? 'arrow-left' : 'arrow-up'"
          :size="12"
        />
      </button>
      <button
        v-if="collapsibleConfig.end"
        type="button"
        class="eb-splitter__bar-btn"
        aria-label="向后折叠"
        @click.stop="onCollapseEnd"
      >
        <eb-icon
          :name="ctx.layout.value === 'horizontal' ? 'arrow-right' : 'arrow-down'"
          :size="12"
        />
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
import EbIcon from '../icon/index.vue'

defineOptions({ name: 'EbSplitterPanel' })

const props = defineProps({
  size: { type: [Number, String], default: undefined },
  defaultSize: { type: [Number, String], default: undefined },
  min: { type: [Number, String], default: undefined },
  max: { type: [Number, String], default: undefined },
  resizable: { type: Boolean, default: true },
  collapsible: { type: [Boolean, Object], default: false },
  /** 键盘 resize 步长（px）：方向键每按一次移动的像素 */
  keyboardStep: { type: Number, default: 8 },
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

/** 分隔器的 aria 值：取本面板（条前那一侧）的当前尺寸与夹角 */
const resolveBound = (value, fallback) => {
  const total = ctx.containerSize?.value ?? 0
  if (value === undefined || value === null) return fallback
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.endsWith('%')) return (parseFloat(value) / 100) * total
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : fallback
}
const panelSizeNow = computed(() => ctx.sizes.value[panelIndex.value] ?? 0)
const panelMinNow = computed(() => resolveBound(props.min, 0))
const panelMaxNow = computed(() => resolveBound(props.max, ctx.containerSize?.value ?? 0))

/**
 * 键盘 resize：方向键按 step 移动边界，Home/End 到 min/max（与拖拽同一套夹角）。
 * 组字中不响应——输入法合成期间的键盘事件不是用户指令（与 tools-ui G5 同口径）。
 */
function onBarKeydown(e) {
  if (e.isComposing || e.keyCode === 229) return
  const idx = panelIndex.value
  const horizontal = ctx.layout.value === 'horizontal'
  const decrease = horizontal ? 'ArrowLeft' : 'ArrowUp'
  const increase = horizontal ? 'ArrowRight' : 'ArrowDown'
  if (e.key === decrease) ctx.keyboardResize(idx, { kind: 'step', delta: -props.keyboardStep })
  else if (e.key === increase) ctx.keyboardResize(idx, { kind: 'step', delta: props.keyboardStep })
  else if (e.key === 'Home') ctx.keyboardResize(idx, { kind: 'min' })
  else if (e.key === 'End') ctx.keyboardResize(idx, { kind: 'max' })
  else return
  e.preventDefault()
}

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
