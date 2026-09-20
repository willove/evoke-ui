<template>
  <div
    ref="containerRef"
    class="ev-chart3d"
    :style="containerStyle"
    role="img"
    :tabindex="isEmpty || internalError ? -1 : 0"
    :aria-label="props.options.ariaLabel || ariaLabelText"
    @keydown="handleKeydown"
    @focusout="handleFocusOut"
  >
    <canvas
      v-if="!isEmpty && !internalError"
      ref="canvasRef"
      class="ev-chart3d__canvas"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
      @dblclick="handleDblClick"
      @pointerleave="handlePointerLeave"
    />

    <!-- HTML 覆盖层：富文本旁白 / 自定义标记 -->
    <div v-if="!isEmpty && !props.options.loading && !internalError && $slots.overlay" class="ev-chart3d__overlay">
      <slot name="overlay" :plot-area="overlayInfo.viewport" :camera="overlayInfo.camera" :options="props.options" />
    </div>

    <!-- 空数据占位 -->
    <Transition name="ev-chart3d-fade">
      <div v-if="isEmpty && !props.options.loading && !internalError" class="ev-chart3d__empty">
        <div class="ev-chart3d__empty-icon-wrap">
          <svg class="ev-chart3d__empty-img" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <path d="M8 34 24 12l16 22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M8 34h32" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          </svg>
        </div>
        <span class="ev-chart3d__empty-text">{{ emptyText }}</span>
      </div>
    </Transition>

    <!-- 加载骨架 -->
    <Transition name="ev-chart3d-fade">
      <div v-if="props.options.loading && !internalError" class="ev-chart3d__loading">
        <div class="ev-chart3d__loading-bars">
          <div v-for="i in 6" :key="i" class="ev-chart3d__loading-bar" :style="{ animationDelay: `${i * 80}ms` }" />
        </div>
      </div>
    </Transition>

    <!-- 错误边界 -->
    <Transition name="ev-chart3d-fade">
      <div v-if="internalError" class="ev-chart3d__error">
        <span class="ev-chart3d__error-icon">
          <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="7.5" x2="12" y2="13" />
            <line x1="12" y1="16.5" x2="12" y2="16.51" />
          </svg>
        </span>
        <span class="ev-chart3d__error-text">{{ internalError }}</span>
      </div>
    </Transition>

    <Transition name="ev-chart3d-tooltip">
      <div
        v-if="tooltipVisible && tooltipContent"
        ref="tooltipRef"
        class="ev-chart3d__tooltip"
        :class="`ev-chart3d__tooltip--${tooltipPlacement}`"
        :style="tooltipStyle"
        role="tooltip"
        v-html="tooltipContent"
      />
    </Transition>

    <div class="ev-chart3d__sr-only" role="status" aria-live="polite">{{ ariaLiveText }}</div>
  </div>
</template>

<script setup>
import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  shallowRef,
  watch,
} from 'vue'
import { DEFAULT_CAMERA, autoRotateBy, cameraPayload, orbitBy, panBy, resolveCamera, wheelZoomFactor, zoomBy } from './core/camera.js'
import { render3d } from './renderer/index.js'
import { hitLegend } from './renderer/legend3d.js'
import { getTheme, resolveEasing, resolveI18n } from './types.js'
import { resolveChartPalette } from './palette.js'
import { formatNumber } from './core/scale3d.js'
import { escapeHtml } from './renderer/shared.js'
import { validateOptions3d } from './schema.js'

/**
 * 三维图表组件 — options 驱动，与 EvChart 同一套使用心智：
 * 同为 options 单 prop、同四态（空/载/错/成）、同令牌与换肤事件、同 BEM 命名族。
 * 差异仅在：交互从「hover 数据」扩展为「轨道视角 + hover 数据」双层。
 */
defineOptions({ name: 'EvChart3d' })

const props = defineProps({
  options: { type: Object, required: true },
  width: { type: [String, Number], default: '100%' },
  height: { type: [String, Number], default: 400 },
  responsive: { type: Boolean, default: true },
  devicePixelRatio: { type: Number, default: undefined },
})

