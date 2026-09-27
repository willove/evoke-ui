<template>
  <div class="td-layout" :class="{ 'td-layout--home': isHome }">
    <!-- 顶栏 -->
    <!-- 顶部开发中警示横幅：fixed 永驻吸顶，高度由实测回写（窄屏换行不截断） -->
    <div class="td-devwarn">
      项目正在快速迭代中，API 与视觉细节可能随版本调整，<strong>请勿用于生产环境</strong>。
    </div>

    <header class="td-header">
      <div class="td-header__inner">
        <a class="td-logo" href="/" @click.prevent="go('/')">
          <span class="td-logo__name">Evoke Tools UI</span>
          <span class="td-logo__version">{{ version }}</span>
        </a>

        <nav class="td-nav">
          <template v-for="item in navItems" :key="item.key">
            <div v-if="item.children" class="td-nav__group">
              <button type="button" class="td-nav__item td-nav__trigger">
                <TdIcon :name="item.icon" :size="14" class="td-nav__icon" />
                <span>{{ item.label }}</span>
                <TdIcon name="chevron-down" :size="13" class="td-nav__caret" />
              </button>
              <div class="td-nav__panel">
                <a
                  v-for="c in item.children"
                  :key="c.path"
                  class="td-nav__panel-item"
                  :href="c.path"
                  target="_blank"
                  rel="noopener"
                >
                  <TdIcon name="external-link" :size="13" class="td-nav__panel-icon" />
                  {{ c.label }}
                </a>
              </div>
            </div>
            <a
              v-else
              :class="['td-nav__item', { 'is-active': item.active }]"
              :href="item.external ? item.path : '#'"
              :target="item.external ? '_blank' : undefined"
              :rel="item.external ? 'noopener' : undefined"
              @click="onNavClick(item, $event)"
            >
              <TdIcon :name="item.icon" :size="14" class="td-nav__icon" />
              <span>{{ item.label }}</span>
            </a>
          </template>
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
                    <span class="td-search__result-zh">{{ r.zh || r.name }} · {{ r.category }}</span>
                  </button>
                </li>
              </ul>
            </transition>
          </div>
          <a
            class="td-header__btn td-header__download"
            href="https://www.npmjs.com/package/@wil-works/evoke-tools-ui"
            target="_blank"
            rel="noopener"
            aria-label="在 npm 上查看"
            title="在 npm 上查看"
          >
            <!-- npm 标（Remix Logos/npmjs-line）：跳到包页的语义 -->
            <TdIcon name="npmjs" :size="16" />
          </a>
          <button class="td-header__btn" type="button" :aria-label="isDark ? '切换到浅色' : '切换到深色'" @click="toggleDark">
            <TdIcon :name="isDark ? 'sun' : 'moon'" :size="16" />
          </button>
        </div>
      </div>
    </header>

    <!-- 移动端遮罩 -->
    <div v-if="mobileOpen" class="td-sidebar-mask" @click="mobileOpen = false" />

    <!-- 主体 -->
    <div class="td-body">
      <!-- 侧栏：窄屏抽屉承载主导航（首页也要能打开），非首页再追加目录 -->
      <aside class="td-sidebar" :class="[{ 'is-open': mobileOpen }, { 'is-home': isHome }]">
        <input v-if="isComponents || isCommon || isOffice" v-model="filter" class="td-sidebar__filter" type="text" placeholder="筛选页面" autocomplete="off">
        <nav class="td-sidebar__nav">
          <div class="td-sidebar__group td-sidebar__group--nav">
            <div class="td-sidebar__group-title">导航</div>
            <a
              v-for="item in mobileNavItems"
              :key="item.path"
              :class="['td-sidebar__link', { 'is-active': item.active }]"
              :href="item.path"
              :target="item.external ? '_blank' : undefined"
              :rel="item.external ? 'noopener' : undefined"
              @click="onMobileNav(item, $event)"
            >{{ item.label }}</a>
          </div>
          <template v-if="!isHome">
            <template v-for="layer in sidebarLayers" :key="layer.key">
              <div v-if="layer.label" class="td-sidebar__layer">
                {{ layer.label }}<span class="td-sidebar__layer-zh">{{ layer.zh }}</span>
              </div>
              <div v-for="cat in layer.groups" :key="cat.key" class="td-sidebar__group">
                <div class="td-sidebar__group-title">{{ cat.name }}</div>
                <a
                  v-for="item in cat.components"
                  :key="item.path"
                  :class="['td-sidebar__link', { 'is-active': isActive(item.path) }]"
                  :href="item.path"
                  @click.prevent="go(item.path); mobileOpen = false"
                >{{ item.name }}<span v-if="item.suffix" class="td-sidebar__link-en">{{ item.suffix }}</span></a>
              </div>
            </template>
            <div v-if="!sidebarLayers.length" class="td-sidebar__empty">{{ isGuide ? '无指南页面' : isExamples ? '无案例页面' : '无匹配页面' }}</div>
          </template>
        </nav>
      </aside>

      <!-- 内容 -->
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
 * tools 文档站外壳 — 与 business / charts 两站同一套语法（bd- / cd- / td- 三站同构）：
 * 警示横幅 + 顶栏（logo/版本 + 图标导航 + 官方库下拉 + 搜索 + npm + 暗色）+ 侧栏分组 + 正文。
 * 只在数据侧做本站化：导航项、侧栏分组、搜索索引都来自 meta.js。
 */
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, useData, Content } from 'vitepress'
import TdIcon from './Icon.vue'
import { GUIDE_NAV, EXAMPLES_NAV, TOOLS_LAYERS, ALL_PAGES } from './meta.js'

