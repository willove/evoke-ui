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
  /** 开关 */
  modelValue: { type: Boolean, default: false },
  /** 标题（aria-label 取它，缺省「对话框」） */
  title: { type: String, default: '' },
  /** '520px' */
  width: { type: [String, Number], default: '520px' },
  /** 点遮罩关闭（只认遮罩自身，面板冒泡已过滤） */
  closeOnClickMask: { type: Boolean, default: true },
  /** Esc 收敛；false 时 Esc 不关（焦点陷阱仍生效） */
  closeOnEsc: { type: Boolean, default: true },
  /** 给了才渲染对应钮；footer 槽整体接管时以槽为准 */
  confirmText: { type: String, default: '' },
  /** 取消钮文案；给了才渲染 */
  cancelText: { type: String, default: '' },
})

const emit = defineEmits([
  'update:modelValue',
  /** 主按钮按下（本件不收自己，收起由 v-model 决定） */
  'confirm',
  /** 取消路径：取消钮 / 遮罩 / Esc 三条路共用同一出口 */
  'cancel',
  /** 进场动画结束（此刻读焦点位才准，陷阱已在挂载时就位） */
  'opened',
  /** 退场动画结束（焦点归还触发元素之后） */
  'closed',
])

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
