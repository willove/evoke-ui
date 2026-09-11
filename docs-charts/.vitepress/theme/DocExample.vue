<template>
  <DemoBlock :code="code">
    <slot />
  </DemoBlock>
</template>

<script setup>
/**
 * 示例工程预览容器 — 包装 DemoBlock 并显式传入源码字符串。
 * 走独立组件而不是在 markdown 里直接写 <DemoBlock :code="...">，
 * 是为了绕开 demo-source 插件（它只认 <DemoBlock> 开标签，会重复注入 code）。
 * 用法：<DocExample :code="pageSource"><SomeExamplePage /></DocExample>
 */
import DemoBlock from './DemoBlock.vue'

defineProps({
  code: { type: String, default: '' },
})
</script>
