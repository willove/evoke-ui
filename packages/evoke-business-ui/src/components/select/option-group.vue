<template>
  <li class="ev-select-group ev-select-group">
    <div class="ev-select-group__title">{{ label }}</div>
    <ul class="ev-select-group__list">
      <slot />
    </ul>
  </li>
</template>

<script setup>
/**
 * EvOptionGroup — 选项分组
 */
defineOptions({ name: 'EvOptionGroup' })

defineProps({
  label: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})
</script>

<style src="./group.css"></style>
