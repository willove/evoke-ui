import { expect, test } from '@playwright/test'
import { settle } from './helpers.mjs'

/**
 * charts 站（docs-charts/）视觉基线 — 精选稳定页面 + 暗色轮次
 * 图表为 canvas 入场动画（rAF 驱动），settle 需加长余量等全部画完；
 * 暗色走 localStorage 'cd-dark'，DocLayout 挂载时统一应用 html.dark
 * （初始化脚本先于页面脚本运行，图表首帧即按暗色渲染）。
 * /3d/ 前缀为三维篇章页面（canvas 3D，进场动画默认 600ms）。
 */
const PAGES = [
  ['home', '/'],
  ['chart-line', '/chart/line'],
  ['chart-bar', '/chart/bar'],
  ['chart-pie', '/chart/pie'],
  ['chart-mixed', '/chart/mixed'],
  ['example-dashboard', '/examples/dashboard'],
  ['3d-index', '/3d/'],
  ['3d-bar3d', '/3d/bar3d'],
  ['3d-surface3d', '/3d/surface3d'],
  ['3d-pie3d', '/3d/pie3d'],
]

const DARK_PAGES = [
  ['chart-line', '/chart/line'],
  ['example-dashboard', '/examples/dashboard'],
  ['3d-bar3d', '/3d/bar3d'],
  ['3d-surface3d', '/3d/surface3d'],
]

async function shoot(page, path, name) {
  await page.goto(path, { waitUntil: 'networkidle' })
  await settle(page, { extraMs: 1800 }) // 覆盖图表入场动画（默认约 1s）+ 布局收敛
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true })
}

for (const [name, path] of PAGES) {
  test(`charts 站 · ${name}`, async ({ page }) => {
    await shoot(page, path, name)
  })
}

for (const [name, path] of DARK_PAGES) {
  test(`charts 站 · 暗色 ${name}`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('cd-dark', '1'))
    await shoot(page, path, `dark-${name}`)
  })
}
