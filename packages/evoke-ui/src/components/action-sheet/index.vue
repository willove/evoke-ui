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
          :class="['ev-action-sheet', { 'is-round': round, 'is-glass': glass === true, 'no-glass': glass === false }]"
          :style="glassVars"
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
 * 替代 hover 类菜单在触屏上的缺位。动作项 { name, subname, color, disabled }。
 * 前台库保持零外部依赖：ESC 关闭 / 层级自增在组件内实现，滚动锁定走共享 useScrollLock。
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { lockBodyScroll, unlockBodyScroll } from '../../composables/useScrollLock'

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
  /** Teleport 到 body；嵌套滚动容器/演示壳内置 false（弹层留在原地） */
  appendToBody: { type: Boolean, default: true },
  lockScroll: { type: Boolean, default: true },
  /** 关闭前拦截：不调用入参 done 则阻止本次关闭 */
  beforeClose: { type: Function, default: undefined },
  /** 磨砂玻璃面板：true 强制开 / false 强制关 / 缺省跟随全局（ConfigProvider 的 glass） */
  glass: { type: Boolean, default: undefined },
  /** 磨砂强度（px），内联覆盖 --ev-glass-blur；缺省跟随令牌 */
  blur: { type: [Number, String], default: undefined },
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

// 组件级磨砂强度：内联覆盖 --ev-glass-blur，缺省不产出内联样式（跟随令牌）
const glassVars = computed(() => {
  if (props.blur === undefined || props.blur === null || props.blur === '') return undefined
  return { '--ev-glass-blur': typeof props.blur === 'number' ? `${props.blur}px` : props.blur }
})

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
