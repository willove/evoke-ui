<template>
  <li
    class="eb-sub-menu eb-sub-menu"
    :class="{ 'is-active': isChildActive, 'is-opened': isOpen, 'is-disabled': disabled }"
    @mouseenter="handleEnter"
    @mouseleave="handleLeave"
  >
    <div
      ref="titleRef"
      class="eb-sub-menu__title"
      role="menuitem"
      aria-haspopup="true"
      :aria-expanded="usePopper ? popOpen : isOpen"
      :aria-disabled="disabled || undefined"
      :tabindex="disabled ? -1 : 0"
      @click="handleTitleClick"
    >
      <slot name="title">{{ title }}</slot>
      <eb-icon class="eb-sub-menu__icon-arrow" name="arrow-down" :size="12" />
    </div>

    <!-- inline 展开模式（垂直未折叠） -->
    <transition name="eb-sub-menu-collapse" @enter="onEnter" @after-enter="onAfterEnter" @leave="onLeave">
      <ul v-show="isOpen" class="eb-menu eb-menu--inline" role="menu">
        <slot />
      </ul>
    </transition>

    <!-- popper 模式（水平 / 折叠垂直）：Teleport 弹层 -->
    <Teleport to="body">
      <transition name="eb-color-picker-fade">
        <div
          v-if="usePopper && popOpen"
          ref="floatingRef"
          class="eb-menu eb-menu--vertical eb-menu--popper eb-menu__popper eb-menu"
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
 * EbSubMenu — 子菜单
 * 垂直未折叠 → inline 高度展开；水平 / 折叠垂直 → Teleport 弹层（hover/click 触发）；
 * 弹层方向随折叠态切换：折叠 → right-start，展开 → bottom-start（双定位实例按 collapse 切换）
 */
import { inject, computed, ref, toRef, provide, watch, nextTick, onBeforeUnmount } from 'vue'
import EbIcon from '../icon/index.vue'
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
// useFloating 的 placement 在 setup 期一次性捕获、运行时不可变（computePosition 直读捕获值），
// 折叠态切换后无法透传新方向 —— 故折叠/展开各建一套定位实例，按 collapse 切换消费；
// 闲置实例从未 show()，不会启动 autoUpdate，无额外开销
const floatRight = useFloating({
  reference: titleRef,
  floating: floatingRef,
  placement: 'right-start',
  offset: 4,
  flip: true,
  shift: true,
  autoUpdate: true,
})
const floatBottom = useFloating({
  reference: titleRef,
  floating: floatingRef,
  placement: 'bottom-start',
  offset: 4,
  flip: true,
  shift: true,
  autoUpdate: true,
})
const activeFloat = computed(() => (collapse.value ? floatRight : floatBottom))
/** 当前生效实例的 placement（show 后为 floating-ui 实际定位方向） */
const popperPlacement = computed(() => activeFloat.value.placement.value)
const popperStyle = computed(() => ({
  position: 'fixed',
  left: `${activeFloat.value.x.value}px`,
  top: `${activeFloat.value.y.value}px`,
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
  nextTick(() => activeFloat.value.show())
}
function closePopper() {
  popOpen.value = false
  activeFloat.value.hide()
}

// 折叠切换瞬间若弹层开着：先在旧实例上 hide（停掉其 autoUpdate），再开时新实例按新方向定位
watch(collapse, (collapsed) => {
  if (!popOpen.value) return
  popOpen.value = false
  ;(collapsed ? floatBottom : floatRight).hide()
})

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

defineExpose({
  open: openPopper,
  close: closePopper,
  /** 当前生效实例的定位方向（弹层打开后为实际 placement） */
  popperPlacement,
})
</script>

<style src="./style.css"></style>
