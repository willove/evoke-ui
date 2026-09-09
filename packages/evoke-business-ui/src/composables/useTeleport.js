/**
 * Teleport 目标解析 composable
 * append-to 支持：selector 字符串 / 元素 / 返回元素的函数，默认 body
 */
import { ref, onMounted, onBeforeUnmount, unref } from 'vue'
import { resolveTarget } from '../utils/dom'

/**
 * @param {import('vue').Ref<string | HTMLElement | (() => HTMLElement) | undefined>} targetRef
 * @returns {{ teleportTarget: import('vue').Ref<HTMLElement | null> }}
 */
export function useTeleport(targetRef) {
  const teleportTarget = ref(null)
  let observer = null

  function resolve() {
    teleportTarget.value = resolveTarget(unref(targetRef))
  }

  onMounted(() => {
    resolve()
    // 目标为函数/响应式时监听变化
    if (typeof unref(targetRef) === 'string') {
      // selector 可能晚于浮层挂载，MutationObserver 兜底重解析
      observer = new MutationObserver(() => {
        const next = resolveTarget(unref(targetRef))
        if (next !== teleportTarget.value) {
          teleportTarget.value = next
        }
      })
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      })
    }
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return { teleportTarget }
}
