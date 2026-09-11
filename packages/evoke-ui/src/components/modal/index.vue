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
          class="ev-modal__panel"
          role="dialog"
          aria-modal="true"
          :aria-label="title || '对话框'"
          :style="panelStyle"
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
 * 打开期间锁定页面滚动，打开时焦点移入面板、关闭后归还触发元素；
 * 事件：update:modelValue / open / opened / close / closed。
 * 典型用法：弹出层 + 表单（邮箱验证、订阅、邀请）。
 */
import { computed, nextTick, ref, watch, onBeforeUnmount } from 'vue'
import EvIcon from '../icon/index.vue'
import { lockBodyScroll, unlockBodyScroll } from '../../composables/useScrollLock'

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

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function onOverlayClick() {
  if (props.overlayClose) close()
}

function onKeydown(e) {
  if (e.key === 'Escape' && props.escClose) close()
}

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
})

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  document.removeEventListener('keydown', onKeydown)
  if (props.lockScroll) unlockBodyScroll()
})
</script>

<style src="./style.css"></style>
