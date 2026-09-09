<template>
  <Teleport to="body" :disabled="!appendToBody">
    <Transition name="ev-action-sheet-fade" @after-enter="emit('opened')" @after-leave="emit('closed')">
      <div
        v-if="visible"
        class="ev-action-sheet__overlay"
        :style="{ zIndex }"
        @click.self="onOverlayClick"
      >
        <div
          ref="panelRef"
          :class="['ev-action-sheet', { 'is-round': round }]"
          role="dialog"
          aria-modal="true"
          :aria-label="title || 'action sheet'"
        >
          <div v-if="title || $slots.title" class="ev-action-sheet__title">
            <slot name="title">{{ title }}</slot>
          </div>
          <div class="ev-action-sheet__list">
            <slot>
              <button
                v-for="(action, index) in actions"
                :key="index"
                type="button"
                :class="['ev-action-sheet__item', { 'is-disabled': action.disabled }]"
                :style="{ color: action.color }"
                :disabled="action.disabled"
                @click="onAction(action, index)"
              >
                <span class="ev-action-sheet__name">{{ action.name }}</span>
                <span v-if="action.subname" class="ev-action-sheet__subname">{{ action.subname }}</span>
              </button>
            </slot>
          </div>
          <button v-if="cancelText" type="button" class="ev-action-sheet__cancel" @click="onCancel">
            {{ cancelText }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * EvActionSheet — 底部动作面板
 * 移动端「更多操作」的标准形态：底部滑入的纵向动作列表 + 取消栏，
 * 替代桌面上依赖 hover 的 Dropdown / Popconfirm。
 * 动作项 { name, subname, color, disabled }；破坏性动作用 color 标红并排在最末。
 */
import { computed, nextTick, ref, watch } from 'vue'
import { useFocusTrap } from '../../composables/useFocusTrap'
import { useLockScroll } from '../../composables/useLockScroll'
import { useZIndex } from '../../composables/useZIndex'

defineOptions({ name: 'EvActionSheet' })

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 动作列表：{ name, subname?, color?, disabled? } */
  actions: { type: Array, default: () => [] },
  title: { type: String, default: '' },
  /** 取消栏文案，空串隐藏取消栏 */
  cancelText: { type: String, default: '取消' },
  /** 顶部大圆角 */
  round: { type: Boolean, default: true },
  closeOnClickAction: { type: Boolean, default: true },
  closeOnClickModal: { type: Boolean, default: true },
  closeOnPressEscape: { type: Boolean, default: true },
  appendToBody: { type: Boolean, default: true },
  lockScroll: { type: Boolean, default: true },
  /** 关闭前拦截：不调用入参 done 则阻止本次关闭 */
  beforeClose: { type: Function, default: undefined },
})

const emit = defineEmits([
  'update:modelValue',
  'select',
  'cancel',
  'open',
  'opened',
  'close',
  'closed',
])

const panelRef = ref(null)
const rendered = ref(false)
const { zIndex } = useZIndex()
const { lock, unlock } = useLockScroll()

const visible = computed(() => props.modelValue)

const { activate, deactivate } = useFocusTrap(panelRef, {
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
    }
  },
  { immediate: true }
)

function hide() {
  emit('close')
  emit('update:modelValue', false)
}

function handleClose() {
  if (props.beforeClose) {
    props.beforeClose(hide)
    return
  }
  hide()
}

function onOverlayClick(e) {
  if (!props.closeOnClickModal) return
  if (e.target === e.currentTarget) handleClose()
}

function onAction(action, index) {
  if (action.disabled) return
  emit('select', action, index)
  if (props.closeOnClickAction) handleClose()
}

function onCancel() {
  emit('cancel')
  handleClose()
}
</script>

<style src="./style.css"></style>
