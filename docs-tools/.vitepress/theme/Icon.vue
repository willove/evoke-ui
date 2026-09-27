<template>
  <EtIcon :name="mapped" :size="size" class="td-icon" />
</template>

<script setup>
/**
 * 文档站图标 — 站点语义名 → 库内图标名的转发（与 business / charts 两站同机制）。
 *
 * 形状来自 tools-ui 的 EtIcon（解析 business-ui 441 内置 Remix 集，同步命中）；
 * 站点侧只保留一层语义别名，避免模板里到处写库内命名。
 */
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [String, Number], default: 16 },
})

/** 站点语义名 → 库内图标名；同名可直接省略 */
const MAP = {
  'chevron-down': 'arrow-down', // 库内 arrow-down 即 Remix arrow-down-s-line（折角箭头，无竖杆）
  'external-link': 'top-right', // Remix arrow-right-up-line：外链跳转箭头
  chart: 'line-chart',
  monitor: 'computer',
  globe: 'global',
  layers: 'dashboard',
  copy: 'copy',
  check: 'check',
}

const mapped = computed(() => MAP[props.name] || props.name)
</script>