<template>
  <eb-app-layout
    title="云眠研发 · 项目协作"
    logo-text="研"
    :collapsed="collapsed"
    @update:collapsed="collapsed = $event"
    :is-dark="isDark"
    @toggle="toggleDark"
    :active-menu="activeMenu"
    :active-title="activeTitle"
  >
    <template #menu>
      <eb-menu-item index="overview" @click="switchView('overview')">
        <eb-icon name="dashboard" />
        <span>项目总览</span>
      </eb-menu-item>
      <eb-menu-item index="plan" @click="switchView('plan')">
        <eb-icon name="hourglass" />
        <span>进度计划</span>
      </eb-menu-item>
      <eb-menu-item index="usage" @click="switchView('usage')">
        <eb-icon name="percentage" />
        <span>团队用量</span>
      </eb-menu-item>
    </template>

    <template #topbar-right>
      <div class="pj-topbar">
        <eb-badge :value="2" :max="99">
          <eb-icon name="bell" :size="18" />
        </eb-badge>
        <eb-avatar :size="28">研</eb-avatar>
      </div>
    </template>

    <ProjectsOverview v-if="activeMenu === 'overview'" @open-plan="openPlan" />
    <SprintPlan v-else-if="activeMenu === 'plan'" ref="planRef" />
    <TeamUsage v-else-if="activeMenu === 'usage'" />
  </eb-app-layout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useDarkMode } from '@wil-works/evoke-business-ui'
import ProjectsOverview from './modules/ProjectsOverview.vue'
import SprintPlan from './modules/SprintPlan.vue'
import TeamUsage from './modules/TeamUsage.vue'

const { isDark, toggleDark } = useDarkMode()

const collapsed = ref(false)
const activeMenu = ref('overview')
const planRef = ref(null)

const MENU_TITLES = { overview: '项目总览', plan: '进度计划', usage: '团队用量' }
const activeTitle = computed(() => MENU_TITLES[activeMenu.value] ?? '项目总览')

function switchView(index) {
  activeMenu.value = index
}

function openPlan(projectId) {
  activeMenu.value = 'plan'
  // 切到进度计划模块后，让内部选中对应项目
  requestAnimationFrame(() => planRef.value?.selectProject?.(projectId))
}
</script>

<style scoped>
.pj-topbar {
  display: flex;
  align-items: center;
  gap: 16px;
}
</style>
