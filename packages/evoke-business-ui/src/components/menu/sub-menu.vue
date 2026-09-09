<template>
  <li
    class="ev-sub-menu ev-sub-menu"
    :class="{ 'is-active': isChildActive, 'is-opened': isOpen, 'is-disabled': disabled }"
    @mouseenter="handleEnter"
    @mouseleave="handleLeave"
  >
    <div
      ref="titleRef"
      class="ev-sub-menu__title"
      role="menuitem"
      aria-haspopup="true"
      :aria-expanded="usePopper ? popOpen : isOpen"
      :aria-disabled="disabled || undefined"
      :tabindex="disabled ? -1 : 0"
      @click="handleTitleClick"
    >
      <slot name="title">{{ title }}</slot>
      <ev-icon class="ev-sub-menu__icon-arrow" name="arrow-down" :size="12" />
    </div>

    <!-- inline 展开模式（垂直未折叠） -->
    <transition name="ev-sub-menu-collapse" @enter="onEnter" @after-enter="onAfterEnter" @leave="onLeave">
      <ul v-show="isOpen" class="ev-menu ev-menu--inline" role="menu">
        <slot />
      </ul>
    </transition>

    <!-- popper 模式（水平 / 折叠垂直）：Teleport 弹层 -->
    <Teleport to="body">
      <transition name="ev-color-picker-fade">
        <div
          v-if="usePopper && popOpen"
          ref="floatingRef"
          class="ev-menu ev-menu--vertical ev-menu--popper ev-menu__popper ev-menu"
          :class="popperClass"
          :style="popperStyle"
          role="menu"
          @mouseenter="handleEnter"
          @mouseleave="handleLeave"
        >
          <slot />
        </div>
      </transition>
    </Teleport>
  </li>
</template>

<script setup>
/**
 * EvSubMenu — 子菜单
 * 垂直未折叠 → inline 高度展开；水平 / 折叠垂直 → Teleport 弹层（hover/click 触发）
 */
import { inject, computed, ref, toRef, provide, watch, nextTick, onBeforeUnmount } from 'vue'
import EvIcon from '../icon/index.vue'
import { useFloating } from '../../composables/useFloating'
import { useZIndex } from '../../composables/useZIndex'

const props = defineProps({
  index: { type: [String, Number], required: true },
  title: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  showTimeout: { type: Number, default: 150 },
  hideTimeout: { type: Number, default: 300 },
  popperClass: { type: String, default: '' },
})

const ctx = inject('menuContext', null)
const parentPath = inject('menuPath', [])

const indexPath = computed(() => [...parentPath, props.index])
const isOpen = computed(() => !!ctx?.isSubmenuOpen?.(props.index))

// popper 判定：水平模式 或 垂直折叠
const mode = computed(() => ctx?.mode?.value ?? 'vertical')
const collapse = computed(() => ctx?.collapse?.value ?? false)
const usePopper = computed(() => mode.value === 'horizontal' || collapse.value)

// 子项激活上报：item 激活/失活 → 计数；submenu 自身再向父级链上报
const activeItemCount = ref(0)
provide('menuActiveProbe', (isActive) => {
  activeItemCount.value = isActive ? activeItemCount.value + 1 : Math.max(0, activeItemCount.value - 1)
})
const isChildActive = computed(() => activeItemCount.value > 0)
const parentProbe = inject('menuActiveProbe', null)
watch(
  isChildActive,
  (v) => parentProbe?.(v),
  { immediate: true },
)

const popOpen = ref(false)
const titleRef = ref(null)
const floatingRef = ref(null)

const { zIndex, next: nextZIndex } = useZIndex()
const { x, y, show, hide } = useFloating({
  reference: titleRef,
  floating: floatingRef,
  placement: collapse.value ? 'right-start' : 'bottom-start',
  offset: 4,
  flip: true,
  shift: true,
  autoUpdate: true,
})
const popperStyle = computed(() => ({
  position: 'fixed',
  left: `${x.value}px`,
  top: `${y.value}px`,
  zIndex: zIndex.value,
  minWidth: '160px',
}))

// 传递路径给子级（嵌套 submenu）
provide('menuPath', indexPath.value)

let enterTimer = null
let leaveTimer = null
function clearTimers() {
  if (enterTimer) clearTimeout(enterTimer)
  if (leaveTimer) clearTimeout(leaveTimer)
  enterTimer = leaveTimer = null
}
onBeforeUnmount(clearTimers)

// 嵌套弹出层桥：弹出层 Teleport 到 body、DOM 不相邻，鼠标移入子弹层会触发父弹层
// mouseleave 并排下 300ms 关闭计时；子级必须在进入自己（标题/弹层）时替父级清掉计时
const notifyAncestorPopper = inject('evMenuPopperHover', null)
provide('evMenuPopperHover', () => {
  if (!usePopper.value || !popOpen.value) return
  clearTimers()
})

function handleTitleClick() {
  if (props.disabled) return
  if (usePopper.value) {
    const trigger = ctx?.menuTrigger?.value ?? 'hover'
    if (trigger === 'click') popOpen.value ? closePopper() : openPopper()
    return
  }
  isOpen.value ? ctx?.closeSubmenu?.(props.index) : ctx?.openSubmenu?.(props.index)
}

function openPopper() {
  if (props.disabled || popOpen.value) return
  popOpen.value = true
  nextZIndex()
  // show 内部会 update 并启动 autoUpdate（滚动/resize 跟随，浮层不脱位）
  nextTick(show)
}
function closePopper() {
  popOpen.value = false
  hide()
}

function handleEnter() {
  notifyAncestorPopper?.()
  if (props.disabled || !usePopper.value) return
  if ((ctx?.menuTrigger?.value ?? 'hover') !== 'hover') return
  clearTimers()
  enterTimer = setTimeout(openPopper, props.showTimeout)
}
function handleLeave() {
  if (!usePopper.value) return
  clearTimers()
  leaveTimer = setTimeout(closePopper, props.hideTimeout)
}

// 高度过渡（inline 模式）
function onEnter(el) {
  el.style.height = '0'
  requestAnimationFrame(() => {
    el.style.height = `${el.scrollHeight}px`
  })
}
function onAfterEnter(el) {
  el.style.height = ''
}
function onLeave(el) {
  el.style.height = `${el.scrollHeight}px`
  requestAnimationFrame(() => {
    el.style.height = '0'
  })
}
</script>

<style src="./style.css"></style>
