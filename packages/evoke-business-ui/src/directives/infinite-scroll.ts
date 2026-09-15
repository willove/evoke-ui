/**
 * v-infinite-scroll — 无限滚动指令
 *
 * 用法（滚动容器上）：
 *   <div v-infinite-scroll="loadMore" class="list">…</div>
 *   <div v-infinite-scroll="{ load: loadMore, distance: 80, disabled: finished }">
 *
 * binding.value：函数 或 { load, distance = 20, disabled = false }
 * 距底部 distance px 时触发 load；同一次触底只发一次，滚回后重置
 */
import type { Directive, DirectiveBinding } from 'vue'

export interface InfiniteScrollValue {
  load?: () => unknown
  /** 距底部多少 px 触发 */
  distance?: number
  disabled?: boolean
}

type InfiniteScrollBindingValue = ((() => unknown) | InfiniteScrollValue | null | undefined)

type InfiniteScrollEl = HTMLElement & {
  __evInfiniteHandler?: ((e: Event) => void) | null
  __evInfiniteFired?: boolean
}

export function createInfiniteScrollDirective(): Directive<InfiniteScrollEl, InfiniteScrollBindingValue> {
  function getOptions(binding: DirectiveBinding<InfiniteScrollBindingValue>): {
    load?: () => unknown
    distance: number
    disabled: boolean
  } {
    if (typeof binding.value === 'function') return { load: binding.value, distance: 20, disabled: false }
    return {
      load: binding.value?.load,
      distance: binding.value?.distance ?? 20,
      disabled: binding.value?.disabled ?? false,
    }
  }

  function onScroll(e: Event, binding: DirectiveBinding<InfiniteScrollBindingValue>): void {
    const el = e.target as InfiniteScrollEl
    if (el.nodeType !== 1) return
    const { load, distance, disabled } = getOptions(binding)
    if (typeof load !== 'function' || disabled) return
    if (el.scrollHeight <= el.clientHeight) return // 无滚动条
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - distance
    if (nearBottom && !el.__evInfiniteFired) {
      el.__evInfiniteFired = true
      Promise.resolve(load()).finally(() => {
        // 数据加载完可能仍在底部，下一帧允许再次触发
        requestAnimationFrame(() => {
          el.__evInfiniteFired = false
        })
      })
    }
  }

  return {
    mounted(el, binding) {
      el.__evInfiniteHandler = (e) => onScroll(e, binding)
      el.addEventListener('scroll', el.__evInfiniteHandler, { passive: true })
    },
    updated(el, binding) {
      // 处理器引用的 binding 是首帧闭包，值更新后重建
      if (binding.value !== binding.oldValue) {
        el.removeEventListener('scroll', el.__evInfiniteHandler!)
        el.__evInfiniteHandler = (e) => onScroll(e, binding)
        el.addEventListener('scroll', el.__evInfiniteHandler, { passive: true })
      }
    },
    unmounted(el) {
      if (el.__evInfiniteHandler) {
        el.removeEventListener('scroll', el.__evInfiniteHandler)
        el.__evInfiniteHandler = null
      }
    },
  }
}
