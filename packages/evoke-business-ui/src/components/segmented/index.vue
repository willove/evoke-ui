<template>
  <div
    ref="rootRef"
    class="eb-segmented"
    :class="[
      `eb-segmented--${size}`,
      `eb-segmented--shape-${shape}`,
      {
        'is-vertical': vertical,
        'is-block': block,
        'is-disabled': disabled,
        'is-label-vertical': labelPlacement === 'vertical',
      },
    ]"
    role="tablist"
  >
    <div
      v-if="thumbVisible"
      class="eb-segmented__thumb"
      :class="{ 'is-animating': animating }"
      :style="thumbStyle"
      aria-hidden="true"
    />
    <div class="eb-segmented__items">
      <button
        v-for="(item, i) in normalized"
        :key="item.value ?? i"
        type="button"
        class="eb-segmented__item"
        :class="{ 'is-selected': isSelected(item), 'is-disabled': item.disabled || disabled }"
        role="tab"
        :aria-selected="isSelected(item)"
        :disabled="(item.disabled || disabled) || undefined"
        @click="handleSelect(item)"
      >
        <eb-icon v-if="resolveIcon(item)" :name="resolveIcon(item)" :size="iconSize" />
        <span v-if="item.label !== undefined" class="eb-segmented__label">{{ item.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * EbSegmented — 分段控制器
 * options 支持纯值/对象；滑块 thumb 实测定位 + 过渡动画；
 * size(middle/large/small) / shape(round) / vertical / labelPlacement / block / disabled
 */
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import EbIcon from '../icon/index.vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: undefined },
  options: { type: Array, default: () => [] },
  size: {
    type: String,
    default: 'middle',
    validator: (v) => ['large', 'middle', 'small'].includes(v),
  },
  shape: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'round'].includes(v),
  },
  vertical: { type: Boolean, default: false },
  labelPlacement: {
    type: String,
    default: 'horizontal',
    validator: (v) => ['horizontal', 'vertical'].includes(v),
  },
  disabled: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'change'])

// 非受控内态：不传 v-model 时组件内部自行维护选中值（传了则完全受控）
const innerValue = ref(undefined)
const currentValue = computed(() => (props.modelValue !== undefined ? props.modelValue : innerValue.value))

const rootRef = ref(null)
const thumbLeft = ref(0)
const thumbWidth = ref(0)
const thumbTop = ref(0)
const thumbHeight = ref(0)
const animating = ref(false)

const thumbVisible = computed(() => (props.vertical ? thumbHeight.value > 0 : thumbWidth.value > 0))

const thumbStyle = computed(() => {
  if (props.vertical) {
    return { top: `${thumbTop.value}px`, height: `${thumbHeight.value}px` }
  }
  return { left: `${thumbLeft.value}px`, width: `${thumbWidth.value}px` }
})

const iconSize = computed(() => (props.size === 'large' ? 18 : props.size === 'small' ? 12 : 14))

const normalized = computed(() =>
  props.options.map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { label: String(opt), value: opt }
    }
    return { label: opt.label, value: opt.value, icon: opt.icon, disabled: opt.disabled }
  }),
)

function isSelected(item) {
  return currentValue.value !== undefined && item.value === currentValue.value
}

function resolveIcon(item) {
  const icon = item.icon
  if (!icon) return ''
  return typeof icon === 'string' ? icon : ''
}

function handleSelect(item) {
  if (item.disabled || props.disabled) return
  if (item.value === currentValue.value) return
  innerValue.value = item.value
  emit('update:modelValue', item.value)
  emit('change', item.value)
}

// ─── thumb 定位：实测选中项几何 ───
function updateThumb() {
  const root = rootRef.value
  if (!root) return
  const items = root.querySelectorAll('.eb-segmented__item')
  const idx = normalized.value.findIndex((it) => isSelected(it))
  const el = idx >= 0 ? items[idx] : null
  animating.value = false
  if (!el) {
    thumbWidth.value = 0
    thumbHeight.value = 0
    return
  }
  if (props.vertical) {
    thumbTop.value = el.offsetTop
    thumbHeight.value = el.offsetHeight
  } else {
    thumbLeft.value = el.offsetLeft
    thumbWidth.value = el.offsetWidth
  }
}

// 选中变化时先量测目标位置再开启过渡
watch(
  () => currentValue.value,
  () => {
    const root = rootRef.value
    const idx = normalized.value.findIndex((it) => isSelected(it))
    const el = idx >= 0 && root ? root.querySelectorAll('.eb-segmented__item')[idx] : null
    if (!el) {
      updateThumb()
      return
    }
    animating.value = true
    if (props.vertical) {
      thumbTop.value = el.offsetTop
      thumbHeight.value = el.offsetHeight
    } else {
      thumbLeft.value = el.offsetLeft
      thumbWidth.value = el.offsetWidth
    }
  },
)

let resizeObserver = null
onMounted(() => {
  nextTick(updateThumb)
  if (rootRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => updateThumb())
    resizeObserver.observe(rootRef.value)
  }
})
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

defineExpose({ updateThumb })
</script>

<style src="./style.css"></style>
