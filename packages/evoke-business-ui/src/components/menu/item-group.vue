<template>
  <li class="eb-menu-item-group eb-menu-item-group">
    <div class="eb-menu-item-group__title">
      <slot name="title">{{ title }}</slot>
    </div>
    <ul class="eb-menu-item-group__list">
      <slot />
    </ul>
  </li>
</template>

<script setup>
/**
 * EbMenuItemGroup — 菜单分组
 */
defineProps({
  title: { type: String, default: '' },
})
</script>
