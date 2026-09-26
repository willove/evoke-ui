<template>
  <!-- 密度是根属性：EtProvider 写 <html data-density>，运行时切档即时生效 -->
  <div class="density-stage">
    <eb-segmented v-model="density" :options="options" size="small" />
    <div class="density-stage__row">
      <et-tool-button size="large" icon="bold" label="加粗" />
      <et-tool-button size="small" icon="copy" tip="{ title: '复制', combo: 'mod+c' }" />
      <eb-button size="small">底座按钮</eb-button>
    </div>
    <p class="density-stage__note">当前 data-density = <code>{{ density }}</code>（大钮高 48 / 56 / 64 随档走）</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const density = ref('default')
const options = [
  { label: '紧凑', value: 'compact' },
  { label: '默认', value: 'default' },
  { label: '宽松', value: 'relaxed' },
]
</script>

<style scoped>
.density-stage { display: flex; flex-direction: column; gap: 12px; }
.density-stage__row { display: flex; align-items: center; gap: 16px; }
.density-stage__note { margin: 0; font-size: 12px; color: var(--eb-text-color-secondary); }
</style>
