<template>
  <div class="eb-layout">
    <!-- 侧边栏 -->
    <aside
      class="eb-layout__sidebar"
      :class="{ 'eb-layout__sidebar--collapsed': isCollapsed, 'eb-layout__sidebar--mobile-open': mobileMenuOpen }"
    >
      <slot name="sidebar-logo">
        <div class="eb-layout__logo">
          <div class="eb-layout__logo-mark">{{ logoText }}</div>
          <transition name="eb-layout__label-fade">
            <span v-show="!isCollapsed" class="eb-layout__logo-label">{{ title }}</span>
          </transition>
        </div>
      </slot>

      <eb-scrollbar class="eb-layout__sidebar-scroll">
        <eb-menu :default-active="activeMenu" :collapse="isCollapsed" router>
          <slot name="menu" />
        </eb-menu>
      </eb-scrollbar>

      <div class="eb-layout__sidebar-footer">
        <button type="button" class="eb-layout__collapse-btn" @click="toggleCollapse">
          <eb-icon :name="isCollapsed ? 'expand' : 'fold'" :size="18" />
          <transition name="eb-layout__label-fade">
            <span v-show="!isCollapsed">收起</span>
          </transition>
        </button>
      </div>
    </aside>

    <div class="eb-layout__overlay" @click="mobileMenuOpen = false" />

    <!-- 主区 -->
    <div class="eb-layout__main">
      <header class="eb-layout__topbar">
        <div class="eb-layout__topbar-left">
          <button type="button" class="eb-layout__mobile-btn" :aria-label="mobileMenuOpen ? '关闭菜单' : '打开菜单'" @click="mobileMenuOpen = !mobileMenuOpen">
            <eb-icon :name="mobileMenuOpen ? 'expand' : 'fold'" :size="20" />
          </button>
          <slot name="topbar-left">
            <eb-breadcrumb :items="[{ label: '首页', to: '/' }, { label: activeTitle }]" />
          </slot>
        </div>
        <div class="eb-layout__topbar-right">
          <slot name="theme-toggle">
            <button
              type="button"
              class="eb-layout__theme-btn"
              :title="isDark ? '切换为浅色模式' : '切换为深色模式'"
              :aria-label="isDark ? '切换为浅色模式' : '切换为深色模式'"
              @click="toggle"
            >
              <eb-icon :name="isDark ? 'sunny' : 'moon'" :size="18" />
            </button>
          </slot>
          <slot name="topbar-right" />
        </div>
      </header>

      <main class="eb-layout__content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
/**
 * EbAppLayout — 应用壳布局
 * 侧边栏（logo/菜单/折叠）+ 顶栏（移动端菜单钮/面包屑/主题切换）+ 内容区；
 * 主题切换默认渲染在顶栏右侧（theme-toggle 插槽可整体覆盖），避免收起展开时侧栏底部抖动。
 * 内部由本库的 EbScrollbar / EbMenu / EbIcon / EbBreadcrumb 组合而成。
 * 菜单 router 模式依赖外部 provide('router')（vue-router 注入）。
 */
import { ref, computed } from 'vue'
import EbIcon from '../icon/index.vue'
import EbScrollbar from '../scrollbar/index.vue'
import EbMenu from '../menu/index.vue'
import EbBreadcrumb from '../breadcrumb/index.vue'

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
