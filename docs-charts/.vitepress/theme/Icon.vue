<template>
  <EvIcon :name="mapped" :size="size" />
</template>

<script setup>
/**
 * 图表文档站图标 — 只做「站点语义名 → 组件库图标名」的转发，不再自绘 SVG。
 *
 * 本站的姊妹库是 @wil-works/evoke-ui，形状取它的 EvIcon 核心集
 * （同样由 scripts/generate-remix-icons.mjs 从 Remix Icon v4.9.1 生成）。
 */
import { computed } from 'vue'
import EvIcon from '../../../packages/evoke-ui/src/components/icon/index.vue'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [String, Number], default: 16 },
})

/** 站点语义名 → 库内图标名；同名可直接省略 */
const MAP = {
  chart: 'line-chart',
  play: 'play-fill', // evoke-ui 核心集只有 play-fill
  globe: 'global',
  monitor: 'desktop',
  copy: 'copy',
}

const mapped = computed(() => MAP[props.name] || props.name)
</script>