const route = useRoute()
const router = useRouter()
const { theme } = useData()

/** 顶栏版本展示点：构建期读 package.json（config.mts 的 themeConfig.toolsVersion） */
const version = `v${theme.value?.toolsVersion ?? ''}`
const isDark = ref(false)
const mobileOpen = ref(false)
const keyword = ref('')
const searchOpen = ref(true)
const filter = ref('')

const isHome = computed(() => route.path === '/' || route.path === '/index.html')
const isGuide = computed(() => route.path.startsWith('/guide'))
const isContract = computed(() => route.path.startsWith('/guide/design'))
const isComponents = computed(() => route.path.startsWith('/components'))
const isExamples = computed(() => route.path.startsWith('/examples'))
const isCommon = computed(() => route.path.startsWith('/common'))
const isOffice = computed(() => route.path.startsWith('/office'))

/**
 * 侧栏层级：数组 = 层（common / office），层内 = 用途分类分组。
 * 指南区与案例区各自成一层（label 为空时不出层标题）。
 */
const sidebarLayers = computed(() => {
  if (isGuide.value) {
    return [{ key: 'pages', label: '', zh: '', groups: GUIDE_NAV.map((cat) => groupOf(cat)) }]
  }
  if (isExamples.value) {
    return [{ key: 'pages', label: '', zh: '', groups: EXAMPLES_NAV.map((cat) => groupOf(cat)) }]
  }
  // 组件区：默认两层全展示；/common、/office 概览页只展示自己那层
  const layers = isCommon.value
    ? TOOLS_LAYERS.filter((l) => l.key === 'common')
    : isOffice.value
      ? TOOLS_LAYERS.filter((l) => l.key === 'office')
      : TOOLS_LAYERS
  const q = filter.value.trim().toLowerCase()
  if (!q) return layers
  return layers
    .map((layer) => ({
      ...layer,
      groups: layer.groups
        .map((g) => ({
          ...g,
          components: g.components.filter(
            (c) => c.name.toLowerCase().includes(q) || c.suffix.toLowerCase().includes(q),
          ),
        }))
        .filter((g) => g.components.length),
    }))
    .filter((layer) => layer.groups.length)
})

/** 单层内的分组适配（指南 / 案例：只有一层目录） */
function groupOf(cat) {
  return {
    ...cat,
    components: cat.components.map((c) => ({ ...c, name: c.name, suffix: c.zh })),
  }
}

