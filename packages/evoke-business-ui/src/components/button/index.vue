<template>
  <button
    ref="btnRef"
    :class="[
      'eb-button',
      buttonSizeClass,
      typeClass,
      {
        'is-plain': plain,
        'is-round': round,
        'is-circle': circle,
        'is-text': text,
        'is-link': link,
        'is-disabled': disabled || loading,
        'is-loading': loading,
        'is-ghost': ghost,
        'is-danger-solid': dangerSolid && (type === 'danger' || $attrs.type === 'danger'),
        'has-fixed-width': loading,
        'is-icon-right': iconPosition === 'right',
      },
    ]"
    :type="nativeType"
    :disabled="disabled || loading"
    :autofocus="autofocus"
    :aria-disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="eb-button__loading-icon">
      <eb-icon :size="iconFontSize" name="loading" class="is-rotating" />
    </span>
    <eb-icon
      v-if="iconName && !loading"
      :name="iconName"
      :size="iconFontSize"
      class="eb-button__icon"
    />
    <component :is="icon" v-else-if="icon && !loading" class="eb-button__icon" />
    <template v-for="(_, name) in $slots" :key="name">
      <slot-bridge
        v-if="name === 'default'"
        :slot-fn="slots.default"
        :strip-icon="loading"
      />
      <slot v-else :name="name" />
    </template>
  </button>
</template>

<script>
/**
 * default 插槽转发桥（模块作用域）
 * loading 时移除插槽内前导的 eb-icon，由自带转圈图标取而代之，
 * 避免「转圈 + 原图标」并列；文本之后的尾部图标不受影响。
 * 必须定义在模块作用域：放进 <script setup> 会每次实例化生成新的组件
 * 定义，导致按钮内容反复重挂载。
 */
import { Comment, Text, defineComponent } from 'vue'
import EbIcon from '../icon/index.vue'

const isIconVNode = (vnode) => {
  if (vnode.type === EbIcon) return true
  const type = vnode.type
  if (typeof type === 'string' || type === null) return false
  const name = type?.name
  return name === 'EbIcon'
}

const isSkippableVNode = (vnode) =>
  vnode.type === Comment ||
  (vnode.type === Text && !String(vnode.children ?? '').trim())

const SlotBridge = defineComponent({
  name: 'EbButtonSlotBridge',
  props: {
    slotFn: { type: Function, required: true },
    stripIcon: { type: Boolean, default: false },
  },
  setup(props) {
    return () => {
      const raw = props.slotFn()
      const list = Array.isArray(raw) ? raw : [raw]
      if (!props.stripIcon) return list
      for (let i = 0; i < list.length; i++) {
        const vnode = list[i]
        if (isSkippableVNode(vnode)) continue
        if (isIconVNode(vnode)) return [...list.slice(0, i), ...list.slice(i + 1)]
        break
      }
      return list
    }
  },
})

export default { components: { SlotBridge } }
</script>

<script setup>
/**
 * EbButton — 按钮
 * Props：type/size/disabled/loading/plain/round/circle/text/link/icon/nativeType/autofocus/ghost/dangerSolid
 * ghost / danger-solid 通过 --eb-button-* 变量驱动
 */
import { ref, computed, useSlots, inject } from 'vue'
import EbIcon from '../icon/index.vue'
import { configProviderContextKey } from '../../composables/useConfigProvider'

const props = defineProps({
  type: {
    type: String,
    default: 'default',
    validator: (v) =>
      ['default', 'primary', 'success', 'warning', 'info', 'danger', 'text', ''].includes(v),
  },
  size: {
    type: String,
    default: 'default',
    validator: (v) => ['small', 'default', 'large', ''].includes(v),
  },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  plain: { type: Boolean, default: false },
  round: { type: Boolean, default: false },
  circle: { type: Boolean, default: false },
  text: { type: Boolean, default: false },
  link: { type: Boolean, default: false },
  icon: { type: [Object, String], default: undefined },
  nativeType: {
    type: String,
    default: 'button',
    validator: (v) => ['button', 'submit', 'reset'].includes(v),
  },
  autofocus: { type: Boolean, default: false },
  /** 幽灵按钮（透明底） */
  ghost: { type: Boolean, default: false },
  /** 危险实心（type=danger 时红色更实） */
  dangerSolid: { type: Boolean, default: false },
  /** 图标位置：left 文本左侧（默认）/ right 文本右侧（如「下一页 →」） */
  iconPosition: {
    type: String,
    default: 'left',
    validator: (v) => ['left', 'right'].includes(v),
  },
})

const emit = defineEmits(['click'])

const slots = useSlots()
const btnRef = ref(null)

// 未显式传 size 时继承 ConfigProvider 的全局 size
const configSize = inject(configProviderContextKey, null)?.size
const resolvedSize = computed(() => {
  if (props.size !== 'default') return props.size
  return configSize?.value || 'default'
})

const buttonSizeClass = computed(() =>
  resolvedSize.value === 'large' ? 'eb-button--large' : resolvedSize.value === 'small' ? 'eb-button--small' : ''
)

const typeClass = computed(() =>
  props.type && props.type !== 'default' ? `eb-button--${props.type}` : ''
)

const iconName = computed(() =>
  typeof props.icon === 'string' ? props.icon : null
)

const iconFontSize = computed(() =>
  resolvedSize.value === 'large' ? 16 : resolvedSize.value === 'small' ? 12 : 14
)

function handleClick(e) {
  if (props.disabled || props.loading) {
    e.preventDefault()
    return
  }
  emit('click', e)
}

defineExpose({
  ref: btnRef,
  focus: (...args) => btnRef.value?.focus?.(...args),
  blur: (...args) => btnRef.value?.blur?.(...args),
})
</script>

<style src="./style.css"></style>