const emit = defineEmits([
  'ready',
  'click',
  'hover',
  'unhover',
  'legend-click',
  'animation-end',
  'data-update',
  'camera-change',
])

// ── DOM refs ──
const containerRef = ref(null)
const canvasRef = ref(null)
const tooltipRef = ref(null)

// ── 状态 ──
const internalError = ref('')
const tooltipVisible = ref(false)
const tooltipContent = ref('')
const tooltipX = ref(0)
const tooltipY = ref(0)
const tooltipPlacement = ref('top')
const ariaLiveText = ref('')
const overlayInfo = reactive({ viewport: null, camera: null })
const cameraState = shallowRef(null)
const lastResult = shallowRef(null)
const hiddenSeries = ref(new Set())
const hoverKey = ref(null)

const dpr = computed(() => {
  if (Number.isFinite(props.devicePixelRatio) && props.devicePixelRatio > 0) return props.devicePixelRatio
  try {
    return (typeof window !== 'undefined' && window.devicePixelRatio) || 1
  } catch {
    return 1
  }
})

const containerStyle = computed(() => {
  const w = typeof props.width === 'number' ? `${props.width}px` : props.width
  const h = typeof props.height === 'number' ? `${props.height}px` : props.height
  return { width: w, height: h }
})

const isEmpty = computed(() => {
  if (props.options.loading) return false
  const o = props.options
  const type = o.type
  if (type === 'pie3d') {
    const list = Array.isArray(o.pieData) ? o.pieData : []
    return !list.some((d) => {
      const v = Number(d && d.value)
      return Number.isFinite(v) && v !== 0
    })
  }
  if (type === 'surface3d') {
    const sd = o.surfaceData && typeof o.surfaceData === 'object' ? o.surfaceData : {}
    const matrix = Array.isArray(sd.z) ? sd.z : Array.isArray(o.matrix) ? o.matrix : []
    return !matrix.some((row) => Array.isArray(row) && row.some((v) => Number.isFinite(Number(v))))
  }
  if (type === 'scatter3d') {
    const free = Array.isArray(o.scatterData) && o.scatterData.length > 0
    const series = Array.isArray(o.series) ? o.series : []
    return !free && !series.some((s) => Array.isArray(s && s.data) && s.data.length > 0)
  }
  const labels = Array.isArray(o.labels) ? o.labels : []
  const series = Array.isArray(o.series) ? o.series : []
  return !series.some((s) => Array.isArray(s && s.data) && s.data.length > 0) && !labels.length
})

const ariaLabelText = computed(() => `3d-${props.options.type || 'chart'}-${props.options.title || ''}`)

const emptyText = computed(() => resolveI18n(props.options).noData)

// ── 主题 ──
function currentTheme() {
  return getTheme(props.options, props.options.theme, resolveChartPalette(props.options.palette, undefined))
}

function currentCamera() {
  const type = props.options.type
  const fallbackTarget = type === 'pie3d' ? [0, 0, 0.1] : [0, 0, 0.31]
  return resolveCamera({ target: fallbackTarget, ...(props.options.camera || {}) })
}

// ── 渲染调度 ──
let renderTimer = null
let animState = null
let animRafId = 0
let autoRafId = 0
let lastAutoTs = 0
let userTouchedCamera = false
let dragState = null
const pointers = new Map()
let pinchDist = 0

function scheduleRender(delay = 16) {
  if (renderTimer) clearTimeout(renderTimer)
  renderTimer = setTimeout(() => {
    renderTimer = null
    render()
  }, delay)
}

function sizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = containerRef.value
    ? containerRef.value.getBoundingClientRect()
    : { width: props.width, height: props.height }
  const cssW = Math.max(1, Math.round(rect.width || 0))
  const cssH = Math.max(1, Math.round(rect.height || 0))
  const deviceW = Math.round(cssW * dpr.value)
  const deviceH = Math.round(cssH * dpr.value)
  if (canvas.width !== deviceW || canvas.height !== deviceH) {
    canvas.width = deviceW
    canvas.height = deviceH
  }
  return { cssW, cssH }
}

