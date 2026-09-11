<template>
  <div
    class="eb-timeline"
    :class="[`is-mode-${mode}`, { 'is-reverse': reverse }, `is-variant-${variant}`]"
    role="list"
  >
    <eb-timeline-item
      v-if="hasPending"
      :loading="true"
      :color="variant === 'filled' ? 'blue' : undefined"
      :variant="variant"
      :is-pending="true"
      :index="itemsCount"
    >
      <template v-if="pendingDot" #dot><component :is="pendingDot" /></template>
      <template v-if="typeof pending === 'string'">{{ pending }}</template>
      <template v-else>加载中...</template>
    </eb-timeline-item>
    <slot />
  </div>
</template>

<script setup>
/**
 * EbTimeline — 时间轴容器
 * mode: left/right/alternate；pending 幽灵节点；variant 节点变体。
 * 竖线为容器 ::before 一条贯穿伪元素，dot 浮于线上（不断裂）。
 */
import { computed, provide, ref, watch, useSlots, Fragment, Comment, Text } from 'vue'
import EbTimelineItem from './item.vue'

// 挂载顺序登记：供 item 在未传 index 时推算 alternate 奇偶
const uids = []
provide('evTimelineRegistry', {
  register(uid) {
    uids.push(uid)
    return uids.length - 1
  },
  unregister(uid) {
    const i = uids.indexOf(uid)
    if (i !== -1) uids.splice(i, 1)
  },
})

const props = defineProps({
  mode: {
    type: String,
    default: 'left',
    validator: (v) => ['left', 'right', 'alternate'].includes(v),
  },
  reverse: { type: Boolean, default: false },
  pending: { type: [Boolean, String], default: false },
  pendingDot: { type: [Object, String], default: undefined },
  variant: {
    type: String,
    default: 'outlined',
    validator: (v) => ['outlined', 'filled'].includes(v),
  },
})

const slots = useSlots()

// 真实节点数量（供 item 计算 alternate 模式奇偶判断）
const itemsCount = ref(0)

function countItems() {
  let count = 0
  const walk = (nodes) => {
    for (const child of nodes ?? []) {
      if (!child || child.type === Comment) continue
      if (child.type === Text && typeof child.children === 'string' && child.children.trim() === '') continue
      if (child.type === Fragment) {
        walk(child.children)
        continue
      }
      count++
    }
  }
  walk(slots.default?.())
  return count
}

watch(
  () => slots.default?.(),
  () => {
    itemsCount.value = countItems()
  },
  { immediate: true, deep: true },
)

const hasPending = computed(() => !!props.pending)

provide('evTimeline', {
  mode: computed(() => props.mode),
  variant: computed(() => props.variant),
  itemsCount,
  hasPending,
})
</script>

<style src="./style.css"></style>
