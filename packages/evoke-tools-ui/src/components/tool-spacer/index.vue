<template>
  <div class="et-toolspacer" :class="`et-toolspacer--${direction}`" aria-hidden="true" />
</template>

<script setup>
/**
 * EtToolSpacer — 工具区弹性占位（tools-ui 计划 05 §四，M0 原子件）
 *
 * 把后续组推到行尾（对齐 Office 功能区右侧留白的形态）；可访问性上无意义，
 * 对读屏隐藏。
 */
defineOptions({ name: 'EtToolSpacer' })

defineProps({
  direction: {
    type: String,
    default: 'horizontal',
    validator: (v) => ['horizontal', 'vertical'].includes(v),
  },
})
</script>

<style src="./style.css"></style>
