<template>
  <Teleport to="body">
    <Transition name="eb-msgbox-fade" @after-leave="handleAfterLeave">
      <div
        v-if="visible"
        class="eb-overlay eb-overlay is-message-box"
        :style="{ zIndex }"
        @click.self="handleOverlayClick"
      >
        <div
          ref="boxRef"
          class="eb-message-box eb-message-box"
          :class="[typeClass, { 'is-center': center }]"
          role="alertdialog"
          aria-modal="true"
          :aria-label="title || 'message box'"
        >
          <div class="eb-message-box__header">
            <div class="eb-message-box__title">
              <eb-icon v-if="showIcon && iconName" :name="iconName" class="eb-message-box__status" :class="`is-${type}`" />
              <span>{{ title }}</span>
            </div>
            <button
              v-if="showClose"
              type="button"
              class="eb-message-box__headerbtn"
              aria-label="Close"
              @click="handleAction('close')"
            >
              <eb-icon name="close" />
            </button>
          </div>
          <div class="eb-message-box__content">
            <div class="eb-message-box__container">
              <div v-if="message" class="eb-message-box__message">
                <p v-if="html" v-html="message"></p>
                <p v-else>{{ message }}</p>
              </div>
            </div>
            <div v-if="mode === 'prompt'" class="eb-message-box__input">
              <eb-input
                ref="inputRef"
                v-model="inputValue"
                :type="inputType"
                :placeholder="inputPlaceholder"
                @keydown.enter="handleEnter"
              />
              <div v-if="inputError" class="eb-message-box__errormsg">{{ inputError }}</div>
            </div>
          </div>
          <div class="eb-message-box__btns">
            <eb-button
              v-if="showCancelButton"
              :loading="cancelButtonLoading"
              :size="buttonSize"
              :round="roundButton"
              @click="handleAction('cancel')"
            >
              {{ cancelButtonText }}
            </eb-button>
            <eb-button
              :type="confirmButtonClass || 'primary'"
              :loading="confirmButtonLoading"
              :size="buttonSize"
              :round="roundButton"
              @click="handleAction('confirm')"
            >
              {{ confirmButtonText }}
            </eb-button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * EbMsgbox 视图 — 命令式消息框渲染（由 msgbox/index.js vnode 管线挂载）
 * action 语义：confirm / cancel / close（distinguishCancelAndClose 区分后两者）
 */
import { computed, onMounted, ref, watch } from 'vue'
import EbIcon from '../../icon/index.vue'
import EbButton from '../../button/index.vue'
import EbInput from '../../input/index.vue'
import { useFocusTrap } from '../../../composables/useFocusTrap'
import { useLockScroll } from '../../../composables/useLockScroll'

defineOptions({ name: 'EbMsgboxView' })

const props = defineProps({
  mode: {
    type: String,
    default: 'alert',
    validator: (v) => ['alert', 'confirm', 'prompt'].includes(v),
  },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  type: {
    type: String,
    default: 'info',
    validator: (v) => ['success', 'warning', 'info', 'error'].includes(v),
  },
  html: { type: Boolean, default: false },
  showIcon: { type: Boolean, default: true },
  showClose: { type: Boolean, default: true },
  showCancelButton: { type: Boolean, default: false },
  distinguishCancelAndClose: { type: Boolean, default: false },
  confirmButtonText: { type: String, default: '确定' },
  cancelButtonText: { type: String, default: '取消' },
  confirmButtonLoading: { type: Boolean, default: false },
  cancelButtonLoading: { type: Boolean, default: false },
  confirmButtonClass: { type: String, default: 'primary' },
  buttonSize: { type: String, default: 'default' },
  roundButton: { type: Boolean, default: false },
  center: { type: Boolean, default: false },
  closeOnClickModal: { type: Boolean, default: true },
  closeOnPressEscape: { type: Boolean, default: true },
  lockScroll: { type: Boolean, default: false },
  zIndex: { type: Number, default: undefined },
  /** prompt 专属 */
  inputType: { type: String, default: 'text' },
  inputValue: { type: String, default: '' },
  inputPlaceholder: { type: String, default: '' },
  inputPattern: { type: RegExp, default: null },
  inputValidator: { type: Function, default: null },
  inputErrorMessage: { type: String, default: '' },
  /** 完成回调（action, value） */
  onDone: { type: Function, required: true },
  onDestroy: { type: Function, default: undefined },
})

const visible = ref(true)
const boxRef = ref(null)
const inputRef = ref(null)
const inputValue = ref(props.inputValue)
const inputError = ref('')

const iconName = computed(() => {
  const map = {
    success: 'circle-check-filled',
    warning: 'warning-filled',
    info: 'info-filled',
    error: 'circle-close-filled',
  }
  return map[props.type] ?? 'info-filled'
})

const typeClass = computed(() => `eb-message-box--${props.type}`)

const { activate, deactivate } = useFocusTrap(boxRef, {
  escapeDeactivates: true,
  onEscape: () => {
    if (props.closeOnPressEscape) {
      handleAction(props.distinguishCancelAndClose ? 'close' : 'cancel')
    }
  },
})

const { lock, unlock } = useLockScroll()

// prompt 模式校验
function validateInput() {
  if (props.mode !== 'prompt') return true
  const value = inputValue.value
  if (props.inputValidator) {
    const result = props.inputValidator(value)
    if (result === false) {
      inputError.value = props.inputErrorMessage || '输入的数据不合法!'
      return false
    }
    if (typeof result === 'string') {
      inputError.value = result
      return false
    }
  } else if (props.inputPattern && !props.inputPattern.test(value)) {
    inputError.value = props.inputErrorMessage || '输入的数据不合法!'
    return false
  }
  inputError.value = ''
  return true
}

function handleAction(action) {
  if (action === 'confirm') {
    if (!validateInput()) return
    finish('confirm', inputValue.value)
  } else if (action === 'cancel') {
    finish('cancel', inputValue.value)
  } else {
    // close（X / ESC / 遮罩）
    finish(props.distinguishCancelAndClose ? 'close' : 'cancel', inputValue.value)
  }
}

function handleEnter() {
  handleAction('confirm')
}

function handleOverlayClick(e) {
  if (!props.closeOnClickModal) return
  if (e.target === e.currentTarget) {
    handleAction(props.distinguishCancelAndClose ? 'close' : 'cancel')
  }
}

function finish(action, value) {
  visible.value = false
  props.onDone?.(action, value)
}

function handleAfterLeave() {
  props.onDestroy?.()
}

watch(
  () => props.inputValue,
  (v) => (inputValue.value = v)
)

onMounted(() => {
  if (props.lockScroll) lock()
  activate()
})

defineExpose({
  visible,
  handleAction,
  ref: boxRef,
})
</script>

<style src="./style.css"></style>
