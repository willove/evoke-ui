<template>
  <Teleport to="body">
    <Transition :name="TRANSITION_NAME">
      <div
        v-if="modelValue"
        class="et-toast"
        :class="[positionClass, typeClass]"
        role="status"
        aria-live="polite"
      >
        <et-icon class="et-toast__icon" :name="iconName" :size="ICON_SIZE" />
        <span class="et-toast__text"><slot>{{ message }}</slot></span>
        <span v-if="$slots.action" class="et-toast__action" @click="emit('action')">
          <slot name="action" />
        </span>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * EtToast — 瞬时通知（tools-ui 计划 05 §四 L4 / 07 M3 交付物 5）
 *
 * Teleport 到 body、走 --et-z-notify 层级（阶梯无 toast 档，notify 即通知位，
 * 恒在 modal 之上：弹窗上方的提示不被对话框盖住）。role=status +
 * aria-live=polite：不抢焦点、不中断当前操作。自动关定时器随关闭/卸载清理。
 * 过渡名走 TRANSITION_NAME 常量绑定（G2 图标名提取器会把过渡名的字面属性
 * 当图标名）。
 *
 * 契约要点：
 *   ① duration>0 才挂自动关定时器；0 = 常驻到消费方关闭（定时器不建）；
 *   ② 关闭 / 卸载都清定时器（防泄漏：组件没了回调不该再 fire）；
 *   ③ 图标用库内 semantic 名（info / success / warning / error，G2 注册表）。
 */
import { computed, onBeforeUnmount, watch } from 'vue'
import EtIcon from '../../icons/icon.vue'

defineOptions({ name: 'EtToast' })

/** 过渡名（绑定而非字面量：G2 图标名提取器按字面 name 属性抽图标名） */
const TRANSITION_NAME = 'et-toast'

/** 类型图标：库内 semantic 名（G2 注册表：info / success / warning / error） */
const TYPE_ICONS = { info: 'info', success: 'success', warn: 'warning', error: 'error' }
const ICON_SIZE = 'var(--et-icon-sm)'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  message: { type: String, default: '' },
  /** info | success | warn | error */
  type: { type: String, default: 'info' },
  /** 自动关毫秒数；0 = 不自动关 */
  duration: { type: Number, default: 3000 },
  /** top | center | bottom */
  position: { type: String, default: 'top' },
})

const emit = defineEmits(['update:modelValue', 'action'])

const TYPES = ['info', 'success', 'warn', 'error']
const POSITIONS = ['top', 'center', 'bottom']

const typeClass = computed(() =>
  TYPES.includes(props.type) ? `et-toast--${props.type}` : 'et-toast--info',
)
const positionClass = computed(() =>
  POSITIONS.includes(props.position) ? `et-toast--${props.position}` : 'et-toast--top',
)
const iconName = computed(() => TYPE_ICONS[props.type] ?? 'info')

// 自动关定时器（单枚；重开 / 改 duration 都重挂，关闭与卸载即清）
let timer = null

function clearTimer() {
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
}

watch(
  () => [props.modelValue, props.duration],
  ([open, duration]) => {
    clearTimer()
    if (open && duration > 0) {
      timer = setTimeout(() => {
        timer = null
        emit('update:modelValue', false)
      }, duration)
    }
  },
  { immediate: true },
)

onBeforeUnmount(clearTimer)
</script>

<style src="./style.css"></style>
