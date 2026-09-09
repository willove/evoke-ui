<template>
  <div class="example-app">
    <header class="example-app__bar">
      <span class="example-app__title">Evoke Business UI · 会员管理 CRUD 示例</span>
      <ev-button size="small" @click="toggleDark">
        {{ isDark ? '浅色模式' : '深色模式' }}
      </ev-button>
    </header>
    <main class="example-app__stage">
      <MemberListPage />
    </main>
  </div>
</template>

<script setup>
import { useDarkMode } from '@wil-works/evoke-business-ui'
import MemberListPage from './pages/MemberListPage.vue'

const { isDark, toggleDark } = useDarkMode()
</script>

<style scoped>
.example-app {
  min-height: 100vh;
  background: var(--ev-bg-color-page, #f5f6f8);
}
.example-app__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
  background: var(--ev-bg-color, #fff);
  border-bottom: 1px solid var(--ev-border-color-light, #e5e7eb);
}
.example-app__title {
  font-size: var(--ev-font-size-md, 14px);
  font-weight: var(--ev-font-weight-semibold, 600);
  color: var(--ev-text-color-primary, #1f2329);
}
.example-app__stage {
  padding: 16px;
}
</style>
