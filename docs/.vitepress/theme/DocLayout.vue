<template>
  <div class="bd-layout" :class="{ 'bd-layout--home': isHome }">
    <!-- 示例子站点（/examples/live/*）：微型顶栏 + 全屏舞台，脱离文档站框架 -->
    <template v-if="isExampleLive">
      <ExampleLiveBar :current="liveCurrent" />
      <main class="example-live__stage">
        <Content />
      </main>
    </template>

    <template v-else>
    <!-- 顶栏 -->
    <header class="bd-header">
      <div class="bd-header__inner">
        <a class="bd-logo" href="/" @click.prevent="go('/')">
          <span class="bd-logo__mark">
            <Icon name="layers" :size="18" />
          </span>
          <span class="bd-logo__name">Evoke Business UI</span>
          <span class="bd-logo__version">{{ version }}</span>
        </a>

        <nav class="bd-nav">
          <a
            v-for="item in navItems"
            :key="item.key"
            :class="['bd-nav__item', { 'is-active': item.active }]"
            :href="item.external ? item.path : '#'"
            :target="item.external ? '_blank' : undefined"
            :rel="item.external ? 'noopener' : undefined"
            @click="onNavClick(item, $event)"
          >
            <Icon :name="item.icon" :size="14" class="bd-nav__icon" />
            <span>{{ item.label }}</span>
          </a>
        </nav>

        <div class="bd-header__right">
          <button class="bd-header__btn bd-header__menu-btn" type="button" aria-label="菜单" @click="mobileOpen = !mobileOpen">
            <Icon :name="mobileOpen ? 'close' : 'menu'" :size="16" />
          </button>
          <div class="bd-search">
            <Icon name="search" :size="14" class="bd-search__icon" />
            <input
              v-model="keyword"
              class="bd-search__input"
              type="text"
              placeholder="搜索组件..."
              autocomplete="off"
              @focus="searchOpen = true"
              @blur="onSearchBlur"
              @keydown.esc="searchOpen = false"
            >
            <transition name="bd-pop">
              <ul v-if="searchOpen && keyword && results.length" class="bd-search__results">
                <li v-for="r in results" :key="r.path">
                  <button type="button" class="bd-search__result" @mousedown.prevent="go(r.path); keyword = ''">
                    <span class="bd-search__result-name">{{ r.name }}</span>
                    <span class="bd-search__result-zh">{{ r.zh }} · {{ r.category }}</span>
                  </button>
                </li>
              </ul>
            </transition>
          </div>
          <a
            class="bd-header__btn bd-header__download"
            href="https://www.npmjs.com/package/@wil-works/evoke-business-ui"
            target="_blank"
            rel="noopener"
            aria-label="下载"
            title="npm 下载"
          >
            <Icon name="download" :size="16" />
          </a>
          <button class="bd-header__btn" type="button" :aria-label="isDark ? '切换到浅色' : '切换到深色'" @click="toggleDark">
            <Icon :name="isDark ? 'sun' : 'moon'" :size="16" />
          </button>
        </div>
      </div>
    </header>

    <!-- 移动端遮罩 -->
    <div v-if="mobileOpen" class="bd-sidebar-mask" @click="mobileOpen = false" />

    <!-- 主体 -->
    <div class="bd-body">
      <!-- 侧栏（非首页）：组件区显示组件目录，指南区显示指南导航 -->
      <aside v-if="!isHome" class="bd-sidebar" :class="{ 'is-open': mobileOpen }">
        <input v-if="!isGuide && !isChart && !isExamples && !isMobileDocs" v-model="filter" class="bd-sidebar__filter" type="text" placeholder="筛选组件" autocomplete="off">
        <nav class="bd-sidebar__nav">
          <div v-for="cat in sidebarGroups" :key="cat.key" class="bd-sidebar__group">
            <div class="bd-sidebar__group-title">{{ cat.name }}</div>
            <a
              v-for="item in cat.components"
              :key="item.path"
              :class="['bd-sidebar__link', { 'is-active': isActive(item.path) }]"
              :href="item.path"
              @click.prevent="go(item.path); mobileOpen = false"
            >{{ item.label }}<span v-if="item.suffix" class="bd-sidebar__link-en">{{ item.suffix }}</span></a>
          </div>
          <div v-if="!sidebarGroups.length" class="bd-sidebar__empty">{{ isGuide ? '无指南页面' : '无匹配组件' }}</div>
        </nav>
      </aside>

      <!-- 内容 -->
      <main class="bd-content" :class="{ 'is-home': isHome }">
        <article v-if="!isHome" class="bd-doc">
          <PlatformCompat />
          <Content />
        </article>
        <Content v-else />
      </main>
    </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, Content } from 'vitepress'
import Icon from './Icon.vue'
import ExampleLiveBar from './ExampleLiveBar.vue'
import PlatformCompat from './PlatformCompat.vue'
import { CATEGORIES, ALL_COMPONENTS, BRAND, GUIDE_NAV, CHART_NAV, ALL_CHART_PAGES, EXAMPLES_NAV, ALL_EXAMPLES, MOBILE_NAV, ALL_MOBILE_PAGES } from './meta.js'

const route = useRoute()
const router = useRouter()
const components = { Content }

const version = BRAND.version
const isDark = ref(false)
const mobileOpen = ref(false)
const keyword = ref('')
const searchOpen = ref(true)
const filter = ref('')

const isHome = computed(() => route.path === '/' || route.path === '/index.html')
const isGuide = computed(() => route.path.startsWith('/guide'))
const isChart = computed(() => route.path.startsWith('/chart'))
const isMobileDocs = computed(() => route.path.startsWith('/mobile'))
const isExamples = computed(() => route.path.startsWith('/examples') && !route.path.startsWith('/examples/live/'))
const isExampleLive = computed(() => route.path.startsWith('/examples/live/'))
const liveCurrent = computed(() => route.path.match(/\/examples\/live\/([^/.]+)/)?.[1] ?? '')

/** 侧栏分组：指南区显示指南导航，图表区显示图表章节，示例区显示示例目录，组件区显示组件目录（中文主文本 + 英文后缀） */
const sidebarGroups = computed(() => {
  if (isGuide.value) {
    return GUIDE_NAV.map((cat) => ({
      ...cat,
      components: cat.components.map((c) => ({ ...c, label: c.name, suffix: '' })),
    }))
  }
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
  if (isMobileDocs.value) {
    return MOBILE_NAV.map((cat) => ({
      ...cat,
      components: cat.components.map((c) => ({ ...c, label: c.name, suffix: c.zh })),
    }))
  }
  const q = filter.value.trim().toLowerCase()
  const cats = !q
    ? CATEGORIES
    : CATEGORIES.map((cat) => ({
        ...cat,
        components: cat.components.filter(
          (c) => c.name.toLowerCase().includes(q) || c.zh.includes(q),
        ),
      })).filter((cat) => cat.components.length)
  return cats.map((cat) => ({
    ...cat,
    components: cat.components.map((c) => ({ ...c, label: c.zh, suffix: c.name })),
  }))
})

