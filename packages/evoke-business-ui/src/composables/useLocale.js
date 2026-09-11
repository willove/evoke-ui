/**
 * Locale composable — 组件内取文案
 * 优先级：ConfigProvider locale > 全局 currentLocale > zh-CN
 */
import { ref, computed } from 'vue'
import { zhCN } from '../locale'
import { configProviderContextKey } from './useConfigProvider'
import { inject } from 'vue'

/** 全局 locale（install 时可通过 options.locale 覆盖） */
export const globalLocale = ref(zhCN)

/**
 * @returns {{ t: (path: string, ...args: any[]) => string, locale: import('vue').ComputedRef<Object> }}
 */
export function useLocale() {
  const config = inject(configProviderContextKey, null)
  const locale = computed(() => config?.locale?.value ?? globalLocale.value ?? zhCN)

  /**
   * 取文案：t('select.placeholder') → locale.eb.select.placeholder
   * 支持插值：t('pagination.total', 100) → '共 100 条'
   */
  function t(path, ...args) {
    const segments = path.split('.')
    let value = locale.value?.eb
    for (const key of segments) {
      value = value?.[key]
      if (value === undefined) break
    }
    if (typeof value !== 'string') return path
    // {total} 占位替换
    return value.replace(/\{(\w+)\}/g, (_, name) => {
      const idx = ['total', 'checked'].indexOf(name)
      return idx >= 0 && args[idx] !== undefined ? String(args[idx]) : `{${name}}`
    })
  }

  return { t, locale }
}
