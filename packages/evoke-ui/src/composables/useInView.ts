/**
 * onInView — 元素进入视口回调（IntersectionObserver 封装）
 * 环境不支持 IO（SSR/测试）时走 onFallback，保证能力降级不失效
 *
 * @returns cleanup 函数
 */
export function onInView(
  el: Element | null | undefined,
  onEnter?: (entry: IntersectionObserverEntry) => void,
  onFallback?: () => void,
  options?: IntersectionObserverInit,
): () => void {
  if (typeof IntersectionObserver === 'undefined' || !el) {
    onFallback?.()
    return () => {}
  }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        onEnter?.(entry)
        io.unobserve(entry.target)
      }
    }
  }, options)
  io.observe(el)
  return () => io.unobserve(el)
}
