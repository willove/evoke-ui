<template>
  <div class="ev-cell-stack">
    <div class="ev-cell-stack__main">
      <slot name="main">{{ main }}</slot>
    </div>
    <div v-if="sub || $slots.sub" class="ev-cell-stack__sub">
      <slot name="sub">{{ sub }}</slot>
    </div>
  </div>
</template>

<script setup>
/**
 * EvCellStack — 双行单元格（业务封装，表格内使用）
 * 主行加粗 + 副行浅灰省略；sub 为空且无插槽时只渲染主行
 */
defineProps({
  main: { type: [String, Number], default: '' },
  sub: { type: [String, Number], default: '' },
})
</script>

<style src="./style.css"></style>
