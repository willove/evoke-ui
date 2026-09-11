<template>
  <eb-app-layout
    title="云眠研发 · 报销与审批"
    logo-text="财"
    :collapsed="collapsed"
    @update:collapsed="collapsed = $event"
    :is-dark="isDark"
    @toggle="toggleDark"
    :active-menu="activeMenu"
    :active-title="activeTitle"
  >
    <template #menu>
      <eb-menu-item index="mine" @click="switchView('mine')">
        <eb-icon name="file-text" />
        <span>我的申请</span>
      </eb-menu-item>
      <eb-menu-item index="approve" @click="switchView('approve')">
        <eb-icon name="audit" />
        <span>审批中心（{{ approveQueue.length }}）</span>
      </eb-menu-item>
    </template>

    <template #topbar-right>
      <div class="ap-topbar">
        <eb-badge :value="approveQueue.length" :max="99">
          <eb-icon name="bell" :size="18" />
        </eb-badge>
        <eb-avatar :size="28">林</eb-avatar>
      </div>
    </template>

    <MyExpenses v-if="activeMenu === 'mine'" @create="onCreated" />
    <ApproveCenter v-else-if="activeMenu === 'approve'" />
  </eb-app-layout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useDarkMode } from '@wil-works/evoke-business-ui'
import MyExpenses from './modules/MyExpenses.vue'
import ApproveCenter from './modules/ApproveCenter.vue'
import { approveQueue } from './mock.js'

const { isDark, toggleDark } = useDarkMode()

const collapsed = ref(false)
const activeMenu = ref('mine')

const MENU_TITLES = { mine: '我的申请', approve: '审批中心' }
const activeTitle = computed(() => MENU_TITLES[activeMenu.value] ?? '我的申请')

function switchView(index) {
  activeMenu.value = index
}

/** 新申请提交后，审批中心队列同步增加（登录人为部门经理视角的演示简化） */
function onCreated(app) {
  approveQueue.unshift({
    id: app.id + 1000,
    no: app.no,
    type: app.type,
    amount: app.amount,
    applicant: app.applicant,
    dept: app.dept,
    submittedAt: app.submittedAt,
    remark: app.remark,
    items: app.items,
    flow: app.flow,
  })
}
</script>

<style scoped>
.ap-topbar {
  display: flex;
  align-items: center;
  gap: 16px;
}
</style>
