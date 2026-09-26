/**
 * 根滚动锁 — 计数式（EtBackstage 专用，M3 出口条件三）
 *
 * 计数必须活在模块作用域：`<script setup>` 的函数体每实例跑一遍，写在组件里
 * 的 `let lockCount` 是每实例一份，多实例叠加时会提前摘锁（页面中途回弹）。
 * 这里做成独立模块（ES module 单实例）供组件 import。
 *
 * 半开区间不变量：count === 1 时挂 class，归 0 才摘；中途关闭任意一个实例，
 * 其余实例仍锁着（画布尺寸稳定，不横跳）。
 */

/** 加在 documentElement 上的锁滚动 class（规则在 backstage/style.css） */
const LOCK_CLASS = 'et-scroll-lock'

let lockCount = 0

/**
 * 打开一个全屏页：首个实例挂 class。
 *
 * 滚动条缺口的补偿必须**实测**：锁之前 documentElement 有滚动条时（innerWidth >
 * clientWidth），overflow:hidden 会摘掉它、内容突然变宽 = 画布横跳；没有滚动条时
 * 补偿必须是 0——\`scrollbar-gutter: stable\` 看着能解决，实测会**凭空造** 5px 槽位
 * （M3 视觉用例抓到过：没有滚动条的页面加 stable 反而跳 5px），所以不用它，
 * 改用把实测缺口写成 padding-right（有则补、无则 0）。
 */
export function lockRootScroll() {
  lockCount += 1
  if (lockCount !== 1) return
  const root = document.documentElement
  // clientWidth 为 0 = 无布局环境（jsdom / SSR）：没有滚动条可摘，也不补
  const gutter = root.clientWidth ? Math.max(0, window.innerWidth - root.clientWidth) : 0
  if (gutter > 0) root.style.paddingRight = `${gutter}px`
  root.classList.add(LOCK_CLASS)
}

/** 关闭一个全屏页：最后一个实例归 0 才摘 class（连同补偿一起还原） */
export function unlockRootScroll() {
  if (lockCount === 0) return
  lockCount -= 1
  if (lockCount !== 0) return
  const root = document.documentElement
  root.classList.remove(LOCK_CLASS)
  root.style.removeProperty('padding-right')
}
