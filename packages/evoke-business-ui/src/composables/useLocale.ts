/**
 * Locale composable — 组件内取文案
 * 优先级：ConfigProvider locale > 全局 currentLocale > zh-CN
 */
import { ref, computed, inject } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { zhCN } from '../locale'
import { configProviderContextKey } from './useConfigProvider'
import type { ConfigProviderContext, LocaleMessages } from './useConfigProvider'

/** 全局 locale（install 时可通过 options.locale 覆盖） */
export const globalLocale: Ref<LocaleMessages> = ref(zhCN)

export function useLocale(): {
  t: (path: string, ...args: unknown[]) => string
  locale: ComputedRef<LocaleMessages>
} {
  const config = inject<ConfigProviderContext | null>(configProviderContextKey, null)
  const locale = computed(() => config?.locale?.value ?? globalLocale.value ?? zhCN)

  /**
   * 取文案：t('select.placeholder') → locale.eb.select.placeholder
   * 支持插值：t('pagination.total', 100) → '共 100 条'
   */
  function t(path: string, ...args: unknown[]): string {
    const segments = path.split('.')
    let value: LocaleMessages | string | readonly string[] | undefined = locale.value?.eb
    for (const key of segments) {
      // JS 语义：对字符串/数组叶子继续取键得到 undefined，随即 break
      value = (value as LocaleMessages | undefined)?.[key]
      if (value === undefined) break
    }
    if (typeof value !== 'string') return path
    // {total} 占位替换
    return value.replace(/\{(\w+)\}/g, (_, name: string) => {
      const idx = ['total', 'checked'].indexOf(name)
      return idx >= 0 && args[idx] !== undefined ? String(args[idx]) : `{${name}}`
    })
  }

  return { t, locale }
}
