<template>
  <div class="demo-block vp-raw">
    <!-- 演示区 -->
    <div class="demo-block__preview">
      <slot />
    </div>
    <!-- 源码区 -->
    <div v-if="code" class="demo-block__source">
      <div class="demo-block__toolbar">
        <button
          class="demo-block__toggle"
          :class="{ 'is-open': showCode }"
          type="button"
          @click="showCode = !showCode"
        >
          <span class="demo-block__toggle-icon" :class="{ 'is-open': showCode }"><Icon name="code" :size="13" /></span>
          {{ showCode ? '收起源码' : '查看源码' }}
        </button>
        <span class="demo-block__spacer" />
        <button class="demo-block__btn" type="button" @click="copyCode">
          <Icon name="copy" :size="13" />
          {{ copied ? '已复制' : '复制' }}
        </button>
      </div>
      <div v-show="showCode" class="demo-block__source-content">
        <pre class="demo-block__pre"><code v-html="highlighted" /></pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import hljs from 'highlight.js/lib/core'
import xml from 'highlight.js/lib/languages/xml'
import Icon from './Icon.vue'

hljs.registerLanguage('xml', xml)

const props = defineProps({
  code: { type: String, default: '' },
})

const showCode = ref(false)
const copied = ref(false)

const highlighted = computed(() => {
  if (!props.code) return ''
  // 还原 markdown 层可能带入的实体
  const code = props.code
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
  try {
    return hljs.highlight(code, { language: 'xml' }).value
  } catch {
    return code.replace(/[<>&]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[ch] ?? ch)
  }
})

async function copyCode() {
  if (!props.code) return
  const code = props.code
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
  try {
    await navigator.clipboard.writeText(code)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1500)
  } catch {
    /* 剪贴板不可用静默 */
  }
}
</script>
