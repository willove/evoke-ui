// ─── 动画与动态效果 — 2D / 3D 两个篇章共享的最小实现 ───
// 只放跨篇章一致的纯函数：错峰进度映射与系统级「减弱动态效果」判定；
// 各篇章的动画调度（rAF 循环、补间快照）仍留在自己的组件里。

/**
 * 系统级「减弱动态效果」是否开启
 * 命中时调用方应跳过进场 / 补间 / 惯性，直接出终态图；
 * SSR 或无 matchMedia 的老环境按「不减弱」处理，绝不抛错。
 */
export function prefersReducedMotion() {
  try {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * 分段错峰：把全局 progress 映射为第 index 个条目的局部 progress
 *
 * count 个条目里，第 index 个从 stagger * index/(count-1) 处起步，所有条目都在
 * progress = 1 时收齐；stagger = 0（或 count = 1）即全部同步，返回原 progress。
 * 局部进度自带 1/(1-stagger) 的压缩，条目越多、错峰越均匀。
 */
export function staggerProgress(progress, index, count, stagger) {
  const p = Number.isFinite(progress) ? progress : 1;
  const s = Number.isFinite(stagger) ? Math.max(0, Math.min(1, stagger)) : 0;
  if (!(s > 0) || !(count > 1)) return p;
  const i = Number.isFinite(index) ? Math.max(0, Math.min(count - 1, index)) : 0;
  const start = s * (i / (count - 1));
  return Math.max(0, Math.min(1, (p - start) / (1 - s)));
}
