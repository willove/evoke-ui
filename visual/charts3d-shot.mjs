/**
 * Charts 3D 实拍脚本 — playground 截图 + DOM 探针 + 交互验证
 * 用法: node visual/charts3d-shot.mjs [输出目录]
 */
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const outDir = process.argv[2] || '/tmp/charts3d-shots'
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1400 }, deviceScaleFactor: 2 })

const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console.error: ${m.text()}`)
})

await page.goto('http://localhost:8630/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1600) // 等进场动画走完

// ── 探针：六张图都应产出非空 canvas 且有像素 ──
const probe = await page.evaluate(() => {
  const canvases = [...document.querySelectorAll('.ev-chart3d__canvas')]
  return canvases.map((c) => {
    const gl = c.getContext('2d')
    let painted = 0
    try {
      const { width, height } = c
      const data = gl.getImageData(0, 0, width, height).data
      let hit = 0
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] !== 0) hit++
        if (hit > 500) break
      }
      painted = hit
    } catch (e) {
      painted = -1
    }
    return { w: c.width, h: c.height, painted }
  })
})
console.log('probe:', JSON.stringify(probe))

await page.screenshot({ path: `${outDir}/01-light-overview.png`, fullPage: true })

// ── 悬浮柱体：tooltip 出现 ──
const barCanvas = page.locator('.ev-chart3d__canvas').first()
const box = await barCanvas.boundingBox()
await page.mouse.move(box.x + box.width * 0.52, box.y + box.height * 0.62)
await page.waitForTimeout(500)
const tooltipText = await page.locator('.ev-chart3d__tooltip').first().textContent().catch(() => null)
console.log('tooltip:', tooltipText)
await page.screenshot({ path: `${outDir}/02-hover-tooltip.png`, clip: { x: 0, y: 0, width: 760, height: 560 } })

// ── 拖拽旋转：改变视角后截图 ──
await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5)
await page.mouse.down()
await page.mouse.move(box.x + box.width * 0.5 + 160, box.y + box.height * 0.5 - 60, { steps: 8 })
await page.mouse.up()
await page.waitForTimeout(600)
await page.screenshot({ path: `${outDir}/03-after-orbit.png`, clip: { x: 0, y: 0, width: 760, height: 560 } })

// ── 深色模式 ──
await page.getByRole('button', { name: '深色' }).click()
await page.waitForTimeout(900)
await page.screenshot({ path: `${outDir}/04-dark-overview.png`, fullPage: true })

// ── 自动旋转：数值探针（像素比对受环境 rAF 节流影响不可靠）──
await page.getByRole('button', { name: '自动旋转' }).click()
await page.waitForTimeout(300)
const yawA = await page.evaluate(() => {
  const el = document.querySelector('.ev-chart3d')
  const exposed = el && el.__vueParentComponent && el.__vueParentComponent.exposed
  return exposed ? exposed.getCamera().yaw : null
})
await page.waitForTimeout(800)
const yawB = await page.evaluate(() => {
  const el = document.querySelector('.ev-chart3d')
  const exposed = el && el.__vueParentComponent && el.__vueParentComponent.exposed
  return exposed ? exposed.getCamera().yaw : null
})
console.log('autoRotate yaw delta:', yawB === null || yawA === null ? 'n/a' : Math.round((yawB - yawA) * 10) / 10)
await page.screenshot({ path: `${outDir}/05-autorotate.png`, clip: { x: 0, y: 0, width: 760, height: 560 } })

// ── 恢复浅色收尾 ──
await page.getByRole('button', { name: '浅色' }).click()

await browser.close()
console.log('errors:', errors.length ? errors : 'none')
