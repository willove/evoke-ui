<template>
  <li class="ev-menu-item-group ev-menu-item-group">
    <div class="ev-menu-item-group__title">
      <slot name="title">{{ title }}</slot>
    </div>
    <ul class="ev-menu-item-group__list">
      <slot />
    </ul>
  </li>
</template>

<script setup>
/**
 * EvMenuItemGroup — 菜单分组
 */
defineProps({
  title: { type: String, default: '' },
})
</script>
