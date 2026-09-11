<template>
  <li
    class="eb-timeline-item"
    :class="[
      `is-mode-${mode}`,
      `is-placement-${itemPlacement}`,
      `is-variant-${finalVariant}`,
      {
        'is-loading': loading,
        'is-pending': isPending,
        'has-label': !!label,
        'has-timestamp-aside-start': isTimestampAside && timestampSide === 'start',
        'has-timestamp-aside-end': isTimestampAside && timestampSide === 'end',
        'has-timestamp-top': timestamp && placement === 'top',
        'has-timestamp-bottom': timestamp && placement === 'bottom',
      }
    ]"
    :style="{
      '--dot-size': dotSize + 'px',
      '--dot-color': resolvedColor,
      '--dot-border-width': finalVariant === 'outlined' ? '2px' : '0px',
    }"
    role="listitem"
  >
    <div
      v-if="(label && itemPlacement === 'end') || (isTimestampAside && timestampSide === 'start')"
      class="eb-timeline-item__aside eb-timeline-item__aside--left"
    >
      <slot v-if="label && itemPlacement === 'end'" name="label">{{ label }}</slot>
      <div v-if="isTimestampAside && timestampSide === 'start'" class="eb-timeline-item__timestamp is-aside">
        {{ timestamp }}
      </div>
    </div>

    <div class="eb-timeline-item__content">
      <div v-if="timestamp && placement === 'top'" class="eb-timeline-item__timestamp is-top">{{ timestamp }}</div>
      <div class="eb-timeline-item__body">
        <slot />
      </div>
      <div v-if="timestamp && placement === 'bottom'" class="eb-timeline-item__timestamp is-bottom">{{ timestamp }}</div>
    </div>

    <div class="eb-timeline-item__axis">
      <div class="eb-timeline-item__dot" :class="{ 'has-custom': hasDotSlot }">
        <slot name="dot">
          <eb-icon v-if="icon" :name="typeof icon === 'string' ? icon : 'more-filled'" :size="10" />
        </slot>
      </div>
    </div>

    <div
      v-if="(label && itemPlacement === 'start') || (isTimestampAside && timestampSide === 'end')"
      class="eb-timeline-item__aside eb-timeline-item__aside--right"
    >
      <slot v-if="label && itemPlacement === 'start'" name="label">{{ label }}</slot>
      <div v-if="isTimestampAside && timestampSide === 'end'" class="eb-timeline-item__timestamp is-aside">
        {{ timestamp }}
      </div>
    </div>
  </li>
</template>

<script setup>
/**
 * EbTimelineItem — 时间轴节点
 * label（轴对侧标签）/ placement 扩展 + timestamp / type / color / hollow / size；
 * 竖线由父容器 ::before 绘制，item 只画 dot。
 */
import { computed, inject, useSlots, ref, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'
import EbIcon from '../icon/index.vue'

const props = defineProps({
  label: { type: String, default: undefined },
  timestamp: { type: String, default: undefined },
  placement: {
    type: String,
    default: 'bottom',
    validator: (v) => ['top', 'bottom', 'start', 'end'].includes(v),
  },
  type: {
    type: String,
    default: undefined,
    validator: (v) => [undefined, 'primary', 'success', 'warning', 'danger', 'info'].includes(v),
  },
  color: { type: String, default: undefined },
  hollow: { type: Boolean, default: false },
  variant: {
    type: String,
    default: undefined,
    validator: (v) => [undefined, 'outlined', 'filled'].includes(v),
  },
  size: {
    type: String,
    default: 'normal',
    validator: (v) => ['normal', 'large'].includes(v),
  },
  icon: { type: [String, Object], default: undefined },
  loading: { type: Boolean, default: false },
  position: {
    type: String,
    default: undefined,
    validator: (v) => [undefined, 'start', 'end'].includes(v),
  },
  isPending: { type: Boolean, default: false },
  index: { type: Number, default: 0 },
})

const slots = useSlots()

const ctx = inject('evTimeline', null)
const mode = computed(() => ctx?.mode?.value ?? 'left')
const parentVariant = computed(() => ctx?.variant?.value ?? 'outlined')

const finalVariant = computed(() => props.variant ?? (props.hollow ? 'outlined' : parentVariant.value))

// 颜色解析：语义色 → token（主题/暗色自动适配）
const colorMap = {
  blue: 'var(--eb-color-primary)',
  primary: 'var(--eb-color-primary)',
  green: 'var(--eb-color-success)',
  success: 'var(--eb-color-success)',
  red: 'var(--eb-color-danger)',
  danger: 'var(--eb-color-danger)',
  gray: 'var(--eb-color-info)',
  info: 'var(--eb-color-info)',
  warning: 'var(--eb-color-warning)',
}
const isSemanticColor = (c) => c in colorMap
const resolvedColor = computed(() => {
  if (props.loading) return colorMap.gray
  if (!props.color) {
    if (props.type) return colorMap[props.type] || colorMap.blue
    return colorMap.blue
  }
  return isSemanticColor(props.color) ? colorMap[props.color] : props.color
})

const itemPlacement = computed(() => {
  if (props.position) return props.position
  if (mode.value !== 'alternate') return mode.value === 'right' ? 'end' : 'start'
  return myIndex.value % 2 === 0 ? 'start' : 'end'
})

// 节点序号：显式 index 优先，否则按挂载顺序推算（alternate 奇偶用）
const registry = inject('evTimelineRegistry', null)
const registeredIndex = ref(0)
const instance = getCurrentInstance()
onMounted(() => {
  registeredIndex.value = registry ? registry.register(instance.uid) : 0
})
onBeforeUnmount(() => {
  registry?.unregister(instance.uid)
})
const myIndex = computed(() => (props.index !== 0 ? props.index : registeredIndex.value))

const dotSize = computed(() => (props.size === 'large' ? 14 : 10))
const hasDotSlot = computed(() => !!slots.dot || !!props.icon)

const isTimestampAside = computed(() => props.placement === 'start' || props.placement === 'end')
const timestampSide = computed(() => {
  if (props.placement === 'start') return 'start'
  if (props.placement === 'end') return 'end'
  return null
})
</script>

<style src="./style.css"></style>