function render() {
  const canvas = canvasRef.value
  if (!canvas || isEmpty.value || internalError.value) return
  try {
    const size = sizeCanvas()
    if (!size) return
    if (!cameraState.value) cameraState.value = currentCamera()
    const result = render3d(canvas, {
      options: props.options,
      dpr: dpr.value,
      progress: animState ? animState.progress : 1,
      camera: cameraState.value,
      hiddenSeries: hiddenSeries.value,
      hoverKey: hoverKey.value,
      theme: currentTheme(),
      autoFit: !userTouchedCamera,
    })
    lastResult.value = result
    overlayInfo.viewport = result.viewport
    overlayInfo.camera = result.camera
  } catch (err) {
    internalError.value = '渲染失败'
    if (typeof console !== 'undefined') console.error('[EvChart3d] render error:', err)
  }
}

function startEnterAnimation() {
  const cfg = props.options.animation && typeof props.options.animation === 'object' ? props.options.animation : {}
  if (cfg.enabled === false) {
    animState = null
    render()
    emit('ready')
    return
  }
  const duration = Number.isFinite(cfg.duration) ? Math.max(0, cfg.duration) : 600
  const easing = resolveEasing(cfg.easing)
  const startTime = Date.now()
  animState = { startTime, duration, easing, progress: 0 }
  const step = () => {
    if (!animState) return
    const t = Math.min(1, (Date.now() - animState.startTime) / Math.max(1, animState.duration))
    animState.progress = easing(t)
    render()
    if (t < 1) {
      animRafId = requestAnimationFrame(step)
    } else {
      animState = null
      emit('animation-end')
      emit('ready')
    }
  }
  if (animRafId) cancelAnimationFrame(animRafId)
  animRafId = requestAnimationFrame(step)
}

// ── 自动旋转 ──
function autoRotateLoop(ts) {
  autoRafId = 0
  const cam = cameraState.value
  if (!cam || !cam.autoRotate || dragState) {
    lastAutoTs = 0
    return
  }
  const dt = lastAutoTs ? ts - lastAutoTs : 16
  lastAutoTs = ts
  applyCamera(autoRotateBy(cam, Math.min(64, dt)), { emitEvent: false })
  autoRafId = requestAnimationFrame(autoRotateLoop)
}

function ensureAutoRotate() {
  if (autoRafId) return
  lastAutoTs = 0
  autoRafId = requestAnimationFrame(autoRotateLoop)
}

function stopAutoRotate() {
  if (autoRafId) {
    cancelAnimationFrame(autoRafId)
    autoRafId = 0
  }
}

// ── 相机应用 ──
function applyCamera(next, options = {}) {
  cameraState.value = next
  if (options.emitEvent !== false) emit('camera-change', cameraPayload(next))
  if (options.autoRotate) ensureAutoRotate()
  render()
}

function resetCamera(options = {}) {
  userTouchedCamera = !options.keepAutoFit
  applyCamera(currentCamera())
}

// ── 拾取与提示 ──
function canvasPoint(evt) {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  return { x: evt.clientX - rect.left, y: evt.clientY - rect.top }
}

function currentPick(x, y) {
  const result = lastResult.value
  if (!result || !result.pickAt) return null
  return result.pickAt(x, y)
}

function formatTooltipValue(v) {
  const vf = props.options.tooltip && props.options.tooltip.valueFormatter
  if (typeof vf === 'function') return vf(v)
  const abs = Math.abs(Number(v))
  if (Number.isFinite(abs) && abs >= 10000) return formatNumber(Number(v), { abbreviate: true })
  return formatNumber(Number(v), { decimals: Number.isFinite(Number(v)) && Number(v) % 1 !== 0 ? 2 : 0 })
}

