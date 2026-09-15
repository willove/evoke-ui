/**
 * 脚手架全局设置（模块级单例，与 useDarkMode 同款模式）
 * 布局模式 / 明暗 / 主色 / 语言 / 侧栏折叠，全部 localStorage 持久化，刷新还原。
 * 明暗走组件库 useDarkMode（View Transitions 渐变），主色走 setPrimaryColor
 * （整条色阶运行时生成，明暗自适应并派发图表重绘事件）。
 * 刻意不走 provide/inject：模块单例对 main.js 装配顺序与 dev HMR 更稳。
 */
import { computed, ref, watch } from 'vue'
import {
  EbNotify,
  EB_THEME_PRESETS,
  useDarkMode,
  setPrimaryColor,
  resetTheme,
} from '@wil-works/evoke-business-ui'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'

const STORAGE_KEY = 'ebui-admin-scaffold-settings'

export const LAYOUT_MODES = ['sidebar', 'double-sidebar', 'top-nav', 'mixed', 'mixed-double']

export const THEME_PRESETS = EB_THEME_PRESETS

const DICTS = { 'zh-CN': zhCN, 'en-US': enUS }

function readSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

const saved = readSaved()

const layoutMode = ref(LAYOUT_MODES.includes(saved.layoutMode) ? saved.layoutMode : 'sidebar')
const locale = ref(saved.locale === 'en-US' ? 'en-US' : 'zh-CN')
const collapsed = ref(!!saved.collapsed)
const { isDark, setDark, toggleDark } = useDarkMode()
if (typeof saved.dark === 'boolean') setDark(saved.dark)
const primary = ref(typeof saved.primary === 'string' ? saved.primary : '')
if (primary.value) setPrimaryColor(primary.value)

// Toast 通知系统（EbNotify）：统一出口并保留会话内历史供通知中心展示
const notices = ref([])
let noticeSeed = 0
function notify({ type = 'success', title, message = '' } = {}) {
  if (type === 'info') EbNotify.info(title, message)
  else if (type === 'warning') EbNotify.warning(title, message)
  else if (type === 'error') EbNotify.error(title, message)
  else EbNotify.success(title, message)
  notices.value.unshift({
    id: ++noticeSeed,
    type,
    title,
    message,
    time: new Date().toLocaleTimeString(),
  })
  if (notices.value.length > 30) notices.value.pop()
}
function clearNotices() {
  notices.value = []
}

// i18n：缺键回退中文，再回退键名
function t(key) {
  const walk = (dict) =>
    String(key)
      .split('.')
      .reduce((o, k) => (o && o[k] != null ? o[k] : undefined), dict)
  return walk(DICTS[locale.value]) ?? walk(DICTS['zh-CN']) ?? key
}
const isZh = computed(() => locale.value === 'zh-CN')
function toggleLocale() {
  locale.value = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN'
}

function persist() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        layoutMode: layoutMode.value,
        locale: locale.value,
        collapsed: collapsed.value,
        dark: isDark.value,
        primary: primary.value,
      }),
    )
  } catch {
    /* 隐私模式静默 */
  }
}

watch([layoutMode, locale, collapsed, isDark], persist)
watch(primary, (value) => {
  if (value) setPrimaryColor(value)
  else resetTheme()
  persist()
})

function applyPreset(value) {
  primary.value = value
}
function resetAll() {
  layoutMode.value = 'sidebar'
  locale.value = 'zh-CN'
  primary.value = ''
  resetTheme()
  clearNotices()
}

const settings = {
  layoutMode,
  locale,
  isZh,
  toggleLocale,
  collapsed,
  isDark,
  toggleDark,
  primary,
  applyPreset,
  notify,
  notices,
  clearNotices,
  t,
  resetAll,
}

export function useSettings() {
  return settings
}
