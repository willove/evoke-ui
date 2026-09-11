<template>
  <Teleport to="body" :disabled="!appendToBody">
    <Transition name="ew-action-sheet-fade" @after-enter="emit('opened')" @after-leave="emit('closed')">
      <div
        v-if="visible"
        class="ew-action-sheet__overlay"
        :style="{ zIndex }"
        @click.self="onOverlayClick"
      >
        <div
          ref="panelRef"
          :class="['ew-action-sheet', { 'is-round': round }]"
          role="dialog"
          aria-modal="true"
          :aria-label="title || 'action sheet'"
        >
          <div v-if="title || $slots.title" class="ew-action-sheet__title">
            <slot name="title">{{ title }}</slot>
          </div>
          <div class="ew-action-sheet__list">
            <slot>
              <button
                v-for="(action, index) in actions"
                :key="index"
                type="button"
                :class="['ew-action-sheet__item', { 'is-disabled': action.disabled }]"
                :style="{ color: action.color }"
                :disabled="action.disabled"
                @click="onAction(action, index)"
              >
                <span class="ew-action-sheet__name">{{ action.name }}</span>
                <span v-if="action.subname" class="ew-action-sheet__subname">{{ action.subname }}</span>
              </button>
            </slot>
          </div>
          <button v-if="cancelText" type="button" class="ew-action-sheet__cancel" @click="onCancel">
            {{ cancelText }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * EwActionSheet — 底部动作面板
 * 移动端「更多操作」的标准形态：底部滑入的纵向动作列表 + 取消栏，
 * 替代 hover 类菜单在触屏上的缺位。动作项 { name, subname, color, disabled }。
 * 前台库保持零外部依赖：ESC 关闭 / 层级自增在组件内实现，滚动锁定走共享 useScrollLock。
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { lockBodyScroll, unlockBodyScroll } from '../../composables/useScrollLock'

defineOptions({ name: 'EwActionSheet' })

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
  /** Teleport 到 body；嵌套滚动容器/演示壳内置 false（弹层留在原地） */
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
let zSeed = 0
const zIndex = computed(() => 2000 + zSeed)

const visible = computed(() => props.modelValue)

// SSR 安全：构建期无 window/document，watch immediate 的关闭分支不能触碰 DOM
const hasDom = typeof window !== 'undefined'

function onKeydown(e) {
  if (e.key === 'Escape' && props.closeOnPressEscape) handleClose()
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      emit('open')
      zSeed += 1
      if (props.lockScroll && hasDom) lockBodyScroll()
      if (hasDom) window.addEventListener('keydown', onKeydown)
    } else {
      if (props.lockScroll && hasDom) unlockBodyScroll()
      if (hasDom) window.removeEventListener('keydown', onKeydown)
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (hasDom) unlockBodyScroll()
  window.removeEventListener('keydown', onKeydown)
})

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
