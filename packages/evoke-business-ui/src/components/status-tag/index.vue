<template>
  <eb-tag
    class="eb-status-tag"
    :type="resolved.type"
    :size="size"
    :effect="effect"
    disable-transitions
  >{{ resolved.label }}</eb-tag>
</template>

<script setup>
/**
 * EbStatusTag — 状态标签（业务封装）
 * 语义枚举 → 预设色：statuses = [{ value, label?, type? }]；
 * 未命中回退 fallbackType + 原值文本（可经 slot 自定义）
 */
import { computed } from 'vue'
import EbTag from '../tag/index.vue'

const props = defineProps({
  /** 当前状态值 */
  value: { type: [String, Number], default: '' },
  /** 状态映射表 */
  statuses: { type: Array, default: () => [] },
  /** 未命中时的兜底 type */
  fallbackType: {
    type: String,
    default: 'info',
    validator: (v) => ['primary', 'success', 'warning', 'info', 'danger', 'error'].includes(v),
  },
  size: { type: String, default: 'small' },
  effect: { type: String, default: 'light' },
})

const resolved = computed(() => {
  const hit = props.statuses.find((s) => s.value === props.value)
  if (hit) {
    return { label: hit.label ?? String(props.value), type: hit.type ?? 'info' }
  }
  return { label: String(props.value ?? ''), type: props.fallbackType }
})
</script>

<style src="./style.css"></style>
