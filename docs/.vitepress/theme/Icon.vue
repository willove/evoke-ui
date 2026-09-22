<template>
  <eb-icon :name="mapped" :size="size" class="bd-icon" />
</template>

<script setup>
/**
 * 文档站图标 — 只做「站点语义名 → 组件库图标名」的转发，不再自绘 SVG。
 *
 * 形状全部来自组件库内置的 Remix Icon 集（`@wil-works/evoke-business-ui` 的 EbIcon
 * 解析内置注册表，形状由 scripts/generate-remix-icons.mjs 从 Remix Icon v4.9.1 生成）。
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
  smartphone: 'phone', // Remix smartphone-line
  back: 'arrow-left',
  layers: 'dashboard', // 示例中心入口：库内用 dashboard 表示「多面板集合」
  copy: 'copy',
  check: 'check',
}

const mapped = computed(() => MAP[props.name] || props.name)
</script>
