<template>
  <div class="cd-layout" :class="{ 'cd-layout--home': isHome }">
    <!-- 顶栏 -->
    <header class="cd-header">
      <div class="cd-header__inner">
        <a class="cd-logo" href="/" @click.prevent="go('/')">
          <span class="cd-logo__name">Evoke Charts</span>
          <span class="cd-logo__version">{{ version }}</span>
        </a>

        <nav class="cd-nav">
          <a
            v-for="item in navItems"
            :key="item.key"
            :class="['cd-nav__item', { 'is-active': item.active }]"
            :href="item.external ? item.path : '#'"
            :target="item.external ? '_blank' : undefined"
            :rel="item.external ? 'noopener' : undefined"
            @click="onNavClick(item, $event)"
          >
            <Icon :name="item.icon" :size="14" class="cd-nav__icon" />
            <span>{{ item.label }}</span>
          </a>
        </nav>

        <div class="cd-header__right">
          <button class="cd-header__btn cd-header__menu-btn" type="button" aria-label="菜单" @click="mobileOpen = !mobileOpen">
            <Icon :name="mobileOpen ? 'close' : 'menu'" :size="16" />
          </button>
          <div class="cd-search">
            <Icon name="search" :size="14" class="cd-search__icon" />
            <input
              v-model="keyword"
              class="cd-search__input"
              type="text"
              placeholder="搜索图表..."
              autocomplete="off"
              @focus="searchOpen = true"
              @blur="onSearchBlur"
              @keydown.esc="searchOpen = false"
            >
            <transition name="cd-pop">
              <ul v-if="searchOpen && keyword && results.length" class="cd-search__results">
                <li v-for="r in results" :key="r.path">
                  <button type="button" class="cd-search__result" @mousedown.prevent="go(r.path); keyword = ''">
                    <span class="cd-search__result-name">{{ r.name }}</span>
                    <span class="cd-search__result-zh">{{ r.zh || r.name }} · {{ r.category }}</span>
                  </button>
                </li>
              </ul>
            </transition>
          </div>
          <a
            class="cd-header__btn cd-header__download"
            href="https://www.npmjs.com/package/@wil-works/evoke-charts"
            target="_blank"
            rel="noopener"
            aria-label="下载"
            title="npm 下载"
          >
            <Icon name="download" :size="16" />
          </a>
          <button class="cd-header__btn" type="button" :aria-label="isDark ? '切换到浅色' : '切换到深色'" @click="toggleDark">
            <Icon :name="isDark ? 'sun' : 'moon'" :size="16" />
          </button>
        </div>
      </div>
    </header>

    <!-- 移动端遮罩 -->
    <div v-if="mobileOpen" class="cd-sidebar-mask" @click="mobileOpen = false" />

    <!-- 主体 -->
    <div class="cd-body">
      <!-- 侧栏（非首页）：按分区显示对应导航 -->
      <aside v-if="!isHome" class="cd-sidebar" :class="{ 'is-open': mobileOpen }">
        <nav class="cd-sidebar__nav">
          <div v-for="cat in sidebarGroups" :key="cat.key" class="cd-sidebar__group">
            <div class="cd-sidebar__group-title">{{ cat.name }}</div>
            <a
              v-for="item in cat.components"
              :key="item.path"
              :class="['cd-sidebar__link', { 'is-active': isActive(item.path) }]"
              :href="item.path"
              @click.prevent="go(item.path); mobileOpen = false"
            >{{ item.label }}<span v-if="item.suffix" class="cd-sidebar__link-en">{{ item.suffix }}</span></a>
          </div>
          <div v-if="!sidebarGroups.length" class="cd-sidebar__empty">无页面</div>
        </nav>
      </aside>

      <!-- 内容 -->
      <main class="cd-content" :class="{ 'is-home': isHome }">
        <article v-if="!isHome" class="cd-doc">
          <Content />
        </article>
        <Content v-else />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, Content } from 'vitepress'
import Icon from './Icon.vue'
import { BRAND, GUIDE_NAV, CHART_NAV, EXAMPLES_NAV, ALL_CHART_PAGES, ALL_GUIDE_PAGES, ALL_EXAMPLES } from './meta.js'

const route = useRoute()
const router = useRouter()

const version = BRAND.version
const isDark = ref(false)
const mobileOpen = ref(false)
const keyword = ref('')
const searchOpen = ref(true)

const isHome = computed(() => route.path === '/' || route.path === '/index.html')
const isGuide = computed(() => route.path.startsWith('/guide'))
const isChart = computed(() => route.path.startsWith('/chart'))
const isExamples = computed(() => route.path.startsWith('/examples'))

/** 侧栏分组：指南区显示指南导航，图表区显示图表章节，案例区显示案例目录 */
const sidebarGroups = computed(() => {
  if (isChart.value) {
    return CHART_NAV.map((cat) => ({
      ...cat,
      components: cat.components.map((c) => ({ ...c, label: c.name, suffix: c.zh })),
    }))
  }
  if (isExamples.value) {
    return EXAMPLES_NAV.map((cat) => ({
      ...cat,
      components: cat.components.map((c) => ({ ...c, label: c.name, suffix: '' })),
    }))
  }
  return GUIDE_NAV.map((cat) => ({
    ...cat,
    components: cat.components.map((c) => ({ ...c, label: c.name, suffix: '' })),
  }))
})

const navItems = computed(() => [
  { key: 'home', label: '首页', icon: 'home', path: '/', active: isHome.value },
  { key: 'guide', label: '指南', icon: 'book', path: '/guide/install', active: isGuide.value },
  { key: 'charts', label: '图表类型', icon: 'chart', path: '/chart', active: isChart.value },
  { key: 'examples', label: '案例', icon: 'play', path: '/examples/', active: isExamples.value },
  { key: 'evoke', label: '官网级 UI 框架', icon: 'external-link', path: 'https://evoke-ui.wil-works.com', external: true },
  { key: 'ebui', label: '中后台 UI 框架', icon: 'external-link', path: 'https://evoke-business-ui.wil-works.com', external: true },
])

const results = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return []
  const pool = [...ALL_CHART_PAGES, ...ALL_GUIDE_PAGES, ...ALL_EXAMPLES]
  return pool.filter(
    (c) => c.name.toLowerCase().includes(q) || c.zh.includes(q) || c.category.includes(q),
  ).slice(0, 8)
})

function isActive(path) {
  return (
    route.path === path ||
    route.path === `${path}.html` ||
    (path === '/examples/' && route.path === '/examples/index.html') ||
    (path === '/chart' && route.path === '/chart.html')
  )
}

function onNavClick(item, event) {
  if (item.external) return // 外链：放行原生跳转（新窗口打开）
  event.preventDefault()
  go(item.path)
}

function go(path) {
  router.go(path)
}

function toggleDark() {
  isDark.value = !isDark.value
  applyDark(isDark.value)
  try {
    localStorage.setItem('cd-dark', isDark.value ? '1' : '0')
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

onMounted(() => {
  try {
    applyDark(localStorage.getItem('cd-dark') === '1')
  } catch {
    applyDark(false)
  }
  // 代码块复制（自定义主题无默认主题的 copy 处理器，事件委托覆盖所有路由）
  document.addEventListener('click', onDelegatedClick)
})

onBeforeUnmount(() => {
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
