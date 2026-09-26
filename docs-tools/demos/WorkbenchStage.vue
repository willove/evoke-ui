<template>
  <!-- 工作台装配：区域槽 + 停靠（stack 并列 + #panel 内容槽）+ 状态栏 -->
  <div class="wb-stage">
    <et-title-bar title="文档站演示" doc-title="报表.xlsx" />
    <et-workbench v-model:layout="layout" :default-layout="DEFAULT" persist-key="docs-wb">
      <template #toolbar>
        <div class="wb-stage__toolbar">
          <et-tool-button size="small" icon="bold" label="加粗" />
          <et-tool-button size="small" icon="copy" label="复制" />
        </div>
      </template>
      <template #panel="{ panel }">
        <ul class="wb-stage__list">
          <li v-for="n in 3" :key="n">{{ panel.title }} {{ n }}</li>
        </ul>
      </template>
      <main class="wb-stage__canvas">画布区（产品内容）</main>
      <template #statusbar>
        <et-status-bar :items="[{ key: 'ready', label: '就绪' }]" zoom="100%" />
      </template>
    </et-workbench>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const DEFAULT = {
  docks: [
    {
      id: 'left',
      side: 'left',
      panels: [
        { id: 'files', title: '文件', size: 160 },
        { id: 'search', title: '搜索', size: 160 },
      ],
    },
  ],
  maximized: null,
}
const layout = ref(JSON.parse(JSON.stringify(DEFAULT)))
</script>

<style scoped>
.wb-stage { height: 320px; display: flex; flex-direction: column; border: 1px solid var(--eb-border-color-lighter); border-radius: 4px; overflow: hidden; }
.wb-stage :deep(.et-workbench) { height: 100%; }
.wb-stage__toolbar { display: flex; gap: 8px; align-items: center; height: var(--et-chrome-toolarea-height); padding: 0 var(--et-space-band-inline); background: var(--et-chrome-bg); }
.wb-stage__canvas { height: 100%; display: flex; align-items: center; justify-content: center; color: var(--eb-text-color-secondary); background: var(--eb-bg-color); }
.wb-stage__list { margin: 0; padding: var(--et-space-inline) var(--et-space-band-inline); list-style: none; font-size: var(--et-density-base-font); }
</style>