const navItems = computed(() => [
  { key: 'home', label: '首页', icon: 'home', path: '/', active: isHome.value },
  { key: 'guide', label: '指南', icon: 'book', path: '/guide/getting-started', active: isGuide.value },
  { key: 'components', label: '组件', icon: 'box', path: '/components/overview', active: route.path.startsWith('/components') },
  { key: 'charts', label: '图表', icon: 'chart', path: '/chart', active: isChart.value },
  { key: 'mobile', label: '移动端', icon: 'smartphone', path: '/mobile/', active: isMobileDocs.value },
  { key: 'examples', label: '示例', icon: 'play', path: '/examples/', active: isExamples.value },
  { key: 'evoke', label: 'Evoke UI', icon: 'external-link', path: 'https://evoke-ui.wil-works.com', external: true },
])

const results = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return []
  const pool = [...ALL_COMPONENTS, ...ALL_CHART_PAGES, ...ALL_EXAMPLES, ...ALL_MOBILE_PAGES]
  return pool.filter(
    (c) => c.name.toLowerCase().includes(q) || c.zh.includes(q) || c.category.includes(q),
  ).slice(0, 8)
})

function isActive(path) {
  return (
    route.path === path ||
    route.path === `${path}.html` ||
    (path === '/examples/' && route.path === '/examples/index.html')
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
    localStorage.setItem('bd-dark', isDark.value ? '1' : '0')
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
    applyDark(localStorage.getItem('bd-dark') === '1')
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
