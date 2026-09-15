<template>
  <div class="adm" :class="`adm--${layoutMode}`">
    <!-- 顶部条：top-nav / mixed / mixed-double（logo + 一级横向菜单 + 动作区） -->
    <header v-if="hasTopMenu" class="adm-top">
      <div class="adm-logo" @click="router.push('/dashboard')">
        <span class="adm-logo__mark">E</span>
        <span class="adm-logo__text">{{ t('app.title') }}</span>
      </div>
      <eb-menu mode="horizontal" router :default-active="activeRoot" class="adm-top__menu">
        <eb-menu-item v-for="item in MENU" :key="item.key" :index="item.path">
          <eb-icon :name="item.icon" :size="15" />
          {{ t(item.title) }}
        </eb-menu-item>
      </eb-menu>
      <TopActions @search="paletteOpen = true" @settings="settingsOpen = true" />
    </header>

    <div class="adm-body">
      <!-- mixed-double：一级图标栏 -->
      <nav v-if="layoutMode === 'mixed-double'" class="adm-rail">
        <button
          v-for="item in MENU"
          :key="item.key"
          type="button"
          class="adm-rail__item"
          :class="{ 'is-active': item.path === activeRoot }"
          :title="t(item.title)"
          @click="router.push(item.path)"
        >
          <eb-icon :name="item.icon" :size="18" />
        </button>
      </nav>

      <!-- 经典侧边栏：logo + 全量树 + 折叠 -->
      <aside v-if="layoutMode === 'sidebar'" class="adm-aside adm-aside--tree" :class="{ 'is-collapsed': collapsed }">
        <div class="adm-aside__logo" @click="router.push('/dashboard')">
          <span class="adm-logo__mark">E</span>
          <span v-show="!collapsed" class="adm-logo__text">{{ t('app.title') }}</span>
        </div>
        <eb-scrollbar class="adm-aside__scroll">
          <eb-menu :collapse="collapsed" router :default-active="route.path" :unique-opened="false">
            <template v-for="item in MENU" :key="item.key">
              <eb-sub-menu v-if="item.children" :index="item.path">
                <template #title>
                  <eb-icon :name="item.icon" :size="16" />
                  <span>{{ t(item.title) }}</span>
                </template>
                <eb-menu-item v-for="child in item.children" :key="child.key" :index="child.path">
                  {{ t(child.title) }}
                </eb-menu-item>
              </eb-sub-menu>
              <eb-menu-item v-else :index="item.path">
                <eb-icon :name="item.icon" :size="16" />
                <span>{{ t(item.title) }}</span>
              </eb-menu-item>
            </template>
          </eb-menu>
        </eb-scrollbar>
        <button type="button" class="adm-aside__collapse" @click="collapsed = !collapsed">
          <eb-icon :name="collapsed ? 'expand' : 'fold'" :size="16" />
        </button>
      </aside>

      <!-- 双栏侧边栏：一级栏 + 二级栏 -->
      <template v-if="layoutMode === 'double-sidebar'">
        <aside class="adm-aside adm-aside--primary">
          <div class="adm-aside__logo" @click="router.push('/dashboard')">
            <span class="adm-logo__mark">E</span>
          </div>
          <eb-scrollbar class="adm-aside__scroll">
            <eb-menu router :default-active="activeRoot">
              <eb-menu-item v-for="item in MENU" :key="item.key" :index="item.path">
                <eb-icon :name="item.icon" :size="16" />
                <span>{{ t(item.title) }}</span>
              </eb-menu-item>
            </eb-menu>
          </eb-scrollbar>
        </aside>
        <aside v-if="activeChildren.length" class="adm-aside adm-aside--secondary">
          <p class="adm-aside__group">{{ t(activeRootItem.title) }}</p>
          <eb-scrollbar class="adm-aside__scroll">
            <eb-menu router :default-active="route.path">
              <eb-menu-item v-for="child in activeChildren" :key="child.key" :index="child.path">
                {{ t(child.title) }}
              </eb-menu-item>
            </eb-menu>
          </eb-scrollbar>
        </aside>
      </template>

      <!-- mixed / mixed-double：当前一级下的二级侧栏 -->
      <aside
        v-if="showSecondaryAside"
        class="adm-aside adm-aside--secondary"
      >
        <p class="adm-aside__group">{{ t(activeRootItem.title) }}</p>
        <eb-scrollbar class="adm-aside__scroll">
          <eb-menu router :default-active="route.path">
            <eb-menu-item v-for="child in activeChildren" :key="child.key" :index="child.path">
              {{ t(child.title) }}
            </eb-menu-item>
          </eb-menu>
        </eb-scrollbar>
      </aside>

      <!-- 主区 -->
      <div class="adm-main">
        <header v-if="!hasTopMenu" class="adm-topbar">
          <div class="adm-topbar__left">
            <eb-breadcrumb
              :items="
                route.path === activeRoot
                  ? [{ label: t(route.meta.titleKey || 'menu.dashboard') }]
                  : [
                      { label: t(activeRootItem?.title || 'menu.dashboard') },
                      { label: t(route.meta.titleKey || 'menu.dashboard') },
                    ]
              "
            />
          </div>
          <TopActions @search="paletteOpen = true" @settings="settingsOpen = true" />
        </header>

        <!-- 多标签页 -->
        <div class="adm-tabs" role="tablist">
          <button
            v-for="tab in tabs"
            :key="tab.path"
            type="button"
            class="adm-tabs__item"
            :class="{ 'is-active': tab.path === route.path }"
            role="tab"
            :aria-selected="tab.path === route.path"
            @click="router.push(tab.path)"
          >
            <span>{{ t(tab.titleKey) }}</span>
            <eb-icon
              v-if="tab.path !== '/dashboard'"
              class="adm-tabs__close"
              name="close"
              :size="12"
              @click.stop="closeTab(tab.path)"
            />
          </button>
        </div>

        <main class="adm-content">
          <router-view v-if="routerAlive" />
        </main>
      </div>
    </div>

    <!-- 全局搜索（Ctrl / ⌘ + K） -->
    <eb-command-palette v-model="paletteOpen" :commands="commands" :placeholder="t('bar.searchPlaceholder')" />

    <!-- 主题定制抽屉 -->
    <SettingsDrawer v-model="settingsOpen" />
  </div>
