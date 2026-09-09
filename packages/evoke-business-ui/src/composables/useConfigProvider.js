/**
 * ConfigProvider 上下文 — size / locale / zIndex / namespace / platform 全局默认值
 */
import { inject, provide, ref, computed } from 'vue'
import { zhCN } from '../locale'

export const configProviderContextKey = Symbol('evConfigProviderContext')

/**
 * 提供全局配置（EvConfigProvider 组件消费）
 * @param {Object} [defaults] { size, locale, zIndex, namespace, platform }
 */
export function provideConfigProvider(defaults = {}) {
  const size = ref(defaults.size ?? 'default')
  const locale = ref(defaults.locale ?? zhCN)
  const namespace = ref(defaults.namespace ?? 'ev')
  const platform = ref(defaults.platform ?? 'auto')
  provide(configProviderContextKey, {
    size,
    locale,
    namespace,
    platform,
  })
  return { size, locale, namespace, platform }
}

/**
 * 消费全局配置（组件内部使用）
 */
export function useConfigProvider() {
  const config = inject(configProviderContextKey, null)
  return {
    size: computed(() => config?.size?.value ?? 'default'),
    locale: computed(() => config?.locale?.value ?? zhCN),
    namespace: computed(() => config?.namespace?.value ?? 'ev'),
    platform: computed(() => config?.platform?.value ?? 'auto'),
  }
}
