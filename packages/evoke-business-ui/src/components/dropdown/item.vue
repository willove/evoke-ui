<template>
  <li
    class="eb-dropdown-menu__item eb-dropdown-item"
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
      <eb-icon v-if="icon" :name="icon" class="eb-dropdown-menu__icon" />
      <span>{{ label }}</span>
    </slot>
  </li>
</template>

<script setup>
/**
 * EbDropdownItem — 下拉菜单项
 * command 语义：点击向 EbDropdown 冒泡 command 事件
 */
import EbIcon from '../icon/index.vue'
import { useDropdownContext } from './dropdown-context'

defineOptions({ name: 'EbDropdownItem' })

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
