<template>
  <div class="ew-code-block">
    <div class="ew-code-block__titlebar">
      <span class="ew-code-block__lights" aria-hidden="true">
        <i class="ew-code-block__light is-red" />
        <i class="ew-code-block__light is-yellow" />
        <i class="ew-code-block__light is-green" />
      </span>
      <span v-if="title || $slots.title" class="ew-code-block__title">
        <slot name="title">{{ title }}</slot>
      </span>
      <button
        v-if="copyable"
        type="button"
        class="ew-code-block__copy"
        :class="{ 'is-copied': copied }"
        :aria-label="copied ? '已复制' : '复制'"
        @click="onCopy"
      >
        <EwIcon :name="copied ? 'check' : 'copy'" :size="14" />
        <span v-if="showCopyText" class="ew-code-block__copy-text">{{ copied ? 'Copied' : 'Copy' }}</span>
      </button>
    </div>
    <div class="ew-code-block__body">
      <span v-if="prefix" class="ew-code-block__prefix">{{ prefix }}</span>
      <code class="ew-code-block__code">
        <slot>{{ code }}</slot>
      </code>
    </div>
  </div>
</template>

<script setup>
/**
 * EwCodeBlock — 命令/代码块（macOS 窗框式终端语言）
 * 红绿灯标题栏 + 提示符前缀 + 一键复制（成功打勾反馈）；
 * 颜色全部走 --ew-* 语义令牌，明暗双主题自动跟随
 */
import EwIcon from '../icon/index.vue'
import { useCopy } from '../../composables/useCopy'

defineProps({
  /** 代码/命令文案（亦可用默认插槽承载高亮内容） */
  code: { type: String, default: '' },
  /** 提示符前缀（如 $） */
  prefix: { type: String, default: '' },
  title: { type: String, default: '' },
  /** 展示复制按钮（位于标题栏右侧） */
  copyable: { type: Boolean, default: true },
  /** 复制按钮带文字 */
  showCopyText: { type: Boolean, default: false },
})

const emit = defineEmits(['copy'])
const { copy, copied } = useCopy(2000)

async function onCopy(e) {
  const root = e.currentTarget.closest('.ew-code-block')
  const text = root?.querySelector('.ew-code-block__code')?.textContent?.trim() || ''
  const ok = await copy(text)
  if (ok) emit('copy', text)
}
</script>

<style src="./style.css"></style>
