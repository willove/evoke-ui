<template>
  <li class="eb-select-group eb-select-group">
    <div class="eb-select-group__title">{{ label }}</div>
    <ul class="eb-select-group__list">
      <slot />
    </ul>
  </li>
</template>

<script setup>
/**
 * EbOptionGroup — 选项分组
 */
defineOptions({ name: 'EbOptionGroup' })

defineProps({
  label: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})
</script>

<style src="./group.css"></style>
