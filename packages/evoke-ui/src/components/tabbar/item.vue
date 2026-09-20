<template>
  <div
    :class="['ev-tabbar-item', { 'is-active': isActive, 'is-disabled': disabled }]"
    role="tab"
    :aria-selected="isActive"
    :tabindex="disabled ? -1 : 0"
    @click="onClick"
    @keydown.enter="onClick"
    @keydown.space.prevent="onClick"
  >
    <div v-if="hasIcon" class="ev-tabbar-item__icon">
      <slot name="icon" :active="isActive">
        <EvIcon v-if="icon" :name="icon" />
      </slot>
      <i v-if="dot" class="ev-tabbar-item__dot" />
      <span v-else-if="showBadge" class="ev-tabbar-item__badge">{{ badge }}</span>
    </div>
    <div class="ev-tabbar-item__text">
      <slot />
      <i v-if="!hasIcon && dot" class="ev-tabbar-item__dot is-inline" />
      <span v-else-if="!hasIcon && showBadge" class="ev-tabbar-item__badge is-inline">{{ badge }}</span>
    </div>
  </div>
</template>

<script setup>
/**
 * EvTabbarItem — 底部标签栏项
 * name 缺省时以注册顺序的索引作为标识；icon 插槽携带 active 支持选中态图标切换。
 * 纯文字页签（无 icon）时 badge/dot 内联在文字后，避免悬空叠字。
 */
import { computed, inject, useSlots } from 'vue'
import EvIcon from '../icon/index.vue'

defineOptions({ name: 'EvTabbarItem' })

const props = defineProps({
  /** 标识，缺省用注册顺序索引 */
  name: { type: [String, Number], default: '' },
  /** 图标名（EvIcon 注册名），需自定义选中态时用 #icon 插槽 */
  icon: { type: String, default: '' },
  /** 红点提醒（优先级高于 badge） */
  dot: { type: Boolean, default: false },
  /** 角标内容 */
  badge: { type: [String, Number], default: '' },
  disabled: { type: Boolean, default: false },
})

const slots = useSlots()
const tabbar = inject('evTabbar', null)
const index = tabbar ? tabbar.registerItem() : -1

const hasIcon = computed(() => !!props.icon || !!slots.icon)
const value = computed(() => (props.name !== '' ? props.name : index))
const isActive = computed(() => tabbar?.current.value === value.value)
const showBadge = computed(() => props.badge !== '' && props.badge !== null)

function onClick() {
  if (props.disabled) return
  tabbar?.setActive(value.value)
}
</script>
