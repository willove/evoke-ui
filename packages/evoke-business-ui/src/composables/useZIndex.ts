/**
 * z-index 组合式封装
 */
import { ref } from 'vue'
import type { Ref } from 'vue'
import { nextZIndex, currentZIndex } from '../utils/zIndex'

/**
 * 生成一个新的 z-index 值（响应式持有）
 */
export function useZIndex(): {
  zIndex: Ref<number>
  next: () => number
  current: () => number
} {
  const zIndex = ref(nextZIndex())
  const next = () => (zIndex.value = nextZIndex())
  const current = () => currentZIndex()
  return { zIndex, next, current }
}
