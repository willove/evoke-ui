<template>
  <ul
    class="eb-menu eb-menu"
    :class="[`eb-menu--${mode}`, { 'eb-menu--collapse': collapse, 'is-collapsed': collapse }]"
    role="menubar"
  >
    <slot />
  </ul>
</template>

<script setup>
/**
 * EbMenu — 导航菜单容器
 * provide 菜单契约：activeIndex/openedMenus/unique-opened/select（router 模式跳转）；
 * 手柄：EbMenuItem / EbSubMenu / EbMenuItemGroup
 */
import { provide, ref, toRef, watch, inject } from 'vue'

const props = defineProps({
  mode: {
    type: String,
    default: 'vertical',
    validator: (v) => ['horizontal', 'vertical'].includes(v),
  },
  defaultActive: { type: String, default: '' },
  defaultOpeneds: { type: Array, default: () => [] },
  collapse: { type: Boolean, default: false },
  uniqueOpened: { type: Boolean, default: false },
  menuTrigger: {
    type: String,
    default: 'hover',
    validator: (v) => ['hover', 'click'].includes(v),
  },
  router: { type: Boolean, default: false },
})

const emit = defineEmits(['select', 'open', 'close'])

const routerInjection = inject('router', null)

const activeIndex = ref(props.defaultActive)
const openedMenus = ref([...props.defaultOpeneds])

watch(
  () => props.defaultActive,
  (v) => {
    activeIndex.value = v
  },
)

provide('menuContext', {
  mode: toRef(props, 'mode'),
  collapse: toRef(props, 'collapse'),
  menuTrigger: toRef(props, 'menuTrigger'),
  routerMode: toRef(props, 'router'),
  router: routerInjection,
  activeIndex,
  openedMenus,
  isSubmenuOpen: (index) => openedMenus.value.includes(index),
  openSubmenu(index) {
    if (openedMenus.value.includes(index)) return
    if (props.uniqueOpened) openedMenus.value = [index]
    else openedMenus.value = [...openedMenus.value, index]
    emit('open', index, [index])
  },
  closeSubmenu(index) {
    if (!openedMenus.value.includes(index)) return
    openedMenus.value = openedMenus.value.filter((i) => i !== index)
    emit('close', index, [index])
  },
  select(index, indexPath, route) {
    activeIndex.value = index
    emit('select', index, indexPath)
    if (props.router) {
      const target = route ?? index
      if (routerInjection && target) routerInjection.push(target)
    }
  },
})
// 菜单根路径（无父级 submenu）
provide('menuPath', [])
</script>

<style src="./style.css"></style>
