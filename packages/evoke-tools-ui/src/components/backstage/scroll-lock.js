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

/** 打开一个全屏页：首个实例挂 class */
export function lockRootScroll() {
  lockCount += 1
  if (lockCount === 1) document.documentElement.classList.add(LOCK_CLASS)
}

/** 关闭一个全屏页：最后一个实例归 0 才摘 class */
export function unlockRootScroll() {
  if (lockCount === 0) return
  lockCount -= 1
  if (lockCount === 0) document.documentElement.classList.remove(LOCK_CLASS)
}
