<template>
  <ev-descriptions
    class="ev-detail-descriptions"
    :column="column"
    :border="border"
    :size="size"
    :title="title"
    :direction="direction"
  >
    <template v-if="$slots.title" #title><slot name="title" /></template>
    <template v-if="$slots.extra" #extra><slot name="extra" /></template>
    <ev-descriptions-item
      v-for="item in items"
      :key="item.prop || item.label"
      :label="item.label"
      :span="item.span"
    >
      <slot v-if="item.slot" :name="item.slot" :item="item" :value="valueOf(item)" />
      <template v-else>{{ formatValue(item) }}</template>
    </ev-descriptions-item>
  </ev-descriptions>
</template>

<script setup>
/**
 * EvDetailDescriptions — 详情描述（业务封装，items 配置式）
 * items = [{ prop, label, span?, slot?, formatter? }]；
 * 值从 data 按 prop 取（支持 'a.b' 路径）；slot 按 item.slot 命名分发；
 * formatter: (value, data) => string
 */
import EvDescriptions from '../descriptions/index.vue'
import EvDescriptionsItem from '../descriptions/item.vue'

const props = defineProps({
  /** 数据源对象 */
  data: { type: Object, default: () => ({}) },
  items: { type: Array, default: () => [] },
  column: { type: Number, default: 3 },
  border: { type: Boolean, default: true },
  size: { type: String, default: 'default' },
  title: { type: String, default: '' },
  direction: {
    type: String,
    default: 'horizontal',
    validator: (v) => ['horizontal', 'vertical'].includes(v),
  },
})

function getByPath(obj, path) {
  return String(path)
    .split('.')
    .reduce((o, k) => (o == null ? undefined : o[k]), obj)
}

function valueOf(item) {
  return getByPath(props.data, item.prop)
}

function formatValue(item) {
  const v = valueOf(item)
  if (item.formatter) return item.formatter(v, props.data)
  return v ?? item.placeholder ?? '-'
}
</script>

<style src="./style.css"></style>
