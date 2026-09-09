<template>
  <Teleport to="body" :disabled="!appendToBody">
    <Transition
      :name="`ev-drawer-fade-${direction}`"
      @after-enter="emit('opened')"
      @after-leave="emit('closed')"
    >
      <div
        v-if="visible"
        class="ev-overlay ev-overlay ev-overlay--drawer"
        :style="{ zIndex }"
        @click.self="handleOverlayClick"
      >
        <div
          ref="drawerRef"
          class="ev-drawer ev-drawer"
          :class="[`ev-drawer--${direction}`, { 'is-with-header': withHeader }]"
          :style="drawerStyle"
          role="dialog"
          aria-modal="true"
          :aria-label="title || 'drawer'"
        >
          <header v-if="withHeader" class="ev-drawer__header">
            <slot name="header">
              <span class="ev-drawer__title">{{ title }}</span>
            </slot>
            <button
              v-if="showClose"
              type="button"
              class="ev-drawer__close-btn"
              aria-label="Close"
              @click="handleClose"
            >
              <ev-icon name="close" />
            </button>
          </header>
          <div class="ev-drawer__body">
            <slot v-if="!destroyOnClose || rendered" />
          </div>
          <footer v-if="$slots.footer" class="ev-drawer__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * EvDrawer — 抽屉
 * direction: ltr/rtl/ttb/btt；滑入滑出动画按方向
 */
import { computed, nextTick, ref, watch } from 'vue'
import EvIcon from '../icon/index.vue'
import { useFocusTrap } from '../../composables/useFocusTrap'
import { useLockScroll } from '../../composables/useLockScroll'
import { useZIndex } from '../../composables/useZIndex'

defineOptions({ name: 'EvDrawer' })

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  direction: {
    type: String,
    default: 'rtl',
    validator: (v) => ['ltr', 'rtl', 'ttb', 'btt'].includes(v),
  },
  /** 尺寸：水平方向为宽度，垂直方向为高度 */
  size: { type: [String, Number], default: '30%' },
  withHeader: { type: Boolean, default: true },
  showClose: { type: Boolean, default: true },
  destroyOnClose: { type: Boolean, default: false },
  appendToBody: { type: Boolean, default: true },
  modal: { type: Boolean, default: true },
  closeOnClickModal: { type: Boolean, default: true },
  closeOnPressEscape: { type: Boolean, default: true },
  lockScroll: { type: Boolean, default: true },
  beforeClose: { type: Function, default: undefined },
})

const emit = defineEmits([
  'update:modelValue',
  'open',
  'opened',
  'close',
  'closed',
])

const drawerRef = ref(null)
const rendered = ref(false)
const { zIndex } = useZIndex()
const { lock, unlock } = useLockScroll()

const visible = computed(() => props.modelValue)

const isVertical = computed(() => props.direction === 'ttb' || props.direction === 'btt')

const drawerStyle = computed(() => {
  const size = typeof props.size === 'number' ? `${props.size}px` : props.size
  if (isVertical.value) {
    return { height: size }
  }
  return { width: size }
})

const { activate, deactivate } = useFocusTrap(drawerRef, {
  escapeDeactivates: true,
  onEscape: () => {
    if (props.closeOnPressEscape) handleClose()
  },
})

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      emit('open')
      rendered.value = true
      if (props.lockScroll) lock()
      nextTick(() => activate())
    } else {
      if (props.lockScroll) unlock()
      deactivate()
      if (props.destroyOnClose) {
        rendered.value = false
      }
    }
  },
  { immediate: true }
)

function handleOverlayClick(e) {
  if (!props.modal || !props.closeOnClickModal) return
  if (e.target === e.currentTarget) handleClose()
}

function handleClose() {
  if (props.beforeClose) {
    props.beforeClose(() => {
      emit('update:modelValue', false)
      emit('close')
    })
    return
  }
  emit('update:modelValue', false)
  emit('close')
}

defineExpose({
  visible,
  handleClose,
  ref: drawerRef,
})
</script>

<style src="./style.css"></style>
