<template>
  <Teleport v-if="appendToBody" to="body" :disabled="!ready">
    <Transition
      name="ev-dialog-fade"
      @after-enter="emit('opened')"
      @after-leave="emit('closed')"
    >
      <div
        v-if="visible"
        class="ev-overlay ev-overlay"
        :style="{ zIndex }"
        @click.self="handleOverlayClick"
      >
        <div
          ref="dialogRef"
          class="ev-overlay-dialog"
          @click.self="handleOverlayClick"
        >
          <div
            class="ev-dialog ev-dialog"
            :class="[
              sizeClass,
              {
                'is-fullscreen': fullscreen,
                'is-align-center': alignCenter,
                'is-draggable': false,
              },
            ]"
            :style="dialogStyle"
            role="dialog"
            aria-modal="true"
            :aria-label="title || 'dialog'"
          >
            <header class="ev-dialog__header">
              <slot name="header">
                <span class="ev-dialog__title">{{ title }}</span>
              </slot>
              <button
                v-if="showClose"
                type="button"
                class="ev-dialog__headerbtn"
                aria-label="Close"
                @click="handleClose"
              >
                <ev-icon name="close" />
              </button>
            </header>
            <div class="ev-dialog__body">
              <slot v-if="!destroyOnClose || rendered" />
            </div>
            <footer v-if="$slots.footer" class="ev-dialog__footer">
              <slot name="footer" />
            </footer>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- 内联模式（appendToBody=false） -->
  <Transition
    v-else
    name="ev-dialog-fade"
    @after-enter="emit('opened')"
    @after-leave="emit('closed')"
  >
    <div
      v-if="visible"
      class="ev-overlay ev-overlay"
      :style="{ zIndex }"
      @click.self="handleOverlayClick"
    >
      <div ref="dialogRef" class="ev-overlay-dialog" @click.self="handleOverlayClick">
        <div
          class="ev-dialog ev-dialog"
          :class="[{ 'is-fullscreen': fullscreen, 'is-align-center': alignCenter }]"
          :style="dialogStyle"
          role="dialog"
          aria-modal="true"
          :aria-label="title || 'dialog'"
        >
          <header class="ev-dialog__header">
            <slot name="header">
              <span class="ev-dialog__title">{{ title }}</span>
            </slot>
            <button
              v-if="showClose"
              type="button"
              class="ev-dialog__headerbtn"
              aria-label="Close"
              @click="handleClose"
            >
              <ev-icon name="close" />
            </button>
          </header>
          <div class="ev-dialog__body">
            <slot v-if="!destroyOnClose || rendered" />
          </div>
          <footer v-if="$slots.footer" class="ev-dialog__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
/**
 * EvDialog — 对话框
 * Teleport + 焦点圈禁（useFocusTrap）+ ESC/遮罩点击语义 + lock-scroll 计数式
 */
import { computed, ref, watch, nextTick, onMounted } from 'vue'
import EvIcon from '../icon/index.vue'
import { useFocusTrap } from '../../composables/useFocusTrap'
import { useLockScroll } from '../../composables/useLockScroll'
import { useZIndex } from '../../composables/useZIndex'

defineOptions({ name: 'EvDialog' })

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  width: { type: [String, Number], default: '520px' },
  fullscreen: { type: Boolean, default: false },
  top: { type: String, default: '15vh' },
  modal: { type: Boolean, default: true },
  closeOnClickModal: { type: Boolean, default: true },
  closeOnPressEscape: { type: Boolean, default: true },
  showClose: { type: Boolean, default: true },
  destroyOnClose: { type: Boolean, default: false },
  appendToBody: { type: Boolean, default: true },
  lockScroll: { type: Boolean, default: true },
  center: { type: Boolean, default: false },
  alignCenter: { type: Boolean, default: false },
  /** 关闭前钩子：(done) => void；不调用 done 则阻止关闭 */
  beforeClose: { type: Function, default: undefined },
})

const emit = defineEmits([
  'update:modelValue',
  'open',
  'opened',
  'close',
  'closed',
])

const dialogRef = ref(null)
const ready = ref(false)
const rendered = ref(false)
const { zIndex } = useZIndex()
const { lock, unlock } = useLockScroll()

const visible = computed(() => props.modelValue)

const sizeClass = computed(() => (props.center ? 'is-center' : ''))

const dialogStyle = computed(() => {
  if (props.fullscreen) return {}
  const width = typeof props.width === 'number' ? `${props.width}px` : props.width
  const style = { width, maxWidth: 'calc(100% - 32px)' }
  if (!props.alignCenter) {
    style.marginTop = props.top
  }
  return style
})

const { activate, deactivate } = useFocusTrap(dialogRef, {
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

onMounted(() => {
  ready.value = true
})

function handleOverlayClick(e) {
  if (!props.modal || !props.closeOnClickModal) return
  // 仅当点击目标为遮罩自身（.self 已过滤子元素）
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
  ref: dialogRef,
})
</script>

<style src="./style.css"></style>
