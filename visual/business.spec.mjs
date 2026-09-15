import { expect, test } from '@playwright/test'
import { settle } from './helpers.mjs'

/**
 * business 站（docs/）视觉基线 — 精选稳定页面 + 暗色轮次
 * 原则同 ui 站：不选运行中含强随机/时钟驱动内容的页面（countdown/chatbot/ai-* 等不收）。
 * 暗色走 localStorage 'bd-dark'，DocLayout 挂载时统一应用 html.dark。
 */
const PAGES = [
  ['home', '/'],
  ['components-overview', '/components/overview'],
  ['components-button', '/components/button'],
  ['components-form', '/components/form'],
  ['components-data-table', '/components/data-table'],
  ['components-menu', '/components/menu'],
  ['guide-design', '/guide/design'],
  ['chart-embedded', '/chart'],
]

// 暗色二轮：代表页各取一张（首页 / 基础组件 / 数据表格 / 规范文档）
const DARK_PAGES = [
  ['home', '/'],
  ['components-button', '/components/button'],
  ['components-data-table', '/components/data-table'],
  ['guide-design', '/guide/design'],
]

async function shoot(page, path, name) {
  await page.goto(path, { waitUntil: 'networkidle' })
  await settle(page)
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true })
}

for (const [name, path] of PAGES) {
  test(`business 站 · ${name}`, async ({ page }) => {
    await shoot(page, path, name)
  })
}

for (const [name, path] of DARK_PAGES) {
  test(`business 站 · 暗色 ${name}`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('bd-dark', '1'))
    await shoot(page, path, `dark-${name}`)
  })
}
