<template>
  <div class="demo-block vp-raw">
    <!-- 演示区 -->
    <div class="demo-block__preview">
      <!-- densities：同一演示在紧凑/默认/宽松三带并排（[data-density] 是普通属性选择器，
           局部生效，不需要切全站根属性） -->
      <template v-if="bands.length">
        <div v-for="b in bands" :key="b" class="demo-block__band" :data-density="b">
          <span class="demo-block__band-label">{{ BAND_ZH[b] }}</span>
          <div class="demo-block__band-body"><slot /></div>
        </div>
      </template>
      <slot v-else />
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
  /** true = 紧凑/默认/宽松三带并排；数组 = 指定档位子集 */
  densities: { type: [Boolean, Array], default: false },
})

const BAND_ZH = { compact: '紧凑 24', default: '默认 32', relaxed: '宽松 40' }
const bands = computed(() =>
  Array.isArray(props.densities)
    ? props.densities
    : props.densities
      ? ['compact', 'default', 'relaxed']
      : [],
)

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
