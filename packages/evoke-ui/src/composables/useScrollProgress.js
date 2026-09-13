/**
 * useScrollProgress — 滚动进度原语（滚动叙事的地基）
 *
 * 把「目标元素穿过视口的程度」折算成 0..1 的进度：0 = 元素顶部抵达吸附位，
 * 1 = 元素底部对齐视口底部。滚动条就是时间轴——下滚前进、上滚回溯，
 * 与 v-reveal 的「进视口播一次」触发型动效互补。
 *
 * Usage:
 *   const { progress, reduced } = useScrollProgress(elRef)
 *   const { progress } = useScrollProgress(elRef, { offset: () => 48 })  // sticky 吸附偏移 px
 *
 * 环境无 window（SSR）时不启动；用户偏好减少动效（prefers-reduced-motion）时
 * 进度钉在终态 1，不随滚动变化。
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useScrollProgress(target, { offset = 0 } = {}) {
  const progress = ref(0)
  const reduced = ref(false)

  let mql = null
  let ticking = false
  let rafId = 0

  function compute() {
    ticking = false
    if (reduced.value) return
    const el = target.value
    if (!el || typeof window === 'undefined') return
    const rect = el.getBoundingClientRect()
    const vh = window.innerHeight || 1
    // 可钉住长度 = 容器高度 − 视口高度；吸附偏移让起点推迟 offset、总长等量延长
    const span = rect.height - vh + resolveOffset(offset)
    if (!(span > 0)) {
      progress.value = 0
      return
    }
    const raw = (resolveOffset(offset) - rect.top) / span
    progress.value = Math.min(Math.max(raw, 0), 1)
  }

  function schedule() {
    if (ticking) return
    ticking = true
    // rAF 不可用的环境（jsdom 等）退化为同步计算，行为一致
    if (typeof requestAnimationFrame === 'function') {
      rafId = requestAnimationFrame(compute)
    } else {
      compute()
    }
  }

  function resolveOffset(v) {
    if (typeof v === 'function') v = v()
    const n = typeof v === 'number' ? v : parseFloat(v)
    return Number.isFinite(n) ? n : 0
  }

  function applyReduced() {
    reduced.value = !!(mql && mql.matches)
    if (reduced.value) {
      // 减少动效：不跟随滚动，静态呈现终态
      progress.value = 1
    } else {
      compute()
    }
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    mql = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
    applyReduced()
    if (mql) {
      mql.addEventListener?.('change', applyReduced)
    }
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    compute()
  })

  onBeforeUnmount(() => {
    if (mql) mql.removeEventListener?.('change', applyReduced)
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
    if (rafId) cancelAnimationFrame(rafId)
  })

  return { progress, reduced }
}
