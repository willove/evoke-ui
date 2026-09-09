<template>
  <div class="ev-layout">
    <!-- 侧边栏 -->
    <aside
      class="ev-layout__sidebar"
      :class="{ 'ev-layout__sidebar--collapsed': isCollapsed, 'ev-layout__sidebar--mobile-open': mobileMenuOpen }"
    >
      <slot name="sidebar-logo">
        <div class="ev-layout__logo">
          <div class="ev-layout__logo-mark">{{ logoText }}</div>
          <transition name="ev-layout__label-fade">
            <span v-show="!isCollapsed" class="ev-layout__logo-label">{{ title }}</span>
          </transition>
        </div>
      </slot>

      <ev-scrollbar class="ev-layout__sidebar-scroll">
        <ev-menu :default-active="activeMenu" :collapse="isCollapsed" router>
          <slot name="menu" />
        </ev-menu>
      </ev-scrollbar>

      <div class="ev-layout__sidebar-footer">
        <slot name="theme-toggle">
          <div v-show="!isCollapsed" class="ev-layout__theme-toggle">
            <span class="ev-layout__toggle-label">
              <ev-icon :name="isDark ? 'moon' : 'sunny'" :size="14" />
              {{ isDark ? '深色' : '浅色' }}
            </span>
            <ev-switch :model-value="isDark" :inline-prompt="true" size="small" @change="toggle" />
          </div>
        </slot>
        <button type="button" class="ev-layout__collapse-btn" @click="toggleCollapse">
          <ev-icon :name="isCollapsed ? 'expand' : 'fold'" :size="18" />
          <span v-show="!isCollapsed">收起</span>
        </button>
      </div>
    </aside>

    <div class="ev-layout__overlay" @click="mobileMenuOpen = false" />

    <!-- 主区 -->
    <div class="ev-layout__main">
      <header class="ev-layout__topbar">
        <div class="ev-layout__topbar-left">
          <button type="button" class="ev-layout__mobile-btn" :aria-label="mobileMenuOpen ? '关闭菜单' : '打开菜单'" @click="mobileMenuOpen = !mobileMenuOpen">
            <ev-icon :name="mobileMenuOpen ? 'expand' : 'fold'" :size="20" />
          </button>
          <slot name="topbar-left">
            <ev-breadcrumb :items="[{ label: '首页', to: '/' }, { label: activeTitle }]" />
          </slot>
        </div>
        <div class="ev-layout__topbar-right">
          <slot name="topbar-right" />
        </div>
      </header>

      <main class="ev-layout__content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
/**
 * EvAppLayout — 应用壳布局
 * 侧边栏（logo/菜单/主题切换/折叠）+ 顶栏（移动端菜单钮/面包屑）+ 内容区；
 * 内部由本库的 EvScrollbar / EvMenu / EvSwitch / EvBreadcrumb / EvIcon 组合而成。
 * 菜单 router 模式依赖外部 provide('router')（vue-router 注入）。
 */
import { ref, computed } from 'vue'
import EvIcon from '../icon/index.vue'
import EvScrollbar from '../scrollbar/index.vue'
import EvMenu from '../menu/index.vue'
import EvSwitch from '../switch-comp/index.vue'
import EvBreadcrumb from '../breadcrumb/index.vue'

const props = defineProps({
  title: { type: String, default: 'Elements' },
  logoText: { type: String, default: 'E' },
  activeMenu: { type: String, default: '/' },
  activeTitle: { type: String, default: '首页' },
  isDark: { type: Boolean, default: false },
  collapsed: { type: Boolean, default: false },
})

const emit = defineEmits(['update:collapsed', 'toggle'])

// 受控折叠状态
const isCollapsed = computed({
  get: () => props.collapsed,
  set: (val) => emit('update:collapsed', val),
})

const mobileMenuOpen = ref(false)

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

function toggle() {
  emit('toggle')
}
</script>

<style src="./style.css"></style>
