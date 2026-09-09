/**
 * useSafeArea — 安全区探测（移动端全面屏适配）
 *
 * 组件内的常规吸附（Tabbar 吸底 / ActionSheet 取消栏）已通过 CSS env() 自动适配；
 * 当业务有自己的吸底元素（悬浮 CTA、吸底提交栏等）时，用本组合式函数读取实时安全区：
 *
 *   import { useSafeArea, ensureViewportFit } from '@wil-works/evoke-business-ui'
 *
 *   const safeArea = useSafeArea()          // 响应式 { top, bottom, left, right }（px）
 *   ensureViewportFit()                     // 页面初始化时调用一次
 *   :style="{ paddingBottom: safeArea.bottom + 'px' }"
 *
 * 原理：挂一个 visibility:hidden 的探针元素，用 env(safe-area-inset-*) 作为 padding，
 * 读取计算样式即真实 insets（桌面浏览器恒为 0，无需判断平台）。
 * 注意：页面 meta viewport 缺少 viewport-fit=cover 时 env() 恒为 0，
 * ensureViewportFit() 会在缺失时自动补上。
 */
import { onBeforeUnmount, onMounted, reactive } from 'vue'

const insets = reactive({ top: 0, bottom: 0, left: 0, right: 0 })

let probeEl = null
let refCount = 0

function measure() {
  if (!probeEl) return
  const cs = getComputedStyle(probeEl)
  insets.top = parseFloat(cs.paddingTop) || 0
  insets.bottom = parseFloat(cs.paddingBottom) || 0
  insets.left = parseFloat(cs.paddingLeft) || 0
  insets.right = parseFloat(cs.paddingRight) || 0
}

/**
 * 确保页面 meta viewport 带 viewport-fit=cover（缺失时 env() 恒为 0，安全区永远读不到）。
 * 返回 true 表示本次补写了 meta。SSR 环境直接返回 false。
 */
export function ensureViewportFit() {
  if (typeof document === 'undefined') return false
  let meta = document.querySelector('meta[name="viewport"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'viewport')
    meta.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover')
    document.head.appendChild(meta)
    return true
  }
  if (!/viewport-fit\s*=\s*cover/.test(meta.content)) {
    meta.setAttribute('content', `${meta.content}, viewport-fit=cover`)
    return true
  }
  return false
}

export function useSafeArea() {
  onMounted(() => {
    refCount += 1
    if (!probeEl) {
      probeEl = document.createElement('div')
      probeEl.setAttribute('aria-hidden', 'true')
      probeEl.style.cssText =
        'position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
        'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);'
      document.body.appendChild(probeEl)
    }
    measure()
    window.addEventListener('resize', measure)
  })

  onBeforeUnmount(() => {
    refCount -= 1
    if (refCount <= 0) {
      refCount = 0
      window.removeEventListener('resize', measure)
      probeEl?.remove()
      probeEl = null
    }
  })

  return insets
}
