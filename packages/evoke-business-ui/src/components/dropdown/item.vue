<template>
  <li
    class="ev-dropdown-menu__item ev-dropdown-item"
    :class="{
      'is-disabled': disabled,
      'is-divided': divided,
    }"
    :tabindex="disabled ? -1 : 0"
    role="menuitem"
    :aria-disabled="disabled"
    @click="handleClick"
  >
    <slot>
      <ev-icon v-if="icon" :name="icon" class="ev-dropdown-menu__icon" />
      <span>{{ label }}</span>
    </slot>
  </li>
</template>

<script setup>
/**
 * EvDropdownItem — 下拉菜单项
 * command 语义：点击向 EvDropdown 冒泡 command 事件
 */
import EvIcon from '../icon/index.vue'
import { useDropdownContext } from './dropdown-context'

defineOptions({ name: 'EvDropdownItem' })

const props = defineProps({
  command: { type: [String, Number, Object], default: undefined },
  label: { type: String, default: '' },
  icon: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  divided: { type: Boolean, default: false },
})

const ctx = useDropdownContext()

function handleClick() {
  if (props.disabled) return
  ctx?.handleCommand?.(props.command)
}
</script>

<style src="./item.css"></style>
