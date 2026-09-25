<script setup>
/**
 * EtTooltip ── 工具界面文字提示（tools-ui 计划 05 §三；business-ui 同名件的密度适配包装）
 *
 * 底座 EbTooltip 只做浮层定位与显隐，本件做两件产品级改造，不改其既有语义：
 *   1. 默认延迟改为工具界面口径：showAfter 默认 400、hideAfter 默认 200
 *      —— 与 --et-screentip-delay-first（400ms）/ --et-screentip-delay-hide（200ms）
 *      同源（ScreenTip 延迟契约）；调用方可显式覆盖
 *   2. 给浮层注入 et-tooltip：底座 popper 容器类是固定的、且 EbTooltip 透传的
 *      popper-class 会整体覆盖底座类数组（探针实测）——故这里把底座必需结构类
 *      （eb-tooltip__popper / is-{effect} / eb-tooltip，暗色与箭头样式靠它们）
 *      一并带上再拼 et-tooltip，做到「合并而非覆盖」
 *
 * props/events/slots 全透传：$attrs 剔除 popper-class（由本件接管）后整体下传，
 * content 与 #content 插槽、placement/effect/trigger 等随之透传。
 */
import { computed, useAttrs } from 'vue'
import EbTooltip from '@wil-works/evoke-business-ui/tooltip'

defineOptions({ name: 'EtTooltip', inheritAttrs: false })

const props = defineProps({
  content: { type: String, default: '' },
  placement: {
    type: String,
    default: 'top',
    validator: (v) =>
      [
        'top', 'bottom', 'left', 'right',
        'top-start', 'top-end', 'bottom-start', 'bottom-end',
        'left-start', 'left-end', 'right-start', 'right-end',
      ].includes(v),
  },
  disabled: { type: Boolean, default: false },
  effect: { type: String, default: 'dark', validator: (v) => ['dark', 'light'].includes(v) },
  /** 工具界面首显延迟（与 --et-screentip-delay-first 同源：400ms） */
  showAfter: { type: Number, default: 400 },
  /** 自动隐藏延迟（与 --et-screentip-delay-hide 同源：200ms） */
  hideAfter: { type: Number, default: 200 },
  trigger: {
    type: String,
    default: 'hover',
    validator: (v) => ['hover', 'click', 'focus', 'contextmenu'].includes(v),
  },
  virtualTriggering: { type: Boolean, default: false },
  virtualRef: { type: Object, default: null },
})

const attrs = useAttrs()

// popper-class 由本件接管，从透传属性中剔除（模板 kebab 与 camel 两种键都剔），避免与下方显式绑定重复
const restAttrs = computed(() => {
  const copy = {}
  for (const key in attrs) {
    if (key !== 'popperClass' && key !== 'popper-class') copy[key] = attrs[key]
  }
  return copy
})

// 调用方追加的 popper-class（模板里既可能写 kebab 也可能写 camel 键）
const callerPopperClass = computed(() => attrs['popper-class'] ?? attrs.popperClass)

// 合并 popper-class：保底座结构类（暗色/箭头/盒模型靠它们）+ et-tooltip + 调用方追加值
const mergedPopperClass = computed(() => [
  'eb-tooltip__popper',
  `is-${props.effect}`,
  'eb-tooltip',
  'et-tooltip',
  callerPopperClass.value,
])
</script>

<template>
  <eb-tooltip
    v-bind="restAttrs"
    :content="content"
    :placement="placement"
    :disabled="disabled"
    :effect="effect"
    :show-after="showAfter"
    :hide-after="hideAfter"
    :trigger="trigger"
    :virtual-triggering="virtualTriggering"
    :virtual-ref="virtualRef"
    :popper-class="mergedPopperClass"
  >
    <template v-for="(_, SlotName) in $slots" #[SlotName]="slotProps">
      <slot :name="SlotName" v-bind="slotProps || {}" />
    </template>
  </eb-tooltip>
</template>

<style src="./style.css"></style>
