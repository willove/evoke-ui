<template>
  <li
    class="eb-menu-item eb-menu-item"
    :class="{ 'is-active': isActive, 'is-disabled': disabled }"
    role="menuitem"
    :tabindex="disabled ? -1 : -1"
    :aria-disabled="disabled || undefined"
    @click="handleClick"
  >
    <slot />
  </li>
</template>

<script setup>
/**
 * EbMenuItem — 菜单项
 * 点击 → 菜单根 select（含 indexPath）；router 模式由根负责跳转
 */
import { inject, computed, watch } from 'vue'

const props = defineProps({
  index: { type: [String, Number], required: true },
  route: { type: [String, Object], default: undefined },
  disabled: { type: Boolean, default: false },
})

const ctx = inject('menuContext', null)
const parentPath = inject('menuPath', [])

const indexPath = computed(() => [...parentPath, props.index])
const isActive = computed(() => ctx?.activeIndex?.value === props.index)

// 向最近 submenu 上报激活态（嵌套时逐级向上）
const probe = inject('menuActiveProbe', null)
watch(
  isActive,
  (v) => probe?.(v),
  { immediate: true },
)

function handleClick() {
  if (props.disabled || !ctx) return
  ctx.select(props.index, indexPath.value, props.route)
}
</script>
