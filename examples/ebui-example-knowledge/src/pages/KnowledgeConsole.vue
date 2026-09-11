<template>
  <eb-app-layout
    title="云眠研发 · 知识库"
    logo-text="知"
    :collapsed="collapsed"
    @update:collapsed="collapsed = $event"
    :is-dark="isDark"
    @toggle="toggleDark"
    :active-menu="activeMenu"
    :active-title="activeTitle"
  >
    <template #menu>
      <eb-menu-item index="docs" @click="switchView('docs')">
        <eb-icon name="book" />
        <span>知识文档</span>
      </eb-menu-item>
      <eb-menu-item index="faq" @click="switchView('faq')">
        <eb-icon name="question-circle" />
        <span>问答库</span>
      </eb-menu-item>
      <eb-menu-item index="graph" @click="switchView('graph')">
        <eb-icon name="cluster" />
        <span>知识图谱</span>
      </eb-menu-item>
    </template>

    <template #topbar-right>
      <div class="kb-topbar">
        <eb-badge :value="3" :max="99">
          <eb-icon name="bell" :size="18" />
        </eb-badge>
        <eb-avatar :size="28">知</eb-avatar>
      </div>
    </template>

    <DocsCenter v-if="activeMenu === 'docs'" />
    <FaqBank v-else-if="activeMenu === 'faq'" />
    <KnowledgeGraph v-else-if="activeMenu === 'graph'" />
  </eb-app-layout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useDarkMode } from '@wil-works/evoke-business-ui'
import DocsCenter from './modules/DocsCenter.vue'
import FaqBank from './modules/FaqBank.vue'
import KnowledgeGraph from './modules/KnowledgeGraph.vue'

const { isDark, toggleDark } = useDarkMode()

const collapsed = ref(false)
const activeMenu = ref('docs')

const MENU_TITLES = { docs: '知识文档', faq: '问答库', graph: '知识图谱' }
const activeTitle = computed(() => MENU_TITLES[activeMenu.value] ?? '知识文档')

function switchView(index) {
  activeMenu.value = index
}
</script>

<style scoped>
.kb-topbar {
  display: flex;
  align-items: center;
  gap: 16px;
}
</style>
