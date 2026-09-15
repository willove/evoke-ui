/**
 * usePlatform — 容器环境判定（desktop / mobile）
 *
 * 解析优先级：ConfigProvider.platform > 全局 setPlatform() > 媒体查询自动探测
 * 自动探测：视口 ≤ 768px 或粗指针设备（触屏）视为 mobile。
 */
import { computed, inject, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { configProviderContextKey } from './useConfigProvider'
import type { ConfigProviderContext, PlatformMode } from './useConfigProvider'

const platformMode: Ref<PlatformMode> = ref('auto')
const mediaMobile: Ref<boolean> = ref(false)
let inited = false

function initMedia(): void {
  if (inited) return
  inited = true
  if (typeof window === 'undefined' || !window.matchMedia) return
  const mq = window.matchMedia('(max-width: 768px), (pointer: coarse)')
  const update = () => {
    mediaMobile.value = mq.matches
  }
  update()
  mq.addEventListener('change', update)
}

/** 全局设置平台模式（auto 恢复自动探测） */
export function setPlatform(mode?: PlatformMode): void {
  platformMode.value = mode || 'auto'
}

export function getPlatform(): PlatformMode {
  initMedia()
  return platformMode.value === 'auto' ? (mediaMobile.value ? 'mobile' : 'desktop') : platformMode.value
}

export function usePlatform(): {
  platform: ComputedRef<PlatformMode>
  isMobile: ComputedRef<boolean>
  isDesktop: ComputedRef<boolean>
} {
  initMedia()
  const configProvider = inject<ConfigProviderContext | null>(configProviderContextKey, null)

  const platform = computed<PlatformMode>(() => {
    const cp = configProvider?.platform?.value
    if (cp && cp !== 'auto') return cp
    if (platformMode.value !== 'auto') return platformMode.value
    return mediaMobile.value ? 'mobile' : 'desktop'
  })

  return {
    platform,
    isMobile: computed(() => platform.value === 'mobile'),
    isDesktop: computed(() => platform.value === 'desktop'),
  }
}
