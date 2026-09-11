/**
 * v-reveal — 滚动入场指令（轻盈浮现语言）v2
 * 元素进入视口时添加 .is-revealed（配合 utilities.css 的 .ev-reveal 过渡）
 *
 * Usage:
 *   <div v-reveal>…</div>
 *   <div v-reveal="{ delay: 120 }">…</div>                       // 交错入场延迟 ms
 *   <div v-reveal="{ type: 'left' }">…</div>                     // up(默认) | left | right | zoom | fade
 *   <div v-reveal="{ once: false }">…</div>                      // 每次进入视口都触发
 */

export const REVEAL_TYPES = ['up', 'left', 'right', 'zoom', 'fade']

const observer = typeof IntersectionObserver !== 'undefined' ? IntersectionObserver : null

let sharedObserver = null

function getObserver() {
  if (!observer) return null
  if (!sharedObserver) {
    sharedObserver = new observer((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed')
          if (entry.target.dataset.ewRevealOnce !== 'false') {
            sharedObserver.unobserve(entry.target)
          }
        }
      }
    })
  }
  return sharedObserver
}

/**
 * 让单个元素获得滚动入场能力（指令与组件共用的底层实现）
 * @returns cleanup 函数
 */
export function revealElement(el, options = {}) {
  const { type = 'up', delay = 0, once = true } = options
  el.classList.add('ev-reveal')
  el.dataset.ewReveal = REVEAL_TYPES.includes(type) ? type : 'up'
  el.dataset.ewRevealOnce = String(once)
  if (delay) el.style.transitionDelay = `${delay}ms`

  const io = getObserver()
  if (!io) {
    // 环境不支持 IntersectionObserver（SSR/测试）：直接呈现
    el.classList.add('is-revealed')
    return () => {}
  }
  io.observe(el)
  return () => io.unobserve(el)
}

export const revealDirective = {
  mounted(el, binding) {
    revealElement(el, binding.value || {})
  },
  unmounted(el) {
    sharedObserver?.unobserve(el)
  },
}

export const reveal = revealDirective
