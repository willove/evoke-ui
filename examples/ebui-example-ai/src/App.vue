<template>
  <div class="example-app">
    <header class="example-app__bar">
      <span class="example-app__title">Evoke Business UI · AI 运营助手示例</span>
      <eb-button size="small" @click="view = view === 'mock' ? 'rag' : 'mock'">
        {{ view === 'mock' ? '切到自研后端' : '切回 mock' }}
      </eb-button>
      <eb-button size="small" @click="toggleDark">
        {{ isDark ? '浅色模式' : '深色模式' }}
      </eb-button>
    </header>
    <main class="example-app__stage">
      <!-- 自研 RAG 后端示例：同一套组件换一个 transport，证明 UI 与后端解耦 -->
      <RagBackend v-if="view === 'rag'" />
      <AiWorkbench v-else />
    </main>
  </div>
</template>

<script setup>
import { useDarkMode } from '@wil-works/evoke-business-ui'
import AiWorkbench from './pages/AiWorkbench.vue'
import RagBackend from './pages/RagBackend.vue'
import { ref } from 'vue'

const { isDark, toggleDark } = useDarkMode()
// 两页共用同一套组件，差别只在 transport：mock 演示 vs 自研后端
const view = ref(import.meta.env.VITE_EXAMPLE_VIEW === 'rag' ? 'rag' : 'mock')
</script>

<style scoped>
.example-app {
  /* 顶栏 + 舞台用 flex 分配，不再写 calc(100vh - 45px) 这类魔法数 */
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--eb-bg-color-page, #f5f6f8);
}
.example-app__bar {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: var(--eb-bg-color);
  border-bottom: 1px solid var(--eb-border-color-light);
}
.example-app__title {
  font-size: 13px;
  color: var(--eb-text-color-secondary);
}
.example-app__stage {
  flex: 1;
  min-height: 0;
  /* 让应用壳填满舞台，而不是自己按 100vh 定高（否则整屏高度会多出顶栏那一段） */
  --eb-app-layout-height: 100%;
}
</style>
