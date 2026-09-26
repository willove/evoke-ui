<template>
  <Teleport to="body">
    <Transition :name="TRANSITION_NAME" @after-enter="emit('opened')" @after-leave="emit('closed')">
      <div v-if="modelValue" class="et-dialog__mask" @click.self="onMaskClick">
        <div
          ref="panelRef"
          class="et-dialog__panel"
          :style="panelStyle"
          role="dialog"
          aria-modal="true"
          :aria-label="title || '对话框'"
          tabindex="-1"
        >
          <header v-if="title" class="et-dialog__header">
            <span class="et-dialog__title">{{ title }}</span>
          </header>
          <div class="et-dialog__body">
            <slot />
          </div>
          <footer v-if="$slots.footer || confirmText || cancelText" class="et-dialog__footer">
            <slot name="footer">
              <button
                v-if="cancelText"
                type="button"
                class="et-dialog__btn"
                @click="onCancel"
              >
                {{ cancelText }}
              </button>
              <button
                v-if="confirmText"
                type="button"
                class="et-dialog__btn et-dialog__btn--confirm"
                @click="onConfirm"
              >
                {{ confirmText }}
              </button>
            </slot>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * EtDialog — 模态对话框（tools-ui 计划 05 §三 / 07 M3 交付物）
 *
 * Teleport 到 body：遮罩与面板同走 --et-z-modal（层级阶梯无 mask 档，面板在
 * 遮罩之后渲染，同档后者居上）。焦点陷阱 / Esc 收敛 / 焦点归还由
 * useModalFocus 经 runtime/focus/trap 纯函数实现，与 EtBackstage /
 * EtCommandPalette 同一套逻辑（M3 出口条件四）。过渡名走 TRANSITION_NAME
 * 常量绑定（G2 图标名提取器会把过渡名的字面属性当图标名）。
 *
 * 契约要点：
 *   ① confirm / cancel 点击后都关闭并 emit（执行体归消费方）；
 *   ② closeOnClickMask 只认点在遮罩自身（@click.self 已过滤面板冒泡）；
 *   ③ closeOnEsc=false 时 Esc 不收敛（焦点陷阱仍然生效）；
 *   ④ 打开后焦点落面板内第一个可聚焦元素，关闭后归还触发器。
 */
import { computed, nextTick, ref, watch } from 'vue'
import { useModalFocus } from './useModalFocus'

defineOptions({ name: 'EtDialog' })

/** 过渡名（绑定而非字面量：G2 图标名提取器按字面 name 属性抽图标名） */
const TRANSITION_NAME = 'et-dialog'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  width: { type: [String, Number], default: '520px' },
  closeOnClickMask: { type: Boolean, default: true },
  closeOnEsc: { type: Boolean, default: true },
  /** 给了才渲染对应钮；footer 槽整体接管时以槽为准 */
  confirmText: { type: String, default: '' },
  cancelText: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel', 'opened', 'closed'])

const panelRef = ref(null)
const modalFocus = useModalFocus(() => panelRef.value, {
  onEscape: () => {
    if (props.closeOnEsc) close()
  },
})

const panelStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
}))

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      // 等本轮渲染落地下一步再接管焦点（面板刚进 DOM）
      nextTick(() => modalFocus.activate())
    } else {
      modalFocus.deactivate()
    }
  },
  { immediate: true },
)

function close() {
  emit('update:modelValue', false)
}

function onMaskClick() {
  if (props.closeOnClickMask) close()
}

function onConfirm() {
  emit('confirm')
  close()
}

function onCancel() {
  emit('cancel')
  close()
}
</script>

<style src="./style.css"></style>
