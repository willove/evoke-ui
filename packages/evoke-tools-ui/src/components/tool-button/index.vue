<template>
  <component :is="tipHost" v-bind="tipHostProps">
    <button
      class="et-toolbtn et-toolbtn"
      :class="rootClass"
      type="button"
      :disabled="disabled"
      :aria-label="label || undefined"
      :aria-pressed="active ? 'true' : undefined"
      @click="handleClick"
    >
      <!-- large：固定方形图标盒（04 §三 硬规则 1）；small：只渲染图标，按钮自身即盒 -->
      <span v-if="icon && size === 'large'" class="et-toolbtn__icon et-icon-box">
        <et-icon :name="iconName" />
      </span>
      <et-icon v-else-if="icon" :name="iconName" />
      <span v-if="hasCaption" class="et-toolbtn__caption">
        <span v-if="label" class="et-toolbtn__text">{{ label }}</span>
        <span v-if="caret" class="et-toolbtn__caret">
          <et-icon name="arrow-down" />
        </span>
      </span>
    </button>
  </component>
</template>

<script setup>
/**
 * EtToolButton — 工具区按钮（tools-ui 计划 05 §四，M0 原子件）
 *
 * 两种形态（上一代实测：同组内「有图标的 56×57 大钮」与「无图标纯文字钮」混排，
 * 视觉高低不齐 —— 本件两种形态都由同一套令牌驱动，尺寸天然齐次）：
 *   large（默认）：图标行（--et-toolbtn-icon-box 固定方形盒）+ caption 行，
 *     整体 --et-size-toolbtn-large 见方；图标缺省兜底由 EtIcon 负责（04 §四）。
 *   small：只渲染图标（--et-icon-sm），整体 --et-size-toolbtn-small 见方，
 *     tip 提供时用 EtScreenTip 包裹（替代 title 的富提示）。
 *
 * 密度纪律（03 §3.1）：尺寸/字号全部走令牌，本件不出现任何 px 字面量；
 * size prop 只切形态（图标行+文案 / 纯图标），不实现密度分支。
 */
import { computed, defineComponent } from 'vue'
import EtIcon from '../../icons/icon.vue'
import EtScreenTip from '../screen-tip/index.vue'

defineOptions({ name: 'EtToolButton' })

const props = defineProps({
  /** 形态：large = 图标行 + caption 大钮；small = 图标 + ScreenTip 小钮 */
  size: {
    type: String,
    default: 'large',
    validator: (v) => ['large', 'small'].includes(v),
  },
  /** 图标名：第 ② 层组件语义名或第 ③ 层领域名（交给 EtIcon 解析与兜底） */
  icon: { type: String, default: '' },
  /** large = caption 文本；small = 可访问名来源（按钮文案 ≤4 字） */
  label: { type: String, default: '' },
  /** 命令激活/选中态（aria-pressed） */
  active: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  /** 「按钮+下拉」形态的下拉指示，渲染在 caption 行右侧 */
  caret: { type: Boolean, default: false },
  /** small 钮的 ScreenTip：字符串 = 标题；对象 = { title, desc?, combo? } */
  tip: { type: [String, Object], default: null },
})

const emit = defineEmits(['click'])

// 与 EbButton 同范式：经 computed 中转，模板里不直写 prop 名
const iconName = computed(() => props.icon)

const rootClass = computed(() => [
  `et-toolbtn--${props.size}`,
  { 'is-active': props.active, 'is-disabled': props.disabled },
])

// large 才有 caption 行；无文案无下拉指示时 caption 整体不渲染
// （否则空 caption 会平白多占一个 --et-toolbtn-gap 的行内间距）
const hasCaption = computed(() => props.size === 'large' && (props.label !== '' || props.caret))

/**
 * 提示包裹器：有 tip 走 EtScreenTip，无 tip 走直通件。
 * 直通件不能省——EtToolGroup 的控件行是 flex 行，多包一层 DOM 就多一个
 * flex item，条目间距与对齐都会漂。
 * 两个约束写在这里：
 * ① 必须返回**单个** vnode。slots.default() 是数组，直接 return 会让本件
 *    根节点退化成 Fragment——消费方的 class / data-* 透传会被 Vue 丢弃；
 * ② 定义虽在 setup 作用域，但只有经 computed 暴露给模板：同一实例内 tipHost
 *    的取值被缓存（底座 EbButton 的 SlotBridge 把"别每次渲染换组件定义"的
 *    纪律记在模块作用域，这里用同一个不变量换更少的样板）。
 */
const SlotPassthrough = defineComponent({
  name: 'EtToolButtonSlot',
  setup(_, { slots }) {
    return () => {
      const nodes = slots.default ? slots.default() : []
      return nodes.length === 1 ? nodes[0] : nodes
    }
  },
})

const tipHost = computed(() => (props.tip ? EtScreenTip : SlotPassthrough))

// tip 形态 → ScreenTip 的三个独立 prop（title 必填；desc/combo 缺省为空串）
const tipHostProps = computed(() => {
  const t = props.tip
  if (!t) return {}
  if (typeof t === 'string') return { title: t }
  return { title: t.title ?? '', desc: t.desc ?? '', combo: t.combo ?? '' }
})

/** 点击冒泡命令事件；disabled 有原生属性兜底，这里双保险（与 EbButton 同范式） */
function handleClick(e) {
  if (props.disabled) {
    e.preventDefault()
    return
  }
  emit('click', e)
}
</script>

<style src="./style.css"></style>