function buildTooltipRows(meta) {
  const i18n = resolveI18n(props.options)
  const rows = []
  const push = (name, value, color) => rows.push({ name, value, color })
  if (meta.type === 'scatter3d' && meta.name === null) {
    push(i18n.tooltip.x, formatTooltipValue(meta.x), meta.color)
    push(i18n.tooltip.y, formatTooltipValue(meta.y), meta.color)
    push(i18n.tooltip.z, formatTooltipValue(meta.z), meta.color)
    return rows
  }
  if (meta.type === 'surface3d') {
    push(i18n.tooltip.x, String(meta.x), meta.color)
    push(i18n.tooltip.y, String(meta.y), meta.color)
    push(i18n.tooltip.value, formatTooltipValue(meta.value), meta.color)
    return rows
  }
  if (meta.type === 'pie3d') {
    push(meta.name, formatTooltipValue(meta.value), meta.color)
    push(i18n.tooltip.percent, `${(meta.percent * 100).toFixed(1)}%`, meta.color)
    return rows
  }
  push(meta.seriesName, formatTooltipValue(meta.value), meta.color)
  return rows
}

function updateTooltip(hit, cx, cy) {
  const cfg = props.options.tooltip && typeof props.options.tooltip === 'object' ? props.options.tooltip : {}
  if (cfg.show === false || !hit) {
    tooltipVisible.value = false
    tooltipContent.value = ''
    return
  }
  const formatter = cfg.formatter
  tooltipContent.value = typeof formatter === 'function'
    ? String(formatter(hit.meta) ?? '')
    : buildTooltipHtml(hit.meta)
  tooltipVisible.value = !!tooltipContent.value
  positionTooltip(cx, cy)
}

function buildTooltipHtml(meta) {
  const rows = buildTooltipRows(meta)
  const title = meta.name !== null && meta.name !== undefined ? meta.name : meta.seriesName
  let html = ''
  if (title) html += `<div class="ev-chart3d__tooltip-title">${escapeHtml(title)}</div>`
  for (const row of rows) {
    html += `<div class="ev-chart3d__tooltip-item">`
      + `<span class="ev-chart3d__tooltip-dot" style="background:${escapeHtml(row.color || '#888')}"></span>`
      + `<span class="ev-chart3d__tooltip-name">${escapeHtml(row.name)}</span>`
      + `<span class="ev-chart3d__tooltip-value">${escapeHtml(row.value)}</span>`
      + `</div>`
  }
  return html
}

function positionTooltip(cx, cy) {
  const container = containerRef.value
  if (!container) return
  const rect = container.getBoundingClientRect()
  const tip = tooltipRef.value
  const tipW = tip ? tip.offsetWidth : 120
  const tipH = tip ? tip.offsetHeight : 40
  const gap = 12
  let x = cx + gap
  let y = cy - tipH - gap
  if (x + tipW > rect.width - 4) x = cx - tipW - gap
  if (x < 4) x = 4
  if (y < 4) y = cy + gap
  if (y + tipH > rect.height - 4 && y - tipH - gap * 2 >= 4) y = rect.height - tipH - 4
  tooltipX.value = x
  tooltipY.value = y
  tooltipPlacement.value = 'top'
}

const tooltipStyle = computed(() => ({ left: `${tooltipX.value}px`, top: `${tooltipY.value}px` }))

function setHover(key, hit, cx, cy) {
  const changed = key !== hoverKey.value
  if (!hit && hoverKey.value) {
    hoverKey.value = null
    tooltipVisible.value = false
    ariaLiveText.value = ''
    emit('unhover')
    render()
    return
  }
  if (!hit) return
  hoverKey.value = key
  if (changed) {
    ariaLiveText.value = describeHit(hit.meta)
    emit('hover', { ...hit.meta, x: cx, y: cy })
  }
  updateTooltip(hit, cx, cy)
  if (changed) render()
}

