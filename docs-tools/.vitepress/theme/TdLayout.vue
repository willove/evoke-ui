<template>
  <div class="td-layout" :class="{ 'td-layout--home': isHome }">
    <!-- 顶部开发中警示横幅（内测版：与 business 站同口径，随滚动滚走、顶栏吸顶） -->
    <div ref="devwarnRef" class="td-devwarn">
      项目正在快速迭代中，API 与视觉细节可能随版本调整，<strong>请勿用于生产环境</strong>。
    </div>

    <header class="td-header">
      <div class="td-header__inner">
        <a class="td-logo" href="/" @click.prevent="go('/')">
          <span class="td-logo__name">Evoke Tools UI</span>
          <span class="td-logo__version">v{{ version }}</span>
        </a>

        <nav class="td-nav">
          <a
            v-for="item in NAV_ITEMS"
            :key="item.key"
            :class="['td-nav__item', { 'is-active': isActive(item.path) }]"
            :href="item.path"
            :target="item.external ? '_blank' : undefined"
            :rel="item.external ? 'noopener' : undefined"
            @click="onNavClick(item, $event)"
          >
            <TdIcon :name="item.icon" :size="14" class="td-nav__icon" />
            <span>{{ item.label }}</span>
          </a>
        </nav>

        <div class="td-header__right">
          <button class="td-header__btn td-header__menu-btn" type="button" aria-label="菜单" @click="mobileOpen = !mobileOpen">
            <TdIcon :name="mobileOpen ? 'close' : 'menu'" :size="16" />
          </button>
          <div class="td-search">
            <TdIcon name="search" :size="14" class="td-search__icon" />
            <input
              v-model="keyword"
              class="td-search__input"
              type="text"
              placeholder="搜索页面..."
              autocomplete="off"
              @focus="searchOpen = true"
              @blur="onSearchBlur"
              @keydown.esc="searchOpen = false"
            >
            <transition name="td-pop">
              <ul v-if="searchOpen && keyword && results.length" class="td-search__results">
                <li v-for="r in results" :key="r.path">
                  <button type="button" class="td-search__result" @mousedown.prevent="go(r.path); keyword = ''">
                    <span class="td-search__result-name">{{ r.name }}</span>
                    <span class="td-search__result-zh">{{ r.category }}</span>
                  </button>
                </li>
              </ul>
            </transition>
          </div>
          <button class="td-header__btn" type="button" :aria-label="isDark ? '切换到浅色' : '切换到深色'" @click="toggleDark">
            <TdIcon :name="isDark ? 'sun' : 'moon'" :size="16" />
          </button>
        </div>
      </div>
    </header>

    <!-- 移动端遮罩 -->
    <div v-if="mobileOpen" class="td-sidebar-mask" @click="mobileOpen = false" />

    <div class="td-body">
      <aside class="td-sidebar" :class="[{ 'is-open': mobileOpen }, { 'is-home': isHome }]">
        <input v-if="!isHome" v-model="filter" class="td-sidebar__filter" type="text" placeholder="筛选页面" autocomplete="off">
        <nav class="td-sidebar__nav">
          <div class="td-sidebar__group">
            <div class="td-sidebar__group-title">导航</div>
            <a
              v-for="item in navForSidebar"
              :key="item.path"
              :class="['td-sidebar__link', { 'is-active': isActive(item.path) }]"
              :href="item.path"
              @click.prevent="go(item.path); mobileOpen = false"
            >{{ item.label }}</a>
          </div>
          <template v-if="!isHome">
            <div v-for="cat in visibleGroups" :key="cat.key" class="td-sidebar__group">
              <div class="td-sidebar__group-title">{{ cat.name }}</div>
              <a
                v-for="item in cat.components"
                :key="item.path"
                :class="['td-sidebar__link', { 'is-active': isActive(item.path) }]"
                :href="item.path"
                @click.prevent="go(item.path); mobileOpen = false"
              >{{ item.name }}<span v-if="item.suffix" class="td-sidebar__link-en">{{ item.suffix }}</span></a>
            </div>
            <div v-if="!visibleGroups.length" class="td-sidebar__empty">无匹配页面</div>
          </template>
        </nav>
      </aside>

      <main class="td-content" :class="{ 'is-home': isHome }">
        <article v-if="!isHome" class="td-doc">
          <Content />
        </article>
        <Content v-else />
      </main>
    </div>
  </div>
