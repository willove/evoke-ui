import { expect, test } from '@playwright/test'

/**
 * ui 站视觉基线 — 精选稳定页面
 * 原则：不选运行中含强随机/时钟驱动内容的页面；首批评选首页 + 代表性组件页 + 一个整页案例。
 * 新增页面时先肉眼跑 pnpm visual:update，再连跑两遍确认零差异后提交基线。
 */
const PAGES = [
  ['home', '/'],
  ['components-button', '/components/button'],
  ['components-card', '/components/card'],
  ['components-alert', '/components/alert'],
  ['components-icon', '/components/icon'],
  ['case-corporate', '/cases/corporate'],
]

for (const [name, path] of PAGES) {
  test(`ui 站 · ${name}`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    // 懒加载图片不参与 networkidle，等全部落定（onerror 也放行，避免坏图挂死）
    await page.evaluate(async () => {
      const imgs = [...document.images]
      await Promise.all(
        imgs.map((img) =>
          img.complete ? Promise.resolve() : new Promise((r) => { img.onload = img.onerror = r }),
        ),
      )
    })
    await page.waitForTimeout(250) // 字体替换 / 布局收敛余量
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true })
  })
}