function describeHit(meta) {
  const rows = buildTooltipRows(meta)
  return `${meta.name || meta.seriesName}，${rows.map((r) => `${r.name} ${r.value}`).join('，')}`
}

// ── 指针交互 ──
function handlePointerDown(evt) {
  if (isEmpty.value || internalError.value) return
  pointers.set(evt.pointerId, { x: evt.clientX, y: evt.clientY })
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()]
    pinchDist = Math.hypot(a.x - b.x, a.y - b.y)
    dragState = null
    return
  }
  const p = canvasPoint(evt)
  if (!p) return
  stopAutoRotate()
  try {
    canvasRef.value.setPointerCapture(evt.pointerId)
  } catch {
    /* 老环境无指针捕获，降级为普通拖拽 */
  }
  dragState = {
    id: evt.pointerId,
    x: p.x,
    y: p.y,
    moved: false,
    pan: !!evt.shiftKey || props.options.interaction?.pan === true,
  }
}

function handlePointerMove(evt) {
  if (isEmpty.value || internalError.value) return
  if (pointers.has(evt.pointerId)) pointers.set(evt.pointerId, { x: evt.clientX, y: evt.clientY })

  // 双指捏合缩放
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()]
    const dist = Math.hypot(a.x - b.x, a.y - b.y)
    if (pinchDist > 0 && dist > 0 && cameraState.value) {
      userTouchedCamera = true
      applyCamera(zoomBy(cameraState.value, pinchDist / dist), { emitEvent: false })
    }
    pinchDist = dist
    return
  }

  const p = canvasPoint(evt)
  if (!p) return

  if (dragState && dragState.id === evt.pointerId) {
    const dx = p.x - dragState.x
    const dy = p.y - dragState.y
    if (Math.abs(dx) + Math.abs(dy) > 0) {
      dragState.moved = true
      dragState.x = p.x
      dragState.y = p.y
      userTouchedCamera = true
      const viewport = lastResult.value ? lastResult.value.viewport : null
      const next = dragState.pan && viewport
        ? panBy(cameraState.value, dx, dy, viewport)
        : orbitBy(cameraState.value, dx, dy, viewport)
      applyCamera(next, { emitEvent: false })
    }
    tooltipVisible.value = false
    return
  }

  // 非拖拽：拾取
  const result = lastResult.value
  if (!result) return
  const legendHit = hitLegend(result.legend, p.x, p.y)
  if (legendHit) {
    canvasRef.value.style.cursor = 'pointer'
    setHover(null, null)
    return
  }
  const hit = result.pickAt(p.x, p.y)
  canvasRef.value.style.cursor = hit ? 'pointer' : 'grab'
  setHover(hit ? hit.meta.key : null, hit, p.x, p.y)
}

function handlePointerUp(evt) {
  pointers.delete(evt.pointerId)
  if (pointers.size < 2) pinchDist = 0
  const wasDrag = dragState && dragState.id === evt.pointerId
  const hadMoved = wasDrag && dragState.moved
  dragState = null

  // 拖拽过程中抑制 camera-change（避免事件风暴），结束时补发一次终态
  if (wasDrag && hadMoved && cameraState.value) {
    emit('camera-change', cameraPayload(cameraState.value))
  }

  if (wasDrag && !hadMoved) {
    // 视为点选：命中数据则派发 click，命中图例则切换显隐
    const p = canvasPoint(evt)
    if (p) handleClickAt(p)
  }
  ensureAutoRotate()
}

function handleClickAt(p) {
  const result = lastResult.value
  if (!result) return
  const legendHit = hitLegend(result.legend, p.x, p.y)
  if (legendHit) {
    toggleSeries(legendHit.name)
    emit('legend-click', legendHit.name, hiddenSeries.value.has(legendHit.name))
    render()
    return
  }
  const hit = result.pickAt(p.x, p.y)
  if (hit) {
    emit('click', { ...hit.meta, x: p.x, y: p.y })
    hoverKey.value = hit.meta.key
    render()
  }
}

