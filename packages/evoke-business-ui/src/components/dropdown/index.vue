<template>
  <div
    ref="rootRef"
    class="eb-dropdown eb-dropdown"
    :class="[sizeClass, { 'is-disabled': disabled }]"
  >
    <slot v-if="!splitButton" name="default">
      <span class="eb-dropdown__trigger-inner" aria-haspopup="menu" :aria-expanded="open">
        <slot name="trigger" />
        <eb-icon name="arrow-down" class="eb-dropdown__caret" :class="{ 'is-reverse': open }" />
      </span>
    </slot>
    <eb-button-group v-else>
      <eb-button :type="type" :size="size" @click="handleMainClick">
        <slot name="trigger">{{ text }}</slot>
      </eb-button>
      <eb-button
        :type="type"
        :size="size"
        class="eb-dropdown__caret-button"
        aria-haspopup="menu"
        :aria-expanded="open"
        @click="toggle"
      >
        <eb-icon name="arrow-down" class="eb-dropdown__caret" :class="{ 'is-reverse': open }" />
      </eb-button>
    </eb-button-group>

    <Teleport to="body">
      <Transition name="eb-dropdown-fade">
        <div
          v-if="open"
          ref="floatingRef"
          class="eb-dropdown__popper eb-popper eb-dropdown__popper"
          :style="popperStyle"
        >
          <slot name="dropdown">
            <eb-dropdown-menu>
              <slot />
            </eb-dropdown-menu>
          </slot>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
/**
 * EbDropdown — 下拉菜单
 * trigger 语义 hover/click/contextmenu；split-button 模式
 */
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, toRef, watch } from 'vue'
import EbIcon from '../icon/index.vue'
import EbButton from '../button/index.vue'
import EbButtonGroup from '../button/group.vue'
import EbDropdownMenu from './menu.vue'
import { useFloating } from '../../composables/useFloating'
import { useZIndex } from '../../composables/useZIndex'
import { useClickOutside } from '../../composables/useClickOutside'
import { provideDropdownContext } from './dropdown-context'
import { on as onEvent } from '../../utils/events'
import { inBrowser } from '../../utils/dom'

defineOptions({ name: 'EbDropdown' })

const props = defineProps({
  trigger: {
    type: String,
    default: 'hover',
    validator: (v) => ['hover', 'click', 'contextmenu'].includes(v),
  },
  type: { type: String, default: '' },
  size: { type: String, default: '' },
  placement: { type: String, default: 'bottom' },
  disabled: { type: Boolean, default: false },
  splitButton: { type: Boolean, default: false },
  text: { type: String, default: '' },
  /** 打开延时（hover 触发） */
  showTimeout: { type: Number, default: 250 },
  /** 关闭延时（hover 触发） */
  hideTimeout: { type: Number, default: 150 },
})

const emit = defineEmits(['visible-change', 'command', 'click'])

const rootRef = ref(null)
const floatingRef = ref(null)
const open = ref(false)
let showTimer = null
let hideTimer = null

const { zIndex, next: nextZIndex } = useZIndex()
const { x, y, update, show: activateFloating, hide: deactivateFloating } = useFloating({
  reference: rootRef,
  floating: floatingRef,
  placement: props.placement,
  offset: 8,
  flip: true,
  shift: true,
  autoUpdate: true,
})

const popperStyle = computed(() => ({
  position: 'fixed',
  left: `${x.value}px`,
  top: `${y.value}px`,
  zIndex: zIndex.value,
}))

const sizeClass = computed(() => {
  if (props.size === 'large') return 'eb-dropdown--large'
  if (props.size === 'small') return 'eb-dropdown--small'
  return ''
})

provideDropdownContext({
  open,
  close: () => closeDropdown(),
  handleCommand: (command) => {
    emit('command', command)
    closeDropdown()
  },
})

function clearTimers() {
  if (showTimer) clearTimeout(showTimer)
  if (hideTimer) clearTimeout(hideTimer)
  showTimer = null
  hideTimer = null
}

async function openDropdown() {
  if (props.disabled || open.value) return
  clearTimers()
  nextZIndex()
  open.value = true
  emit('visible-change', true)
  await nextTick()
  await activateFloating()
}

function closeDropdown() {
  if (!open.value) return
  clearTimers()
  open.value = false
  deactivateFloating()
  emit('visible-change', false)
}

function toggle() {
  open.value ? closeDropdown() : openDropdown()
}

function handleMainClick(e) {
  emit('click', e)
}

// ─── 事件绑定 ───
const cleanups = []

function bindEvents() {
  if (!inBrowser()) return
  const el = rootRef.value
  if (!el) return

  if (props.trigger === 'hover') {
    cleanups.push(
      onEvent(el, 'mouseenter', () => {
        if (props.disabled) return
        clearTimers()
        showTimer = setTimeout(openDropdown, props.showTimeout)
      })
    )
    cleanups.push(
      onEvent(el, 'mouseleave', () => {
        clearTimers()
        hideTimer = setTimeout(closeDropdown, props.hideTimeout)
      })
    )
  } else if (props.trigger === 'click') {
    cleanups.push(
      onEvent(el, 'click', (e) => {
        if (props.disabled) return
        // split-button 模式：仅箭头按钮 toggle（已绑定）；否则整体 toggle
        if (!props.splitButton || e.target.closest?.('.eb-dropdown__caret-button')) toggle()
      })
    )
  } else if (props.trigger === 'contextmenu') {
    cleanups.push(
      onEvent(el, 'contextmenu', (e) => {
        e.preventDefault()
        if (!props.disabled) openDropdown()
      })
    )
  }
  bindFloatingHover()
  // ESC
  cleanups.push(
    onEvent(document, 'keydown', (e) => {
      if (e.key === 'Escape') closeDropdown()
    })
  )
}

// 浮层 hover 保活：floating 元素 v-if 惰性渲染，须在 DOM 就绪后绑定
// （onEvent 只接受真实 EventTarget，传 Vue ref 会静默失败）
let floatingHoverCleanup = []
function bindFloatingHover() {
  floatingHoverCleanup.splice(0).forEach((off) => off())
  const el = floatingRef.value
  if (!el) return
  floatingHoverCleanup.push(onEvent(el, 'mouseenter', clearTimers))
  floatingHoverCleanup.push(
    onEvent(el, 'mouseleave', () => {
      if (props.trigger === 'hover') hideTimer = setTimeout(closeDropdown, props.hideTimeout)
    })
  )
}

watch(floatingRef, (el) => {
  if (el) bindFloatingHover()
  else floatingHoverCleanup.splice(0).forEach((off) => off())
})

// 挂载后同步绑定（rootRef 已填充，事件立即可用）
onMounted(bindEvents)

const { stop: stopClickOutside } = useClickOutside(
  [rootRef, floatingRef],
  () => closeDropdown(),
  true
)

onBeforeUnmount(() => {
  clearTimers()
  floatingHoverCleanup.splice(0).forEach((off) => off())
  cleanups.splice(0).forEach((off) => off())
  stopClickOutside()
})

defineExpose({
  open: openDropdown,
  close: closeDropdown,
  visible: open,
})
</script>

<style src="./style.css"></style>
