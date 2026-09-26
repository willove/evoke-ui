<template>
  <EtIcon :name="name" :size="size" />
</template>

<script setup>
/**
 * 文档站图标 — 直接转 tools-ui 的 EtIcon（本站的组件库就是它自己）。
 * 站点语义名与库内名不一致时在这里转（当前全部同名，留 MAP 供后续扩展）。
 */
defineProps({
  name: { type: String, required: true },
  size: { type: [String, Number], default: 16 },
})
</script>
