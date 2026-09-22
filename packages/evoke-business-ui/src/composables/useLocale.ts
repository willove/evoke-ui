/**
 * Locale composable — 组件内取文案
 * 优先级：ConfigProvider locale > 全局 currentLocale > zh-CN
 */
import { ref, computed, inject, getCurrentInstance } from 'vue'
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
  // 组件外调用（引擎 / 工具函数 / 单测直接调 composable）时 inject 会告警且拿不到 provider，
  // 此时只认全局 locale——与 inject 失败落回 globalLocale 的结果一致，只是不再打日志
  const instance = getCurrentInstance()
  const config = instance ? inject<ConfigProviderContext | null>(configProviderContextKey, null) : null
  const locale = computed(() => config?.locale?.value ?? globalLocale.value ?? zhCN)

  /** 按路径取值；取不到或是非字符串叶子都返回 undefined */
  function lookup(root: unknown, segments: string[]): string | undefined {
    let value: unknown = root
    for (const key of segments) {
      // JS 语义：对字符串/数组叶子继续取键得到 undefined，随即 break
      value = (value as Record<string, unknown> | undefined)?.[key]
      if (value === undefined) return undefined
    }
    return typeof value === 'string' ? value : undefined
  }

  /**
   * 取文案：t('select.placeholder') → locale.eb.select.placeholder
   * 支持插值：t('pagination.total', 100) → '共 100 条'
   *
   * 当前语言缺这个键时**回退到基准包 zh-CN**，仍缺才返回路径字符串。
   * 有这层回退，译文才能按命名空间分批补（如 chat 先只补 en），
   * 未覆盖的语言显示中文而不是 select.placeholder 这样的裸键。
   */
  function t(path: string, ...args: unknown[]): string {
    const segments = path.split('.')
    const value =
      lookup(locale.value?.eb, segments) ?? lookup(zhCN.eb, segments)
    if (value === undefined) return path
    // {total} 占位替换
    return value.replace(/\{(\w+)\}/g, (_, name: string) => {
      const idx = ['total', 'checked'].indexOf(name)
      return idx >= 0 && args[idx] !== undefined ? String(args[idx]) : `{${name}}`
    })
  }

  return { t, locale }
}
