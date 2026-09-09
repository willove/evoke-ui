<template>
  <p
    ref="rootRef"
    class="ev-paragraph"
    :class="{ 'is-ellipsis': isEllipsis, 'is-copyable': copyable }"
    :style="ellipsisStyle"
  >
    <slot />
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
  </p>
</template>

<script setup>
/**
 * EvParagraph — 段落（Typography 家族）
 * 多行截断：ellipsis 传 true（3 行）或 { rows: n }；
 * copyable 追加复制按钮。行高与段距消费排版令牌，中英文混排一致。
 */
import { computed, ref } from 'vue'
import { useClipboard } from '../../composables/useClipboard'
import { EvMessage } from '../message'
import EvIcon from '../icon/index.vue'

defineOptions({ name: 'EvParagraph' })

const props = defineProps({
  /** 截断开关：true = 3 行；或 { rows: n } 指定行数 */
  ellipsis: { type: [Boolean, Object], default: false },
  /** 显示复制按钮 */
  copyable: { type: Boolean, default: false },
  /** 复制的内容，默认取组件文本 */
  copyText: { type: String, default: '' },
  /** 间距：无默认段距（常用于紧凑布局） */
  spacing: { type: Boolean, default: true },
})

const emit = defineEmits(['copy'])

const { copy } = useClipboard()
const rootRef = ref(null)

const rows = computed(() => {
  if (!props.ellipsis) return 0
  if (typeof props.ellipsis === 'object' && props.ellipsis.rows) return props.ellipsis.rows
  return 3
})
const isEllipsis = computed(() => rows.value > 0)

const ellipsisStyle = computed(() => {
  if (!isEllipsis.value) return undefined
  return {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: String(rows.value),
    overflow: 'hidden',
  }
})

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
