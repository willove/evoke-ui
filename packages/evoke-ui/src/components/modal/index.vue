<template>
  <Teleport to="body">
    <Transition name="ev-modal" @after-enter="emit('opened')" @after-leave="emit('closed')">
      <div
        v-if="visible"
        class="ev-modal"
        @click.self="onOverlayClick"
      >
        <div
          ref="panelRef"
          :class="['ev-modal__panel', { 'is-glass': glass === true, 'no-glass': glass === false }]"
          role="dialog"
          aria-modal="true"
          :aria-label="title || '对话框'"
          :style="[panelStyle, glassVars]"
          tabindex="-1"
        >
          <header v-if="title || $slots.header || showClose" class="ev-modal__header">
            <slot name="header">
              <h2 class="ev-modal__title">{{ title }}</h2>
            </slot>
            <button
              v-if="showClose"
              type="button"
              class="ev-modal__close"
              aria-label="关闭"
              @click="close"
            >
              <EvIcon name="close" :size="14" />
            </button>
          </header>

          <div class="ev-modal__body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="ev-modal__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * EvModal — 弹出层
 * 遮罩 + 居中面板；Teleport 到 body；Esc / 遮罩点击 / 关闭按钮关闭（均可配）；
 * 打开期间锁定页面滚动，打开时焦点移入面板、Tab 在面板内首尾循环（焦点圈闭）、关闭后归还触发元素；
 * 事件：update:modelValue / open / opened / close / closed。
 * 典型用法：弹出层 + 表单（邮箱验证、订阅、邀请）。
 */
import { computed, nextTick, ref, watch, onBeforeUnmount } from 'vue'
import EvIcon from '../icon/index.vue'
import { lockBodyScroll, unlockBodyScroll } from '../../composables/useScrollLock'

import { useGlassVars } from '../../composables/useGlassVars'
const props = defineProps({
  /** 可见性（v-model） */
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  /** 面板宽度（数字按 px） */
  width: { type: [String, Number], default: '560px' },
  /** 点击遮罩关闭 */
  overlayClose: { type: Boolean, default: true },
  /** Esc 关闭 */
  escClose: { type: Boolean, default: true },
  /** 打开期间锁定页面滚动 */
  lockScroll: { type: Boolean, default: true },
  /** 右上角关闭按钮 */
  showClose: { type: Boolean, default: true },
  /** 磨砂玻璃面板：true 强制开 / false 强制关 / 缺省跟随全局（ConfigProvider 的 glass） */
  glass: { type: Boolean, default: undefined },
  /** 磨砂强度（px），内联覆盖 --ev-glass-blur；缺省跟随令牌 */
  blur: { type: [Number, String], default: undefined },
  /** 磨砂饱和度（倍数），内联覆盖 --ev-glass-saturate；缺省跟随令牌 */
  saturate: { type: [Number, String], default: undefined },
  /** 磨砂底色浓度（%），内联覆盖 --ev-glass-bg；缺省跟随令牌 */
  tint: { type: [Number, String], default: undefined },
})

const emit = defineEmits([
  'update:modelValue', 'open', 'opened', 'close', 'closed',
])

const panelRef = ref(null)
let lastFocused = null

const visible = computed(() => props.modelValue)

const panelStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
}))

const glassVars = useGlassVars(props)

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function onOverlayClick() {
  if (props.overlayClose) close()
}

function onKeydown(e) {
  if (e.key === 'Escape' && props.escClose) {
    close()
    return
  }
  if (e.key === 'Tab') trapFocus(e)
}

/** Tab 焦点圈闭：在面板可聚焦元素的首尾循环，面板内无可聚焦元素时焦点留在面板 */
function trapFocus(e) {
  const panel = panelRef.value
  if (!panel) return
  const focusables = Array.from(
    panel.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  )
  if (!focusables.length) {
    e.preventDefault()
    panel.focus()
    return
  }
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  const active = document.activeElement
  const inside = panel.contains(active)
  if (e.shiftKey) {
    if (!inside || active === first) {
      e.preventDefault()
      last.focus()
    }
  } else if (!inside || active === last) {
    e.preventDefault()
    first.focus()
  }
}

// immediate：以 modelValue: true 直接挂载（如演示页）同样进入焦点管理、圈闭与滚动锁
watch(visible, (show) => {
  if (typeof document === 'undefined') return
  if (show) {
    lastFocused = document.activeElement
    emit('open')
    if (props.lockScroll) lockBodyScroll()
    document.addEventListener('keydown', onKeydown)
    nextTick(() => panelRef.value?.focus?.())
  } else {
    if (props.lockScroll) unlockBodyScroll()
    document.removeEventListener('keydown', onKeydown)
    nextTick(() => lastFocused?.focus?.())
  }
}, { immediate: true })

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  document.removeEventListener('keydown', onKeydown)
  if (props.lockScroll) unlockBodyScroll()
})
</script>

<style src="./style.css"></style>
