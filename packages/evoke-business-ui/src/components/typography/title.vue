<template>
  <component :is="tag" ref="rootRef" class="ev-title" :class="[`ev-title--level-${level}`, { 'is-copyable': copyable }]">
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
  </component>
</template>

<script setup>
/**
 * EvTitle — 标题（Typography 家族）
 * level 1-5 对应排版刻度（32/24/20/16/14px），默认渲染语义标签 h1-h5；
 * 换行场景可用 tag="div" 保持视觉不变。copyable 追加复制按钮（useClipboard + 消息反馈）。
 */
import { computed, ref } from 'vue'
import { useClipboard } from '../../composables/useClipboard'
import { EvMessage } from '../message'
import EvIcon from '../icon/index.vue'

defineOptions({ name: 'EvTitle' })

const props = defineProps({
  /** 标题层级 1-5 */
  level: { type: Number, default: 1 },
  /** 渲染标签，默认按 level 映射 h1-h5 */
  tag: { type: String, default: undefined },
  /** 显示复制按钮 */
  copyable: { type: Boolean, default: false },
  /** 复制的内容，默认取组件文本 */
  copyText: { type: String, default: '' },
})

const emit = defineEmits(['copy'])

const { copy } = useClipboard()
const rootRef = ref(null)

const DEFAULT_TAG = { 1: 'h1', 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5' }
const tag = computed(() => props.tag || DEFAULT_TAG[props.level] || 'h1')

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