function handleDblClick(evt) {
  const interaction = props.options.interaction && typeof props.options.interaction === 'object' ? props.options.interaction : {}
  if (interaction.resetOnDblClick === false) return
  evt.preventDefault()
  resetCamera()
}

function handlePointerLeave() {
  pointers.clear()
  pinchDist = 0
  dragState = null
  setHover(null, null)
  tooltipVisible.value = false
  ensureAutoRotate()
}

function handleWheel(evt) {
  const interaction = props.options.interaction && typeof props.options.interaction === 'object' ? props.options.interaction : {}
  if (interaction.zoom === false) return
  evt.preventDefault()
  if (!cameraState.value) return
  userTouchedCamera = true
  applyCamera(zoomBy(cameraState.value, wheelZoomFactor(evt.deltaY)), { emitEvent: false })
}

// ── 键盘 ──
function handleKeydown(evt) {
  if (isEmpty.value || internalError.value) return
  const cam = cameraState.value
  if (!cam) return
  const step = 8
  let handled = true
  switch (evt.key) {
    case 'ArrowLeft': userTouchedCamera = true; applyCamera({ ...cam, yaw: cam.yaw - step }); break
    case 'ArrowRight': userTouchedCamera = true; applyCamera({ ...cam, yaw: cam.yaw + step }); break
    case 'ArrowUp': userTouchedCamera = true; applyCamera({ ...cam, pitch: cam.pitch + step * 0.7 }); break
    case 'ArrowDown': userTouchedCamera = true; applyCamera({ ...cam, pitch: cam.pitch - step * 0.7 }); break
    case '+': case '=': userTouchedCamera = true; applyCamera(zoomBy(cam, 0.88)); break
    case '-': case '_': userTouchedCamera = true; applyCamera(zoomBy(cam, 1.14)); break
    case 'Home': resetCamera(); break
    case 'Escape': setHover(null, null); tooltipVisible.value = false; break
    case 'Enter': case ' ': {
      const hit = hoverKey.value && lastResult.value
        ? lastResult.value.projected.items.find((i) => i.meta && i.meta.key === hoverKey.value)
        : null
      if (hit) emit('click', { ...hit.meta })
      break
    }
    default: handled = false
  }
  if (handled) evt.preventDefault()
}

function handleFocusOut() {
  setHover(null, null)
  tooltipVisible.value = false
}

// ── 主题 / 尺寸监听 ──
let resizeObserver = null
let themeObserver = null

function handleThemeChange() {
  render()
}