const navItems = computed(() => [
  { key: 'home', label: '首页', icon: 'home', path: '/', active: isHome.value },
  { key: 'guide', label: '指南', icon: 'book', path: '/guide/getting-started', active: isGuide.value && !isContract.value },
  { key: 'common', label: '通用', icon: 'grid', path: '/common/', active: isCommon.value || isComponents.value },
  { key: 'office', label: '办公', icon: 'box', path: '/office/', active: isOffice.value },
  { key: 'examples', label: '案例', icon: 'play', path: '/examples/', active: isExamples.value },
  { key: 'contract', label: '契约', icon: 'file-text', path: '/guide/design', active: isContract.value },
  {
    key: 'family',
    label: '官方库',
    icon: 'globe',
    children: [
      { label: '官网级 UI 框架 · Evoke UI', path: 'https://evoke-ui.wil-works.com' },
      { label: '中后台 UI 框架 · Business UI', path: 'https://evoke-business-ui.wil-works.com' },
      { label: '图表库 · Evoke Charts', path: 'https://evoke-charts.wil-works.com' },
    ],
  },
])

const results = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return []
  return ALL_PAGES.filter(
    (c) => c.name.toLowerCase().includes(q) || c.zh.toLowerCase().includes(q) || c.category.includes(q),
  ).slice(0, 8)
})

function isActive(path) {
  return route.path === path || route.path === `${path}.html`
}

function onNavClick(item, event) {
  if (item.external) return // 外链：放行原生跳转（新窗口打开）
  event.preventDefault()
  go(item.path)
}

// 抽屉内的扁平主导航：官方库子项拍平为外链
const mobileNavItems = computed(() =>
  navItems.value.flatMap((item) =>
    item.children
      ? item.children.map((c) => ({ label: c.label, path: c.path, external: true }))
      : [{ label: item.label, path: item.path, active: item.active }],
  ),
)

function onMobileNav(item, event) {
  if (item.external) return // 外链：放行原生跳转（新窗口打开）
  event.preventDefault()
  go(item.path)
  mobileOpen.value = false
}

function go(path) {
  router.go(path)
}

function toggleDark() {
  isDark.value = !isDark.value
  applyDark(isDark.value)
  try {
    localStorage.setItem('td-dark', isDark.value ? '1' : '0')
  } catch {
    /* 隐私模式静默 */
  }
}

function applyDark(dark) {
  document.documentElement.classList.toggle('dark', dark)
}

function onSearchBlur() {
  // 延迟以允许 mousedown 选中结果
  setTimeout(() => {
    searchOpen.value = false
  }, 150)
}

// 警示横幅高度回写：37px 仅为单行初始值，窄屏换行/字号缩放时按实测高度更新
// --td-devwarn-h，顶栏（.td-header）与 --td-top 随之偏移，不被定高截断
let devwarnResize = null
function syncDevwarnHeight() {
  devwarnResize?.disconnect()
  devwarnResize = null
  const banner = document.querySelector('.td-devwarn')
  if (!banner || typeof ResizeObserver === 'undefined') return
  const apply = () => {
    document.documentElement.style.setProperty('--td-devwarn-h', `${banner.offsetHeight}px`)
  }
  apply()
  devwarnResize = new ResizeObserver(apply)
  devwarnResize.observe(banner)
}

onMounted(() => {
  try {
    applyDark(localStorage.getItem('td-dark') === '1')
  } catch {
    applyDark(false)
  }
  syncDevwarnHeight()
  watch(isHome, () => nextTick(syncDevwarnHeight))
  // 代码块复制（自定义主题不走默认主题的 .vp-doc 处理器，事件委托覆盖所有路由）
  document.addEventListener('click', onDelegatedClick)
})

onBeforeUnmount(() => {
  devwarnResize?.disconnect()
  document.removeEventListener('click', onDelegatedClick)
})

function onDelegatedClick(e) {
  const btn = e.target.closest('button.copy')
  if (!btn) return
  const pre = btn.parentElement?.querySelector('pre')
  const text = pre?.textContent ?? ''
  navigator.clipboard
    .writeText(text)
    .then(() => {
      btn.classList.add('copied')
      setTimeout(() => btn.classList.remove('copied'), 1500)
    })
    .catch(() => {
      /* 剪贴板不可用静默 */
    })
}
</script>