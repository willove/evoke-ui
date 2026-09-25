/**
 * Tab 条溢出规划（纯函数：tools-ui 计划 06 §二 L1 契约层）
 *
 * 为什么抽成纯函数：窄屏收哪些条目、给「更多」入口留多少宽，是 EtTabStrip 唯一需要
 * 单测的算法面 —— 组件可重做，契约错了全盘皆错。与 DOM 测量解耦后，jsdom（无布局）
 * 也能直接验算，组件里只负责把实测宽度喂进来。
 */

/**
 * @param {number[]} widths 各条目实测宽（含自身内边距；顺序即排列顺序）
 * @param {number} available 容器可用宽
 * @param {{ gap?: number, moreWidth?: number }} [options]
 *   gap 条目间距；moreWidth 「更多」入口实测宽（仅在确实溢出时占用一行空间）
 * @returns {{ visible: number[], overflow: number[] }} 条目下标划分（保持原顺序）
 */
export function planOverflow(widths, available, options = {}) {
  const gap = Number.isFinite(options.gap) ? Math.max(0, options.gap) : 0
  const moreWidth = Number.isFinite(options.moreWidth) ? Math.max(0, options.moreWidth) : 0
  const total = widths.length
  const range = (from, to) => Array.from({ length: Math.max(0, to - from) }, (_, i) => from + i)
  const safe = (w) => (Number.isFinite(w) ? Math.max(0, w) : 0)

  if (total === 0) return { visible: [], overflow: [] }

  /** 前 n 个条目成一行所需宽度：n 个条目 + (n-1) 个间距；有溢出时再加上「更多」入口 */
  const rowWidth = (n, withMore) => {
    const slots = n + (withMore ? 1 : 0)
    return (
      widths.slice(0, n).reduce((sum, w) => sum + safe(w), 0) +
      (withMore ? moreWidth : 0) +
      gap * Math.max(0, slots - 1)
    )
  }

  // 全放得下：无溢出，「更多」入口退出文档流（不占宽）
  if (rowWidth(total, false) <= available) {
    return { visible: range(0, total), overflow: [] }
  }

  // 有溢出：从最长可见前缀往下找，直到连带「更多」入口一起放得下
  for (let n = total - 1; n >= 0; n--) {
    if (rowWidth(n, true) <= available) {
      return { visible: range(0, n), overflow: range(n, total) }
    }
  }

  // 连一个条目都放不下（极窄容器）：全部收进「更多」
  return { visible: [], overflow: range(0, total) }
}
