<template>
  <Teleport to="body">
    <Transition :name="TRANSITION_NAME" @after-enter="emit('opened')" @after-leave="emit('closed')">
      <div
        v-if="modelValue"
        ref="rootRef"
        class="et-backstage"
        role="dialog"
        aria-modal="true"
        :aria-label="title || '全屏页'"
        tabindex="-1"
      >
        <nav class="et-backstage__nav" :style="navStyle">
          <slot name="nav" />
        </nav>
        <div class="et-backstage__main">
          <header class="et-backstage__header">
            <span class="et-backstage__title">{{ title }}</span>
            <button
              type="button"
              class="et-backstage__close"
              aria-label="返回"
              @click="close"
            >
              <et-icon name="back" :size="ICON_SIZE" />
            </button>
          </header>
          <div class="et-backstage__content">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * EtBackstage — 全屏页骨架（tools-ui 计划 05 §四 L4 / 07 M3 交付物 3）
 *
 * 不引起画布尺寸跳动（M3 出口条件三）的三条结构保证：
 *   ① 覆盖层 position: fixed + inset 0（Teleport 到 body，不参与文档流）；
 *   ② 挂载点只留 Teleport 锚点注释（零尺寸），开/关都不占位；
 *   ③ 打开期间 documentElement 挂锁滚动 class（计数式，多实例最后一个
 *      卸载的才摘；scrollbar-gutter: stable 预留滚动条槽位，画布不横跳）。
 * 焦点陷阱 / Esc 收敛 / 焦点归还与 EtDialog 共用 useModalFocus（同一套契约）。
 * 过渡名走 TRANSITION_NAME 常量绑定（G2 图标名提取器会把过渡名的字面属性
 * 当图标名）。
 *
 * 契约要点：
 *   ① navWidth 为 Number（px）：给了走内联宽，缺省走 --eb-sidebar-width 令牌；
 *   ② 锁滚动计数在模块作用域（多实例叠加时只有最后一个个例摘 class）；
 *   ③ Esc / 返回钮都只 emit update:modelValue，关闭态由消费方掌握。
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import EtIcon from '../../icons/icon.vue'
import { lockRootScroll, unlockRootScroll } from './scroll-lock'
import { useModalFocus } from '../dialog/useModalFocus'

defineOptions({ name: 'EtBackstage' })

/** 过渡名（绑定而非字面量：G2 图标名提取器按字面 name 属性抽图标名） */
const TRANSITION_NAME = 'et-backstage'

/** 返回钮图标与尺寸档（16 见方；密度三档随 --et-icon-sm） */
const ICON_SIZE = 'var(--et-icon-sm)'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  /** 左导航宽（px）；null = 走 CSS 令牌默认档 */
  navWidth: { type: Number, default: null },
})

const emit = defineEmits(['update:modelValue', 'opened', 'closed'])

const rootRef = ref(null)
const modalFocus = useModalFocus(() => rootRef.value, { onEscape: close })

const navStyle = computed(() =>
  props.navWidth ? { width: `${props.navWidth}px` } : null,
)

// ─── 锁滚动（计数在 scroll-lock.js 模块作用域；locked 每实例一份）───
let locked = false

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      if (!locked) {
        locked = true
        lockRootScroll()
      }
      nextTick(() => modalFocus.activate())
    } else {
      modalFocus.deactivate()
      if (locked) {
        locked = false
        unlockRootScroll()
      }
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  // 卸载即视为关闭：摘锁（计数式交给其余实例）+ 摘键位监听
  modalFocus.deactivate()
  if (locked) {
    locked = false
    unlockRootScroll()
  }
})

function close() {
  emit('update:modelValue', false)
}
</script>

<style src="./style.css"></style>
