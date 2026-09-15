/**
 * ConfigProvider 上下文 — size / locale / zIndex / namespace / platform 全局默认值
 */
import { inject, provide, ref, computed } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { zhCN } from '../locale'

export const configProviderContextKey = Symbol('evConfigProviderContext')

/** 文案树：嵌套对象、叶子为字符串（部分条目为字符串数组） */
export interface LocaleMessages {
  [key: string]: LocaleMessages | string | readonly string[]
}

export type Size = '' | 'default' | 'small' | 'large'
export type PlatformMode = 'auto' | 'desktop' | 'mobile'

/** ConfigProvider 注入的上下文形态（provide / inject 双方共用） */
export interface ConfigProviderContext {
  size: Ref<Size>
  locale: Ref<LocaleMessages>
  namespace: Ref<string>
  platform: Ref<PlatformMode>
  permissions?: Ref<string[]>
}

export interface ConfigProviderDefaults {
  size?: Size
  locale?: LocaleMessages
  zIndex?: number
  namespace?: string
  platform?: PlatformMode
}

/**
 * 提供全局配置（EbConfigProvider 组件消费）
 */
export function provideConfigProvider(defaults: ConfigProviderDefaults = {}) {
  const size = ref<Size>(defaults.size ?? 'default')
  const locale = ref<LocaleMessages>(defaults.locale ?? zhCN)
  const namespace = ref(defaults.namespace ?? 'ev')
  const platform = ref<PlatformMode>(defaults.platform ?? 'auto')
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
export function useConfigProvider(): {
  size: ComputedRef<Size>
  locale: ComputedRef<LocaleMessages>
  namespace: ComputedRef<string>
  platform: ComputedRef<PlatformMode>
} {
  const config = inject<ConfigProviderContext | null>(configProviderContextKey, null)
  return {
    size: computed(() => config?.size?.value ?? 'default'),
    locale: computed(() => config?.locale?.value ?? zhCN),
    namespace: computed(() => config?.namespace?.value ?? 'ev'),
    platform: computed(() => config?.platform?.value ?? 'auto'),
  }
}