function setupWatchers() {
  if (props.responsive && typeof ResizeObserver !== 'undefined' && containerRef.value) {
    resizeObserver = new ResizeObserver(() => scheduleRender(16))
    resizeObserver.observe(containerRef.value)
  }
  if (typeof MutationObserver !== 'undefined' && document.documentElement) {
    let lastDark = document.documentElement.classList.contains('dark')
    themeObserver = new MutationObserver(() => {
      const nowDark = document.documentElement.classList.contains('dark')
      if (nowDark !== lastDark) {
        lastDark = nowDark
        handleThemeChange()
      }
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  }
  document.addEventListener('ev-theme-change', handleThemeChange)
  const wheelTarget = canvasRef.value
  if (wheelTarget) wheelTarget.addEventListener('wheel', handleWheel, { passive: false })
}

function teardownWatchers() {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (themeObserver) {
    themeObserver.disconnect()
    themeObserver = null
  }
  document.removeEventListener('ev-theme-change', handleThemeChange)
  const wheelTarget = canvasRef.value
  if (wheelTarget) wheelTarget.removeEventListener('wheel', handleWheel)
}

// ── dev 校验（有警告才打印，生产零噪音）──
let validatedOptionsRef = null
function runValidation() {
  if (validatedOptionsRef === props.options) return
  validatedOptionsRef = props.options
  const { ok, warnings } = validateOptions3d(props.options)
  if (ok || typeof console === 'undefined') return
  const seen = new Set()
  for (const w of warnings) {
    const sig = `${w.path}:${w.message}`
    if (seen.has(sig) || seen.size >= 8) break
    seen.add(sig)
    console.warn(`[EvChart3d] ${w.path}: ${w.message}`)
  }
}

// ── 生命周期 ──
onMounted(() => {
  runValidation()
  cameraState.value = currentCamera()
  setupWatchers()
  nextTick(() => {
    render()
    startEnterAnimation()
  })
})

onBeforeUnmount(destroy)

// ── 对外响应 ──
watch(() => props.options, () => {
  runValidation()
  internalError.value = ''
  cameraState.value = currentCamera()
  if (cameraState.value.autoRotate) ensureAutoRotate()
  userTouchedCamera = false
  hoverKey.value = null
  emit('data-update', { from: 'options', to: 'options' })
  scheduleRender(16)
  startEnterAnimation()
}, { deep: true })

watch(() => props.options.camera, () => {
  cameraState.value = currentCamera()
  // autoRotate 可经由 options 配置开启，必须在这里接上旋转循环
  if (cameraState.value.autoRotate) ensureAutoRotate()
  else stopAutoRotate()
  render()
}, { deep: true })

watch(() => [props.width, props.height], () => {
  nextTick(() => scheduleRender(0))
})

// ── 对外 API ──
function toggleSeries(name) {
  const next = new Set(hiddenSeries.value)
  if (next.has(name)) next.delete(name)
  else next.add(name)
  hiddenSeries.value = next
  render()
}

function destroy() {
  stopAutoRotate()
  if (animRafId) {
    cancelAnimationFrame(animRafId)
    animRafId = 0
  }
  animState = null
  if (renderTimer) {
    clearTimeout(renderTimer)
    renderTimer = null
  }
  teardownWatchers()
  lastResult.value = null
}

function exportSVG(options = {}) {
  const canvas = document.createElement('canvas')
  const size = sizeCanvas()
  const w = size ? size.cssW : 600
  const h = size ? size.cssH : 400
  canvas.width = w
  canvas.height = h
  const result = render3d(canvas, {
    options: props.options,
    dpr: 1,
    progress: 1,
    camera: cameraState.value || currentCamera(),
    hiddenSeries: hiddenSeries.value,
    hoverKey: null,
    theme: currentTheme(),
    autoFit: !userTouchedCamera,
    ctx: options.ctx,
  })
  if (options.ctx && typeof options.toSvg === 'function') {
    return options.toSvg(w, h, options.backgroundColor || '#ffffff')
  }
  void result
  return null
}

defineExpose({
  refresh: () => render(),
  update(newOptions) {
    if (newOptions && typeof newOptions === 'object') {
      for (const key of Object.keys(props.options)) delete props.options[key]
      Object.assign(props.options, newOptions)
    }
    internalError.value = ''
    cameraState.value = currentCamera()
    emit('data-update', { from: 'update', to: 'options' })
    scheduleRender(0)
    startEnterAnimation()
  },
  toDataURL(type = 'image/png', quality = 1) {
    const canvas = canvasRef.value
    if (!canvas) return null
    try {
      return canvas.toDataURL(type, quality)
    } catch {
      return null
    }
  },
  destroy,
  getCanvas: () => canvasRef.value,
  resize: () => {
    render()
  },
  getCamera: () => (cameraState.value ? cameraPayload(cameraState.value) : null),
  setCamera(next) {
    userTouchedCamera = true
    applyCamera(resolveCamera({ ...currentCamera(), ...(next || {}) }))
  },
  resetCamera,
  toggleSeries,
  getHiddenSeries: () => new Set(hiddenSeries.value),
  getProjected: () => lastResult.value,
  exportSVG,
})

// 供测试与调试：非响应式访问内部实例
const instance = getCurrentInstance()
if (instance) instance.appContext.config.globalProperties.$evChart3dVersion = '0.1.0'
void DEFAULT_CAMERA
</script>

<style scoped>
.ev-chart3d {
  --ev-chart3d-surface: var(--ev-bg-color-overlay, #ffffff);
  --ev-chart3d-text: var(--ev-text-color-primary, #1f2937);
  --ev-chart3d-text-secondary: var(--ev-text-color-secondary, #6b7280);
  --ev-chart3d-border: var(--ev-border-color, rgba(31, 41, 55, 0.16));
  --ev-chart3d-fill: var(--ev-fill-color-light, rgba(31, 41, 55, 0.05));
  position: relative;
  overflow: hidden;
  font-family: var(--ev-font-family, 'Helvetica Neue', Helvetica, 'PingFang SC', 'Microsoft YaHei', sans-serif);
}

.ev-chart3d__canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
  cursor: grab;
}

.ev-chart3d__canvas:active {
  cursor: grabbing;
}

.ev-chart3d__overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.ev-chart3d__empty,
.ev-chart3d__loading,
.ev-chart3d__error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.ev-chart3d__empty-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ev-chart3d-fill);
  color: var(--ev-chart3d-text-secondary);
}

.ev-chart3d__empty-img {
  width: 26px;
  height: 26px;
}

.ev-chart3d__empty-text {
  font-size: 12px;
  color: var(--ev-chart3d-text-secondary);
}

.ev-chart3d__loading-bars {
  display: flex;
  align-items: flex-end;
  gap: 5px;
  height: 34px;
}

.ev-chart3d__loading-bar {
  width: 6px;
  border-radius: 3px;
  background: var(--ev-chart3d-border);
  animation: ev-chart3d-shimmer 1.1s ease-in-out infinite;
}

.ev-chart3d__error {
  color: var(--ev-color-danger, #dc2626);
  font-size: 12px;
}

.ev-chart3d__error-icon {
  font-size: 22px;
  display: inline-flex;
}

.ev-chart3d__tooltip {
  position: absolute;
  z-index: 20;
  max-width: 260px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--ev-chart3d-surface);
  border: 1px solid var(--ev-chart3d-border);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  pointer-events: none;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ev-chart3d-text);
}

.ev-chart3d__tooltip-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.ev-chart3d__tooltip-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ev-chart3d__tooltip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: none;
}

