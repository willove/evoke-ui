import { expect, test } from '@playwright/test'
import { settle } from './helpers.mjs'

/**
 * tools-ui 视觉回归（tools-ui 计划 06 §二 L3）
 *
 * 目标 = 工作台装配示例（examples/tools-workbench，真实 chrome 装配 = 预算与不变量的
 * 活样本）。原则：**只断言预算与不变量，不做全像素签名比对**——
 *   · chrome 预算：顶部 ≤ 156px / 合计 ≤ 180px / 折叠后顶部 ≤ 84px（密度三档各自成立）
 *   · 单行不变量：工具区 scrollHeight ≤ clientHeight + 1；组标题行同一 y
 *   · 齐次性：无空白图标按钮（每个 .et-toolbtn 都有 svg 或可见文字）
 *   · 三档密度实测：大钮 48/56/64、小钮 24/28/36（与令牌逐项一致）
 *   · 态覆盖：默认 / hover / 选中(active) / 禁用 各有基线截图
 *
 * 默认态即测试态：不给测试留"展开全部"类逃生口（上一代 93/117 spec 走逃生口的教训）。
 */

const TOP_BUDGET = 156 // 默认档组成分之和（紧凑 148 / 宽松 164，预算随分量派生）
const FIXED = { titlebar: 32, tabstrip: 26, auxbar: 26, statusbar: 24, groupLabel: 16 }

/** 高度实测封装（元素盒高，含边框） */
async function chromeHeights(page) {
  return page.evaluate(() => {
    const row = (sel) => {
      const el = document.querySelector(sel)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return Math.round(r.height * 100) / 100
    }
    return {
      titlebar: row('.wb__titlebar'),
      tabstrip: row('.wb__tabstrip'),
      toolarea: row('.wb__toolarea'),
      auxbar: row('.wb__auxbar'),
      statusbar: row('.wb__statusbar'),
    }
  })
}

/** 切密度：直接写 <html data-density>（与 EtProvider 同机制；示例控件也走这条） */
async function setDensity(page, density) {
  await page.evaluate((d) => document.documentElement.setAttribute('data-density', d), density)
  await settle(page, { extraMs: 120 })
}

async function setDark(page, dark) {
  await page.evaluate((v) => {
    document.documentElement.classList.toggle('dark', v)
  }, dark)
  await settle(page, { extraMs: 120 })
}

/** 大钮 / 小钮实测高度（取每组第一个） */
async function toolbtnHeights(page) {
  return page.evaluate(() => {
    const h = (sel) => {
      const el = document.querySelector(sel)
      return el ? Math.round(el.getBoundingClientRect().height) : null
    }
    return { large: h('.et-toolbtn--large'), small: h('.et-toolbtn--small') }
  })
}

// ─── 不变量（预算/单行/齐次/标题基线）────────────────────────────────────

for (const density of ['compact', 'default', 'relaxed']) {
  test(`tools 不变量 · ${density}`, async ({ page }) => {
    await page.goto('/')
    await settle(page)
    await setDensity(page, density)

    const h = await chromeHeights(page)
    // 预算断言（G7 的浏览器侧落点）。预算 = 分量之和（calc 派生，不是第二个手写数字）：
    // 固定带 32+26+26 不随密度变，工具区 = 控件行(大钮高) + 组标题行 16 ——
    // 默认档恰为 156（紧凑 148 / 宽松 164，随分量派生）。
    // 断言"没有任何一带超過自己的组成分"：换行、多余留白、额外的带都会在这里红。
    expect(h.titlebar, `标题栏 ${h.titlebar} ≠ ${FIXED.titlebar}`).toBe(FIXED.titlebar)
    expect(h.tabstrip, `tab 条 ${h.tabstrip} ≠ ${FIXED.tabstrip}`).toBe(FIXED.tabstrip)
    expect(h.auxbar, `辅助栏 ${h.auxbar} ≠ ${FIXED.auxbar}`).toBe(FIXED.auxbar)
    expect(h.statusbar, `状态栏 ${h.statusbar} ≠ ${FIXED.statusbar}`).toBe(FIXED.statusbar)

    // 三档密度实测 = 令牌值（check-density.mjs 的浏览器侧落点）
    const sizes = await toolbtnHeights(page)
    const expectedLarge = { compact: 48, default: 56, relaxed: 64 }[density]
    const expectedSmall = { compact: 24, default: 28, relaxed: 36 }[density]
    expect(sizes.large, `大钮高度 ${sizes.large} ≠ ${expectedLarge}`).toBe(expectedLarge)
    expect(sizes.small, `小钮高度 ${sizes.small} ≠ ${expectedSmall}`).toBe(expectedSmall)

    const expectedToolarea = expectedLarge + FIXED.groupLabel
    expect(h.toolarea, `工具区 ${h.toolarea} ≠ ${expectedToolarea}（控件行+组标题行）`).toBe(expectedToolarea)
    const top = h.titlebar + h.tabstrip + h.toolarea + h.auxbar
    const expectedTop = FIXED.titlebar + FIXED.tabstrip + expectedToolarea + FIXED.auxbar
    expect(top, `顶部 chrome ${top}px > 组成分 ${expectedTop}px`).toBeLessThanOrEqual(expectedTop)
    const total = top + h.statusbar
    expect(total, `合计 chrome ${total}px > 组成分 ${expectedTop + FIXED.statusbar}px`).toBeLessThanOrEqual(
      expectedTop + FIXED.statusbar,
    )

    // 单行不变量：工具区不换行（flex-wrap: nowrap + 溢出测量，禁换行撑高）
    const single = await page.evaluate(() => {
      const el = document.querySelector('.wb__toolarea')
      return el ? el.scrollHeight <= el.clientHeight + 1 : true
    })
    expect(single, '工具区必须单行（scrollHeight ≤ clientHeight + 1）').toBe(true)

    // 组标题行同一条基线（上一代"组名三基线"缺陷门）
    const labelTops = await page.evaluate(() =>
      [...document.querySelectorAll('.et-toolgroup__label')].map((el) =>
        Math.round(el.getBoundingClientRect().top),
      ),
    )
    expect(labelTops.length).toBeGreaterThan(1)
    expect(new Set(labelTops).size, `组标题行 y 不一致：${labelTops.join('/')}`).toBe(1)

    // 齐次性：无空白图标按钮（白块按钮缺陷的回归门）
    const blank = await page.evaluate(() =>
      [...document.querySelectorAll('.et-toolbtn')].filter(
        (el) => !el.querySelector('svg') && !el.textContent.trim(),
      ).length,
    )
    expect(blank, '存在无图标无文字的空白按钮').toBe(0)
  })
}

