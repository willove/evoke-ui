<template>
  <div class="eb-cell-stack">
    <div class="eb-cell-stack__main">
      <slot name="main">{{ main }}</slot>
    </div>
    <div v-if="sub || $slots.sub" class="eb-cell-stack__sub">
      <slot name="sub">{{ sub }}</slot>
    </div>
  </div>
</template>

<script setup>
/**
 * EbCellStack — 双行单元格（业务封装，表格内使用）
 * 主行加粗 + 副行浅灰省略；sub 为空且无插槽时只渲染主行
 */
defineProps({
  main: { type: [String, Number], default: '' },
  sub: { type: [String, Number], default: '' },
})
</script>

<style src="./style.css"></style>