</template>

<script setup>
/**
 * tools 文档站外壳（移植自 business 站 DocLayout 的同构实现）
 *
 * 家族一致性是本件的全部目的：devwarn 警示条 + logo/版本顶栏 + 图标导航 + 站内搜索 +
 * 定制侧栏（导航组 + L1–L4 组件组 + 图标机制）——与 evoke-business-ui 文档站同一套皮。
 * 版本来自 meta.js（读 package.json），顶栏展示点不会与 npm 包版本漂移。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue'
import { useRoute, useRouter, useData, Content } from 'vitepress'
import TdIcon from './Icon.vue'
import { BRAND, NAV_ITEMS, GUIDE_NAV_ITEMS, SIDEBAR_GROUPS, SEARCH_INDEX } from './meta.js'

const route = useRoute()
const router = useRouter()
const { theme } = useData()

/** 版本展示点（themeConfig.toolsVersion，构建期读 package.json；VitePress 1.x 经 useData().theme 取） */
const version = theme.value?.toolsVersion ?? ''
const isDark = ref(false)
const mobileOpen = ref(false)
const keyword = ref('')
const searchOpen = ref(true)
const filter = ref('')

const isHome = computed(() => route.path === '/' || route.path === '/index.html')
const isGuide = computed(() => route.path.startsWith('/guide'))

// 横幅实测高度回写 CSS 变量（顶栏吸顶偏移量，替代硬编码）
const devwarnRef = ref(null)
function syncDevwarnHeight() {
  const el = devwarnRef.value
  if (el) document.documentElement.style.setProperty('--td-devwarn-h', `${el.offsetHeight}px`)
}

onMounted(() => {
  syncDevwarnHeight()
  window.addEventListener('resize', syncDevwarnHeight)
  isDark.value = document.documentElement.classList.contains('dark')
  watch(
    () => document.documentElement.classList.contains('dark'),
    (v) => { isDark.value = v },
  )
})
onBeforeUnmount(() => window.removeEventListener('resize', syncDevwarnHeight))

function go(path) {
  router.go(path)
  mobileOpen.value = false
}

function onNavClick(item, e) {
  if (item.external) return
  e.preventDefault()
  go(item.path)
}

function onSearchBlur() {
  setTimeout(() => { searchOpen.value = false }, 120)
}

const results = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return []
  return SEARCH_INDEX.filter((i) => i.name.toLowerCase().includes(kw) || i.path.includes(kw)).slice(0, 8)
})

const navForSidebar = computed(() => GUIDE_NAV_ITEMS)

/** 侧栏分组：首页只留导航组；其余页按筛选词过滤 */
const visibleGroups = computed(() => {
  const kw = filter.value.trim().toLowerCase()
  if (!kw) return SIDEBAR_GROUPS
  return SIDEBAR_GROUPS.map((g) => ({
    ...g,
    components: g.components.filter((c) => c.name.toLowerCase().includes(kw) || c.path.includes(kw)),
  })).filter((g) => g.components.length)
})

function isActive(path) {
  const p = route.path.replace(/\.html$/, '')
  return p === path || p.startsWith(`${path}/`) || p.startsWith(`${path}.html`)
}

function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  try { localStorage.setItem('vitepress-theme-appearance', isDark.value ? 'dark' : 'light') } catch { /* 隐私模式忽略 */ }
}
</script>

<style scoped>
.td-header__menu-btn { display: none; }
@media (max-width: 720px) {
  .td-header__menu-btn { display: inline-flex; }
}
</style>
