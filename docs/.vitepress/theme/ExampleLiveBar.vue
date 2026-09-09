<template>
  <header class="example-live__bar">
    <a class="example-live__back" href="/examples/" @click.prevent="go('/examples/')">
      <Icon name="back" :size="14" />
      返回文档站
    </a>
    <div class="example-live__divider" />
    <span class="example-live__brand">
      <Icon name="layers" :size="14" />
      示例中心
    </span>
    <div class="example-live__switch">
      <ev-segmented :model-value="current" :options="options" size="small" @change="onChange" />
    </div>
    <span class="example-live__spacer" />
    <button
      class="example-live__dark"
      type="button"
      :aria-label="isDark ? '切换到浅色' : '切换到深色'"
      @click="toggleDark"
    >
      <Icon :name="isDark ? 'sun' : 'moon'" :size="15" />
    </button>
  </header>
</template>

<script setup>
/**
 * 示例子站点微型顶栏 —— /examples/live/* 专用。
 * 左侧返回文档站，中间用 ev-segmented 在各示例间切换（SPA 导航，不整页刷新），
 * 右侧暗色切换与文档站共用 localStorage 'bd-dark'（DocLayout 挂载时会读取应用）。
 */
import { onMounted, ref } from 'vue'
import { useRouter } from 'vitepress'
import Icon from './Icon.vue'
import { LIVE_EXAMPLES } from './meta.js'

const props = defineProps({
  current: { type: String, default: '' },
})

const router = useRouter()

const options = LIVE_EXAMPLES.map((e) => ({ label: e.name, value: e.key }))

const isDark = ref(false)
onMounted(() => {
  // 与 DocLayout 共用 bd-dark 存储（html.dark 类由 DocLayout 挂载时统一应用）
  try {
    isDark.value = localStorage.getItem('bd-dark') === '1'
  } catch {
    isDark.value = false
  }
})

function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  try {
    localStorage.setItem('bd-dark', isDark.value ? '1' : '0')
  } catch {
    /* 隐私模式静默 */
  }
}

function onChange(key) {
  const target = LIVE_EXAMPLES.find((e) => e.key === key)
  if (target && target.key !== props.current) go(target.path)
}

function go(path) {
  router.go(path)
}
</script>
