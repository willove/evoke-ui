<template>
  <component
    :is="tag"
    ref="rootRef"
    class="ev-text"
    :class="[`ev-text--${typeClass}`, sizeClass, { 'is-truncated': truncated }]"
    :style="ellipsisStyle"
  >
    <mark v-if="mark" class="ev-text__mark"><slot /></mark>
    <code v-else-if="code" class="ev-text__code"><slot /></code>
    <del v-else-if="delete" class="ev-text__del"><slot /></del>
    <u v-else-if="underline"><slot /></u>
    <strong v-else-if="strong"><slot /></strong>
    <slot v-else />
    <span
      v-if="copyable"
      class="ev-typography__copy"
      role="button"
      tabindex="0"
      aria-label="复制"
      @click.stop="doCopy"
      @keydown.enter.prevent="doCopy"
    >
      <ev-icon name="file-copy" :size="14" />
    </span>
  </component>
</template>

<script setup>
/**
 * EvText — 文本（Typography 家族）
 * 语义配色 type + 行内语义标记（mark/code/delete/underline/strong）+
 * 复制（copyable）+ 截断（truncated 单行 / ellipsis 多行）
 */
import { computed, ref } from 'vue'
import { useSizeProp } from '../../composables/useFormItem'
import { useClipboard } from '../../composables/useClipboard'
import { EvMessage } from '../message'
import EvIcon from '../icon/index.vue'

const props = defineProps({
  type: {
    type: String,
    default: 'default',
    validator: (v) => ['primary', 'success', 'warning', 'info', 'danger', 'error', 'default'].includes(v),
  },
  size: useSizeProp,
  /** 单行截断（省略号） */
  truncated: { type: Boolean, default: false },
  /** 多行截断：true = 3 行，或 { rows: n } */
  ellipsis: { type: [Boolean, Object], default: false },
  /** 显示复制按钮（复制纯文本，自动剥离标记） */
  copyable: { type: Boolean, default: false },
  /** 复制内容，默认取组件文本 */
  copyText: { type: String, default: '' },
  /** 行内语义标记 */
  mark: { type: Boolean, default: false },
  code: { type: Boolean, default: false },
  underline: { type: Boolean, default: false },
  delete: { type: Boolean, default: false },
  strong: { type: Boolean, default: false },
  tag: { type: String, default: 'span' },
})

const emit = defineEmits(['copy'])

const typeClass = computed(() => (props.type === 'error' ? 'danger' : props.type))
const sizeClass = computed(() => (props.size && props.size !== 'default' ? `ev-text--${props.size}` : ''))

const rows = computed(() => {
  if (!props.ellipsis) return 0
  if (typeof props.ellipsis === 'object' && props.ellipsis.rows) return props.ellipsis.rows
  return 3
})
const ellipsisStyle = computed(() => {
  if (!rows.value) return undefined
  return {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: String(rows.value),
    overflow: 'hidden',
  }
})

const { copy } = useClipboard()
const rootRef = ref(null)

async function doCopy() {
  const text = props.copyText || getCurrentText()
  const ok = await copy(text)
  if (ok) EvMessage.success('已复制')
  emit('copy', ok, text)
}

function getCurrentText() {
  const root = rootRef?.$el ?? rootRef
  if (!root) return ''
  const clone = root.cloneNode(true)
  clone.querySelectorAll('.ev-typography__copy').forEach((n) => n.remove())
  return clone.textContent?.trim() ?? ''
}

defineExpose({ copy: doCopy })
</script>

<style src="./style.css"></style>
