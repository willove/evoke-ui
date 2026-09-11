<template>
  <div class="example-app">
    <header class="example-app__bar">
      <span class="example-app__title">Evoke Business UI · 报销与审批示例</span>
      <eb-button size="small" @click="toggleDark">
        {{ isDark ? '浅色模式' : '深色模式' }}
      </eb-button>
    </header>
    <main class="example-app__stage">
      <ApprovalConsole />
    </main>
  </div>
</template>

<script setup>
import { useDarkMode } from '@wil-works/evoke-business-ui'
import ApprovalConsole from './pages/ApprovalConsole.vue'

const { isDark, toggleDark } = useDarkMode()
</script>

<style scoped>
.example-app {
  min-height: 100vh;
  background: var(--eb-bg-color-page, #f5f6f8);
}
.example-app__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
  background: var(--eb-bg-color, #fff);
  border-bottom: 1px solid var(--eb-border-color-light, #e5e7eb);
}
.example-app__title {
  font-size: var(--eb-font-size-base, 14px);
  font-weight: var(--eb-font-weight-semibold, 600);
  color: var(--eb-text-color-primary, #1f2329);
}
.example-app__stage {
  padding: 16px;
}
</style>
