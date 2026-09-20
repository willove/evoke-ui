<template>
  <ul class="eb-dropdown-menu eb-dropdown-menu" role="menu">
    <slot />
  </ul>
</template>

<script setup>
/**
 * EbDropdownMenu — 下拉菜单容器
 * role=menu：与 menuitem 的键盘 roving focus / Esc 关闭语义配套
 */
defineOptions({ name: 'EbDropdownMenu' })
</script>

<style src="./style.css"></style>
