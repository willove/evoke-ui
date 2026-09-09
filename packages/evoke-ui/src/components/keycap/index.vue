<template>
  <span class="ew-keycap">
    <kbd v-for="(k, i) in keys" :key="i" class="ew-keycap__key">{{ k }}</kbd>
  </span>
</template>

<script setup>
/**
 * EwKeycap — 键盘按键展示（remixdesign「Press c to copy」语言）
 * keys 传字符串（拆成单键）或数组（组合键）
 */
import { computed } from 'vue'

const props = defineProps({
  /** 单键字符串或组合键数组 */
  keys: { type: [String, Array], required: true },
})

const keys = computed(() =>
  Array.isArray(props.keys) ? props.keys : String(props.keys).split('')
)
</script>

<style src="./style.css"></style>
