<template>
  <div class="eb-color-dropdown eb-color-dropdown" :class="{ 'is-disabled': disabled }">
    <div class="eb-color-dropdown__main-wrapper">
      <!-- 饱和度/明度面板 -->
      <div
        ref="svRef"
        class="eb-color-svpanel"
        :style="{ background: hueColor }"
        @mousedown="startSvDrag"
      >
        <div class="eb-color-svpanel__white" />
        <div class="eb-color-svpanel__black" />
        <div
          class="eb-color-svpanel__cursor"
          :style="{ left: `${sv.s * 100}%`, top: `${(1 - sv.v) * 100}%` }"
        />
      </div>

      <!-- 色相条 -->
      <div
        ref="hueRef"
        class="eb-color-hue-slider"
        @mousedown="startBarDrag(hueRef, (rect, e) => ({ h: ((e.clientX - rect.left) / rect.width) * 360, s: sv.s > 0 ? sv.s : 1, v: sv.v }), true)"
      >
        <div class="eb-color-hue-slider__bar" />
        <div class="eb-color-hue-slider__thumb" :style="{ left: `${(sv.h / 360) * 100}%` }" />
      </div>

      <!-- 透明度条 -->
      <div
        v-if="showAlpha"
        ref="alphaRef"
        class="eb-color-alpha-slider"
        @mousedown="startBarDrag(alphaRef, (rect, e) => ({ ...sv, a: clampAlpha(e.clientX - rect.left, rect.width) }), false)"
      >
        <div class="eb-color-alpha-slider__bar" :style="{ background: alphaGradient }" />
        <div class="eb-color-alpha-slider__thumb" :style="{ left: `${alpha * 100}%` }" />
      </div>
    </div>

    <!-- 预设色 -->
    <div v-if="predefine?.length" class="eb-color-predefine">
      <div class="eb-color-predefine__colors">
        <button
          v-for="(color, i) in predefine"
          :key="i"
          type="button"
          class="eb-color-predefine__color-selector"
          :style="{ background: color }"
          :aria-label="`预设色 ${color}`"
          @click="selectPredefine(color)"
        />
      </div>
    </div>

    <!-- 底部：当前值输入 + 确定 -->
    <div class="eb-color-dropdown__btns">
      <span class="eb-color-dropdown__value">
        <input
          :value="displayValue"
          class="eb-color-dropdown__value-input"
          spellcheck="false"
          @change="handleInput"
          @keydown.enter="handleInput"
        >
      </span>
      <button type="button" class="eb-color-dropdown__link-btn" @click="confirm">确定</button>
    </div>
  </div>
</template>

<script setup>
/**
 * EbColorPickerPanel — 取色面板
 * HSV 内部表示；SV 面板/色相条/透明度条均为拖拽控制；确认提交或拖拽结束实时提交
 */
import { ref, reactive, computed, watch, onBeforeUnmount } from 'vue'
import { parseColor, formatColor, hsvToRgb, emptyColor, toCssColor } from './colorUtils'

const props = defineProps({
  modelValue: { type: String, default: '' },
  showAlpha: { type: Boolean, default: false },
  colorFormat: { type: String, default: '' },
  predefine: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'change', 'active-change'])

const svRef = ref(null)
const hueRef = ref(null)
const alphaRef = ref(null)

const sv = reactive(emptyColor())

watch(
  () => props.modelValue,
  (val) => {
    const parsed = parseColor(val)
    // 空值 → 白色；非法值保持现状
    if (parsed) Object.assign(sv, parsed)
    else if (!val) Object.assign(sv, emptyColor())
  },
  { immediate: true },
)

const alpha = computed(() => sv.a ?? 1)

const effectiveFormat = computed(() => {
  if (props.colorFormat) return props.colorFormat
  return props.showAlpha ? 'rgba' : 'hex'
})

const displayValue = computed(() => formatColor(sv, effectiveFormat.value))
const hueColor = computed(() => toCssColor({ h: sv.h, s: 1, v: 1, a: 1 }))
const alphaGradient = computed(() => {
  const { r, g, b } = hsvToRgb(sv.h, sv.s, sv.v)
  return `linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0), rgba(${r}, ${g}, ${b}, 1))`
})

// ─── 提交 ───
function commit() {
  const next = formatColor(sv, effectiveFormat.value)
  emit('update:modelValue', next)
  emit('change', next)
}
function activeCommit() {
  emit('active-change', formatColor(sv, effectiveFormat.value))
}

// ─── SV 面板 ───
function startSvDrag(e) {
  if (props.disabled || e.button !== 0) return
  e.preventDefault()
  moveSv(e)
  const onMove = (ev) => moveSv(ev)
  const onUp = () => {
    commit()
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
  cleanupFns.push(() => window.removeEventListener('mousemove', onMove))
}
function moveSv(e) {
  const rect = svRef.value?.getBoundingClientRect()
  if (!rect) return
  sv.s = Math.min(1, Math.max(0, (e.clientX - rect.left) / (rect.width || 1)))
  sv.v = 1 - Math.min(1, Math.max(0, (e.clientY - rect.top) / (rect.height || 1)))
  activeCommit()
}

// ─── 色相/透明度条 ───
function clampAlpha(delta, width) {
  return Math.round(Math.min(1, Math.max(0, delta / (width || 1))) * 100) / 100
}

const cleanupFns = []
onBeforeUnmount(() => {
  for (const fn of cleanupFns) fn()
})

function startBarDrag(barRef, compute, isHue) {
  return (e) => {
    if (props.disabled || e.button !== 0) return
    e.preventDefault()
    const apply = (ev) => {
      const rect = barRef.value?.getBoundingClientRect()
      if (!rect) return
      Object.assign(sv, compute(rect, ev))
      activeCommit()
    }
    apply(e)
    const onMove = apply
    const onUp = () => {
      commit()
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    cleanupFns.push(() => window.removeEventListener('mousemove', onMove))
  }
}

// ─── 预设/输入 ───
function selectPredefine(color) {
  const parsed = parseColor(color)
  if (!parsed || props.disabled) return
  Object.assign(sv, parsed)
  commit()
}

function handleInput(e) {
  if (props.disabled) return
  const parsed = parseColor(e.target.value)
  if (!parsed) {
    e.target.value = displayValue.value // 回显当前合法值
    return
  }
  Object.assign(sv, parsed)
  commit()
}

function confirm() {
  if (props.disabled) return
  commit()
}
</script>

<style src="./panel.css"></style>
