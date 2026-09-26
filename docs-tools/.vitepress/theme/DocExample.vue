<template>
  <DemoBlock :code="code">
    <slot />
  </DemoBlock>
</template>

<script setup>
/**
 * 示例工程预览容器 — 与 charts 站同口径：走独立组件包装 DemoBlock，
 * 绕开 demo-source 插件（它只认 <DemoBlock> 开标签，会重复注入 code）。
 */
import DemoBlock from './DemoBlock.vue'

defineProps({
  code: { type: String, default: '' },
})
</script>
