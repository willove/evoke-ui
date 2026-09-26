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

/**
 * 容器边界守卫（计算样式断言，非截图）
 * 规则来源：AGENTS.md「evoke-ui 整页组装硬规则」+ section 文档「整页组装规则」。
 * 防两类历史回归：
 *   ① 区块漏定宽——不写 width 时曾是 full 通栏（0.13.0 起默认 default 档）；
 *   ② 只给主体内层手写 max-width——标题通栏、卡片居中，同一区块两条左边界。
 * 审 live 全屏版而非案例文档页的缩放舞台：舞台带 zoom，会把档位宽度一起缩放，量不准。
 */
// 笔记案例整页是 div 栅格（无 EvSection），不纳入守卫
const GUARD_PAGES = ['/', '/cases/live/corporate', '/cases/live/blog', '/components/section']
const TIERS = ['920px', '1152px', '1360px']

for (const path of GUARD_PAGES) {
  test(`容器边界守卫 · ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(250)

    const report = await page.evaluate((tiers) => {
      const sections = [...document.querySelectorAll('.ev-section')]
      const widths = sections.map((s) => ({
        title: s.querySelector('.ev-section__title')?.textContent?.slice(0, 14) ?? '(无标题)',
        maxWidth: getComputedStyle(s).maxWidth,
      }))
      // 同边：标题、主体、主体的第一个块级子元素，三者左边缘必须重合
      const edges = sections
        .map((s) => {
          const title = s.querySelector('.ev-section__title')
          const body = s.querySelector('.ev-section__body')
          if (!title || !body) return null
          const first = body.firstElementChild
          // 行级首子元素（行内按钮等）由文本对齐决定位置，不参与左边缘判定
          if (first && getComputedStyle(first).display.startsWith('inline')) return null
          const t = title.getBoundingClientRect().left
          const b = body.getBoundingClientRect().left
          const f = first ? first.getBoundingClientRect().left : b
          return {
            title: title.textContent.slice(0, 14),
            same: Math.abs(t - b) < 1 && Math.abs(t - f) < 1,
          }
        })
        .filter(Boolean)
      return { widths, edges }
    }, TIERS)

    expect(report.widths.length, `${path} 未渲染出 EvSection`).toBeGreaterThan(0)
    expect(report.widths.filter((w) => !TIERS.includes(w.maxWidth))).toEqual([])
    expect(report.edges.filter((e) => !e.same)).toEqual([])
  })
}