.ev-chart3d__tooltip-name {
  color: var(--ev-chart3d-text-secondary);
  margin-right: auto;
}

.ev-chart3d__tooltip-value {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.ev-chart3d__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.ev-chart3d-fade-enter-active,
.ev-chart3d-fade-leave-active {
  transition: opacity 0.24s ease;
}

.ev-chart3d-fade-enter-from,
.ev-chart3d-fade-leave-to {
  opacity: 0;
}

.ev-chart3d-tooltip-enter-active,
.ev-chart3d-tooltip-leave-active {
  transition: opacity 0.16s ease;
}

.ev-chart3d-tooltip-enter-from,
.ev-chart3d-tooltip-leave-to {
  opacity: 0;
}

@keyframes ev-chart3d-shimmer {
  0%, 100% { height: 10px; opacity: 0.55; }
  50% { height: 30px; opacity: 1; }
}
</style>

<style>
/* 暗色覆盖（与生态一致：html.dark 为准） */
html.dark .ev-chart3d__tooltip {
  background: var(--ev-bg-color-overlay, #1f2937);
  border-color: var(--ev-border-color, rgba(229, 231, 235, 0.2));
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  color: var(--ev-text-color-primary, #e5e7eb);
}

html.dark .ev-chart3d {
  --ev-chart3d-surface: var(--ev-bg-color-overlay, #1f2937);
  --ev-chart3d-text: var(--ev-text-color-primary, #e5e7eb);
  --ev-chart3d-text-secondary: var(--ev-text-color-secondary, #9ca3af);
  --ev-chart3d-border: var(--ev-border-color, rgba(229, 231, 235, 0.2));
  --ev-chart3d-fill: var(--ev-fill-color-dark, rgba(229, 231, 235, 0.08));
}
</style>
