/**
 * charts-3d 文档站实拍 — 全页面截图 + 交互探针
 * 用法: node visual/charts3d-docs-shot.mjs [输出目录] （需先 build，preview 跑在 4176）
 */
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const outDir = process.argv[2] || '/tmp/charts3d-docs-shots'
mkdirSync(outDir, { recursive: true })

const PAGES = [
  ['01-home', '/'],
  ['02-chart-index', '/chart/'],
  ['03-bar3d', '/chart/bar3d'],
  ['04-line3d', '/chart/line3d'],
  ['05-scatter3d', '/chart/scatter3d'],
  ['06-surface3d', '/chart/surface3d'],
  ['07-pie3d', '/chart/pie3d'],
  ['08-api', '/chart/api'],
  ['09-guide-camera', '/guide/camera'],
  ['10-guide-theme', '/guide/theme'],
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1.5 })
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console.error: ${m.text().slice(0, 200)}`)
})

for (const [name, path] of PAGES) {
  await page.goto(`http://127.0.0.1:4176${path}`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1400)
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true })
}

// 交互探针：bar3d 页悬浮 tooltip
await page.goto('http://127.0.0.1:4176/chart/bar3d', { waitUntil: 'networkidle' })
await page.waitForTimeout(1400)
const canvas = page.locator('.ev-chart3d__canvas').first()
const box = await canvas.boundingBox()
await page.mouse.move(box.x + box.width * 0.52, box.y + box.height * 0.55)
await page.waitForTimeout(400)
console.log('tooltip:', await page.locator('.ev-chart3d__tooltip').first().textContent().catch(() => null))

// 暗色
await page.evaluate(() => {
  document.documentElement.classList.add('dark')
  document.dispatchEvent(new CustomEvent('ev-theme-change', { bubbles: true }))
})
await page.waitForTimeout(700)
await page.screenshot({ path: `${outDir}/11-dark-bar3d.png`, fullPage: true })

await browser.close()
console.log('errors:', errors.length ? errors : 'none')