</template>

<script setup>
/**
 * AdminLayout — 五模式应用壳
 * sidebar 经典侧边栏 / double-sidebar 双栏侧边栏 / top-nav 顶部导航 /
 * mixed 混合（顶栏一级 + 侧栏二级）/ mixed-double 混合双栏（顶栏一级 + 图标栏 + 二级面板）。
 * 另承载：多标签页、Ctrl/⌘+K 全局搜索（EbCommandPalette）、通知入口、语言与明暗切换。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MENU } from '../routes'
import { useSettings } from '../settings'
import TopActions from './TopActions.vue'
import SettingsDrawer from './SettingsDrawer.vue'

const route = useRoute()
const router = useRouter()
const { t, layoutMode, locale, collapsed, toggleDark } = useSettings()

// ─── 布局派生 ───
const hasTopMenu = computed(() => ['top-nav', 'mixed', 'mixed-double'].includes(layoutMode.value))

const activeRoot = computed(() => route.meta.root || '/dashboard')
const activeRootItem = computed(() => MENU.find((m) => m.path === activeRoot.value) || MENU[0])
const activeChildren = computed(() => activeRootItem.value.children ?? [])
const showSecondaryAside = computed(
  () => ['mixed', 'mixed-double'].includes(layoutMode.value) && activeChildren.value.length > 0,
)

// ─── 多标签页 ───
const routerAlive = ref(true)
const tabs = ref([{ path: '/dashboard', titleKey: 'menu.dashboard' }])

watch(
  () => route.path,
  (path) => {
    if (path === '/' || path.startsWith('/redirect')) return
    if (!tabs.value.some((tab) => tab.path === path)) {
      tabs.value.push({ path, titleKey: route.meta.titleKey || 'menu.dashboard' })
    }
  },
  { immediate: true },
)

function closeTab(path) {
  const idx = tabs.value.findIndex((tab) => tab.path === path)
  if (idx < 0) return
  const [removed] = tabs.value.splice(idx, 1)
  if (removed.path === route.path && tabs.value.length) {
    const next = tabs.value[idx] ?? tabs.value[idx - 1]
    routerAlive.value = false
    router.push(next.path)
    // 下一个 tick 恢复渲染，保证同路径二次进入页面状态重置
    requestAnimationFrame(() => {
      routerAlive.value = true
    })
  }
}

// ─── 全局搜索（命令面板） ───
const paletteOpen = ref(false)
const settingsOpen = ref(false)

function onKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    paletteOpen.value = !paletteOpen.value
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

const commands = computed(() => {
  const pages = MENU.flatMap((item) => item.children ?? [item]).map((item) => ({
    id: `page:${item.path}`,
    label: t(item.title),
    group: t('search.groupPages'),
    icon: item.icon,
    run: () => router.push(item.path),
  }))
  const actions = [
    {
      id: 'action:dark',
      label: t('search.actionDark'),
      group: t('search.groupActions'),
      icon: 'moon',
      run: () => toggleDark(),
    },
    {
      id: 'action:lang',
      label: t('search.actionLang'),
      group: t('search.groupActions'),
      icon: 'translate',
      run: () => {
        locale.value = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN'
      },
    },
    {
      id: 'action:settings',
      label: t('search.actionSettings'),
      group: t('search.groupActions'),
      icon: 'palette',
      run: () => {
        settingsOpen.value = true
      },
    },
  ]
  return [...pages, ...actions]
})
</script>