// ─── 基线截图（三档密度 × 明暗 × 态）────────────────────────────────────
// 态截图走 locator.toHaveScreenshot：基线与整页基线同目录同管理（仓内范式），
// 早期版本用 locator.screenshot({path}) 会把 PNG 落到仓库根，已废弃。

async function shootWorkbench(page, name, { density = 'default', dark = false } = {}) {
  await page.goto('/')
  await settle(page)
  await setDensity(page, density)
  await setDark(page, dark)
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true })
}

test('tools 基线 · 工作台默认档', async ({ page }) => {
  await shootWorkbench(page, 'tools-workbench-default')
})

test('tools 基线 · 工作台紧凑档', async ({ page }) => {
  await shootWorkbench(page, 'tools-workbench-compact', { density: 'compact' })
})

test('tools 基线 · 工作台宽松档', async ({ page }) => {
  await shootWorkbench(page, 'tools-workbench-relaxed', { density: 'relaxed' })
})

test('tools 基线 · 工作台暗色', async ({ page }) => {
  await shootWorkbench(page, 'tools-workbench-dark', { dark: true })
})

test('tools 基线 · hover 态', async ({ page }) => {
  await page.goto('/')
  await settle(page)
  const btn = page.locator('.et-toolbtn--large').first()
  await btn.hover()
  await settle(page, { extraMs: 350 })
  await expect(btn).toHaveScreenshot('tools-state-hover.png')
})

test('tools 基线 · 选中态', async ({ page }) => {
  await page.goto('/')
  await settle(page)
  await expect(page.locator('.et-toolbtn.is-active').first()).toHaveScreenshot('tools-state-active.png')
})

test('tools 基线 · 禁用态', async ({ page }) => {
  await page.goto('/')
  await settle(page)
  await expect(page.locator('.et-toolbtn:disabled').first()).toHaveScreenshot('tools-state-disabled.png')
})

test('tools 基线 · ScreenTip（键盘聚焦）', async ({ page }) => {
  await page.goto('/')
  await settle(page)
  await page.locator('.et-toolbtn--small').first().focus()
  await settle(page, { extraMs: 550 })
  await expect(page.locator('.et-screentip__popper').first()).toHaveScreenshot('tools-state-screentip.png')
})

// ─── 图标底座对比（计划 04 §七 M0 交付物 5 的留档面）────────────────────

test('tools 基线 · 图标底座对比 Remix vs Fluent', async ({ page }) => {
  await page.goto('/')
  await settle(page)
  // 视图切换是 EbSegmented（role=tab 的 tablist，不是 button）；exact 避开 tablist 的聚合可访问名
  await page.getByRole('tab', { name: '图标对比', exact: true }).click()
  await settle(page, { extraMs: 300 })
  await expect(page).toHaveScreenshot('tools-icons-compare.png', { fullPage: true })
})
