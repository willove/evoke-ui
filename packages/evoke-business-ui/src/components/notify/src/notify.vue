<template>
  <Transition name="ev-notify-fade" @after-leave="handleAfterLeave">
    <div
      v-if="visible"
      ref="notifyRef"
      class="ev-notification"
      :class="[`ev-notification--${verticalPositionClass}`, `is-${type}`]"
      :style="positionStyle"
      role="alert"
    >
      <ev-icon v-if="iconName" class="ev-notification__icon" :name="iconName" />
      <div class="ev-notification__group">
        <h2 class="ev-notification__title">{{ title }}</h2>
        <div v-if="message || $slots.default" class="ev-notification__content">
          <slot>
            <p v-if="html" v-html="message"></p>
            <p v-else>{{ message }}</p>
          </slot>
        </div>
        <div v-if="showClose" class="ev-notification__closeBtn" @click="close">
          <ev-icon name="close" :size="14" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
/**
 * EvNotify 视图 — 命令式通知渲染（由 notify/index.js vnode 管线挂载）
 * 四角定位（top-right 默认）独立堆叠列
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import EvIcon from '../../icon/index.vue'

defineOptions({ name: 'EvNotifyView' })

const props = defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (v) => ['success', 'warning', 'info', 'error'].includes(v),
  },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  duration: { type: Number, default: 4500 },
  showClose: { type: Boolean, default: true },
  html: { type: Boolean, default: false },
  position: {
    type: String,
    default: 'top-right',
    validator: (v) => ['top-right', 'top-left', 'bottom-right', 'bottom-left'].includes(v),
  },
  zIndex: { type: Number, default: undefined },
  onClose: { type: Function, default: undefined },
  onDestroy: { type: Function, default: undefined },
})

const notifyRef = ref(null)
const visible = ref(true)
let timer = null

const iconName = computed(() => {
  const map = {
    success: 'circle-check-filled',
    warning: 'warning-filled',
    info: 'info-filled',
    error: 'circle-close-filled',
  }
  return map[props.type] ?? 'info-filled'
})

const verticalPositionClass = computed(() =>
  props.position.startsWith('top') ? 'top' : 'bottom'
)

const positionStyle = computed(() => {
  const isRight = props.position.endsWith('right')
  const style = { zIndex: props.zIndex }
  // 水平对齐在此绑定；top/bottom 堆叠偏移由命令式管线的 updateColumn 直写，
  // 不进绑定（避免重渲染时把直改值打回初始 offset）
  if (isRight) {
    style.right = '16px'
  } else {
    style.left = '16px'
  }
  return style
})

function startTimer() {
  if (props.duration > 0) {
    timer = setTimeout(close, props.duration)
  }
}

function clearTimer() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

function close() {
  clearTimer()
  visible.value = false
}

function handleAfterLeave() {
  props.onDestroy?.()
}

onMounted(startTimer)
onBeforeUnmount(clearTimer)

defineExpose({ close, el: notifyRef })
</script>

<style src="./style.css"></style>
