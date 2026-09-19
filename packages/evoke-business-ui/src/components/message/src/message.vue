<template>
  <Transition
    name="eb-message-fade"
    @after-leave="handleAfterLeave"
  >
    <div
      v-if="visible"
      ref="messageRef"
      class="eb-message eb-message"
      :class="[`eb-message--${type}`, { 'is-center': center, 'is-closable': showClose }]"
      :style="{ zIndex }"
      role="alert"
    >
      <eb-icon :name="iconName" class="eb-message__icon" />
      <div class="eb-message__content">
        <template v-if="html">
          <!-- 信任边界：html:true 是宿主显式 opt-in 的 HTML 直出口（同 Element Plus 语义），
               内容由调用方负责转义，组件不做二次处理；默认路径走插值自动转义 -->
          <span v-html="message"></span>
        </template>
        <template v-else>{{ message }}</template>
      </div>
      <button
        v-if="showClose"
        type="button"
        class="eb-message__closeBtn"
        aria-label="Close"
        @click="handleCloseClick"
      >
        <eb-icon name="close" :size="14" />
      </button>
    </div>
  </Transition>
</template>

<script setup>
/**
 * EbMessage 视图 — 命令式消息渲染（由 message/index.js 的 vnode 管线挂载）
 * DOM 访问全部在生命周期内（Electron 安全）
 */
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import EbIcon from '../../icon/index.vue'

defineOptions({ name: 'EbMessageView' })

const props = defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (v) => ['success', 'warning', 'info', 'error'].includes(v),
  },
  message: { type: [String, Object], default: '' },
  duration: { type: Number, default: 3000 },
  showClose: { type: Boolean, default: false },
  center: { type: Boolean, default: false },
  html: { type: Boolean, default: false },
  zIndex: { type: Number, default: undefined },
  onClose: { type: Function, default: undefined },
  onDestroy: { type: Function, default: undefined },
})

const messageRef = ref(null)
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
  props.onClose?.()
}

function handleCloseClick() {
  close()
}

function handleAfterLeave() {
  props.onDestroy?.()
}

onMounted(startTimer)
onBeforeUnmount(clearTimer)

defineExpose({
  close,
  resetTimer() {
    clearTimer()
    startTimer()
  },
  el: messageRef,
})
</script>

<style src="./style.css"></style>
