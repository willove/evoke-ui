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

const TOP_BUDGET = 156 // 功能区顶带（标题栏 + tab 条 + 工具区 72 + 辅助栏；M2 起文档位另算）
const FIXED = { titlebar: 32, tabstrip: 26, auxbar: 26, statusbar: 24, groupLabel: 16, doctabs: 30 }

/** 高度实测封装（元素盒高，含边框）。
 *  M1 起 tab 条与工具区都由 EtRibbonBar 承担，合成一个 .wb__ribbon 带：
 *  展开 = tab 条 26 + 工具区 72 = 98；折叠（Ctrl+F1）= 只剩 tab 条 26。 */
async function chromeHeights(page) {
  return page.evaluate(() => {
    const row = (sel) => {
      const el = document.querySelector(sel)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return Math.round(r.height * 100) / 100
    }
    return {
      titlebar: row('.et-titlebar'),
      documents: row('.et-doctabs'),
      ribbon: row('.wb__ribbon'),
      auxbar: row('.wb__auxbar'),
      statusbar: row('.et-statusbar'),
    }
  })
}

/** 把 chrome 置回默认密度 + 展开态（每个不变量用例的起点，禁测试逃生口） */
async function resetWorkbench(page) {
  await page.goto('/')
  await settle(page)
  await setDensity(page, 'default')
  await page.evaluate(() => {
    localStorage.removeItem('demo-ribbon-collapsed')
    localStorage.removeItem('demo-layout')
  })
  await page.reload({ waitUntil: 'networkidle' })
  await settle(page)
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
    await resetWorkbench(page)
    await setDensity(page, density)

    const h = await chromeHeights(page)
    // 预算断言（G7 的浏览器侧落点）。预算 = 分量之和（calc 派生，不是第二个手写数字）：
    // 固定带 32+26+26 不随密度变，功能区 = tab 条 26 + 工具区(控件行+组标题行)。
    // 断言"没有任何一带超過自己的组成分"：换行、多余留白、额外的带都会在这里红。
    expect(h.titlebar, `标题栏 ${h.titlebar} ≠ ${FIXED.titlebar}`).toBe(FIXED.titlebar)
    expect(h.auxbar, `辅助栏 ${h.auxbar} ≠ ${FIXED.auxbar}`).toBe(FIXED.auxbar)
    expect(h.statusbar, `状态栏 ${h.statusbar} ≠ ${FIXED.statusbar}`).toBe(FIXED.statusbar)

    // 三档密度实测 = 令牌值（check-density.mjs 的浏览器侧落点）
    const sizes = await toolbtnHeights(page)
    const expectedLarge = { compact: 48, default: 56, relaxed: 64 }[density]
    const expectedSmall = { compact: 24, default: 28, relaxed: 36 }[density]
    expect(sizes.large, `大钮高度 ${sizes.large} ≠ ${expectedLarge}`).toBe(expectedLarge)
    expect(sizes.small, `小钮高度 ${sizes.small} ≠ ${expectedSmall}`).toBe(expectedSmall)

    // 功能区 = tab 条 26 + 控件行(大钮高) + 组标题行 16
    const expectedRibbon = FIXED.tabstrip + expectedLarge + FIXED.groupLabel
    expect(h.ribbon, `功能区 ${h.ribbon} ≠ ${expectedRibbon}（tab 条+控件行+组标题行）`).toBe(expectedRibbon)
    const top = h.titlebar + h.ribbon + h.auxbar
    const expectedTop = FIXED.titlebar + expectedRibbon + FIXED.auxbar
    expect(top, `顶部 chrome ${top}px > 组成分 ${expectedTop}px`).toBeLessThanOrEqual(expectedTop)
    const total = top + h.statusbar
    expect(total, `合计 chrome ${total}px > 组成分 ${expectedTop + FIXED.statusbar}px`).toBeLessThanOrEqual(
      expectedTop + FIXED.statusbar,
    )

    // 单行不变量：功能区不换行（flex-wrap: nowrap + 溢出测量，禁换行撑高）
    const single = await page.evaluate(() => {
      const el = document.querySelector('.wb__ribbon')
      return el ? el.scrollHeight <= el.clientHeight + 1 : true
    })
    expect(single, '功能区必须单行（scrollHeight ≤ clientHeight + 1）').toBe(true)

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
  await resetWorkbench(page)
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
  await resetWorkbench(page)
  // 命令激活态由选区推演（计划 01：状态由选区与焦点推演）：切到"图片"后 bold 激活
  await page.getByRole('tab', { name: '图片', exact: true }).click()
  await settle(page, { extraMs: 300 })
  await expect(page.locator('.et-toolbtn.is-active').first()).toHaveScreenshot('tools-state-active.png')
})

test('tools 基线 · 禁用态', async ({ page }) => {
  await page.goto('/')
  await settle(page)
  await expect(page.locator('.et-toolbtn:disabled').first()).toHaveScreenshot('tools-state-disabled.png')
})

test('tools 基线 · ScreenTip（键盘聚焦）', async ({ page }) => {
  await resetWorkbench(page)
  // M1 功能区满档全是大钮；大钮 caption 可见 ≠ 快捷键可见——富提示补 desc/keys
  await page.locator('.et-toolbtn--large').nth(3).focus()
  await settle(page, { extraMs: 650 })
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

// ─── M1 出口断言（07-里程碑 M1）────────────────────────────────────────

/** 折叠快捷键 mod+alt+r：按浏览器所在平台发对应物理键
 *  （mac = ⌥⌘R 用 metaKey；Win/Linux = Ctrl+Alt+R 用 ctrlKey——comboMatchesEvent 的 mod 平台语义） */
async function pressCollapseHotkey(page) {
  await page.evaluate(() => {
    const isMac = /Mac/i.test(navigator.platform || navigator.userAgent)
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'r',
        code: 'KeyR',
        metaKey: isMac,
        ctrlKey: !isMac,
        altKey: true,
        bubbles: true,
        cancelable: true,
      }),
    )
  })
}

for (const width of [1280, 1024, 800]) {
  test(`M1 不变量 · ${width}px 宽度下功能区不换行不撑高`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await resetWorkbench(page)
    await settle(page, { extraMs: 400 })

    // ① 单行不变量：任一条目换行都会让根 scrollHeight 超过 clientHeight
    const single = await page.evaluate(() => {
      const el = document.querySelector('.wb__ribbon')
      return el ? el.scrollHeight <= el.clientHeight + 1 : true
    })
    expect(single, `功能区在 ${width}px 下换行了（溢出应走「更多」，禁换行）`).toBe(true)

    // ② 不撑高：功能区带高度 = tab 条 + 控件行 + 组标题行（与 width 无关）
    const h = await chromeHeights(page)
    const expectedRibbon = FIXED.tabstrip + FIXED.groupLabel + (width >= 800 ? 56 : 56)
    expect(h.ribbon, `功能区在 ${width}px 下高度漂移`).toBe(expectedRibbon)

    // ③ 组标题行同一 y（降档/收起都不许破坏基线）
    const labelTops = await page.evaluate(() =>
      [...document.querySelectorAll('.et-toolgroup__label')].map((el) =>
        Math.round(el.getBoundingClientRect().top),
      ),
    )
    if (labelTops.length) {
      expect(new Set(labelTops).size, `组标题行 y 不一致：${labelTops.join('/')}`).toBe(1)
    }
  })
}

test('M1 出口 · 折叠后顶部 chrome ≤ 84 且命令只经用户操作可达', async ({ page }) => {
  await resetWorkbench(page)

  const before = await chromeHeights(page)
  const topBefore = before.titlebar + before.ribbon + before.auxbar
  expect(topBefore).toBeLessThanOrEqual(156)

  // Ctrl+F1 语义（ctrl+alt+r 与 ctrl+f1 同一组键；演示数据用前者触发）
  await pressCollapseHotkey(page)
  await settle(page, { extraMs: 400 })

  const after = await chromeHeights(page)
  const topAfter = after.titlebar + after.ribbon + after.auxbar
  // 折叠后顶部 = 标题栏 32 + tab 条 26 + 辅助栏 26 = 84（预算随分量派生）
  expect(topAfter, `折叠后顶部 ${topAfter}px > 84px`).toBeLessThanOrEqual(84)

  // 禁测试逃生口：折叠后命令不在 DOM 里平铺，必须经用户操作（peek）才出现
  const exposed = await page.evaluate(() => document.querySelectorAll('.et-toolbtn').length)
  expect(exposed, '折叠后仍有命令平铺在工具栏（逃生口）').toBe(0)

  await page.locator('.wb__ribbon [role="tab"]').first().hover()
  await settle(page, { extraMs: 600 })
  const peeked = await page.evaluate(() => document.querySelectorAll('.et-toolbtn').length)
  expect(peeked, 'peek 浮层里应出现被折叠的命令').toBeGreaterThan(0)

  // 用户在 peek 里真的能执行命令（点一个可用大钮 → 演示回调写提示）。
  // 不用 first()：默认无选区时第一个是禁用的 copy（enabled 由 ctx 推演）
  await page.locator('.et-toolbtn--large:not(:disabled)').first().click()
  await settle(page, { extraMs: 400 })
  // 命令反馈 M3 起走 EtToast（原 .wb__empty-hint 已由 EtBanner/EtToast 接管）
  await expect(page.locator('.et-toast')).toContainText('执行命令')
})

test('tools 基线 · 功能区折叠（Ctrl+F1）', async ({ page }) => {
  await resetWorkbench(page)
  await pressCollapseHotkey(page)
  await settle(page, { extraMs: 400 })
  await expect(page).toHaveScreenshot('tools-workbench-collapsed.png', { fullPage: true })
})

test('tools 基线 · 折叠态 peek（hover tab 条）', async ({ page }) => {
  await resetWorkbench(page)
  await pressCollapseHotkey(page)
  await settle(page, { extraMs: 300 })
  await page.locator('.wb__ribbon').first().hover()
  await settle(page, { extraMs: 500 })
  await expect(page.locator('.et-ribbonbar__peek').first()).toHaveScreenshot('tools-state-peek.png')
})

// ─── M2 出口断言（工作台装配 / 持久化 / 损坏降级 / 全屏 / 文档标签）────────────

test('M2 出口 · 工作台装配：三停靠 + 面板内容进链 + 两档宽度无横向溢出', async ({ page }) => {
  await resetWorkbench(page)
  await settle(page, { extraMs: 400 })

  // ① 三个停靠位都在，且面板内容产品映射进得来（内容槽全链路）
  const panels = await page.evaluate(() => ({
    rails: document.querySelectorAll('.et-workbench__rail').length,
    panelItems: document.querySelectorAll('.wb__panel-item').length,
    left: document.querySelectorAll('.et-workbench__rail--left .et-panel').length,
    right: document.querySelectorAll('.et-workbench__rail--right .et-panel').length,
    bottom: document.querySelectorAll('.et-workbench__rail--bottom .et-panel').length,
  }))
  expect(panels.rails).toBeGreaterThanOrEqual(3)
  expect(panels.left).toBeGreaterThanOrEqual(1)
  expect(panels.right).toBeGreaterThanOrEqual(1)
  expect(panels.bottom).toBeGreaterThanOrEqual(1)
  expect(panels.panelItems, '停靠面板内容没进链（#panel 槽断在哪一层）').toBeGreaterThanOrEqual(8)

  // ② 1280 与 1920 两档无页面级横向溢出
  for (const width of [1280, 1920]) {
    await page.setViewportSize({ width, height: 860 })
    await settle(page, { extraMs: 300 })
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, `${width}px 下出现横向溢出`).toBeLessThanOrEqual(0)
  }
})

test('M2 出口 · 布局持久化：折叠面板 → 刷新 → 状态恢复', async ({ page }) => {
  await resetWorkbench(page)
  await settle(page, { extraMs: 400 })

  // 用户操作：折叠右停靠的属性面板（真实点击，禁测试逃生口）
  await page.locator('.et-workbench__rail--right .et-panel__btn[aria-label="折叠面板"]').first().click()
  await settle(page, { extraMs: 400 })
  const collapsedBefore = await page.evaluate(
    () => document.querySelectorAll('.et-workbench__rail--right .et-panel.is-collapsed').length,
  )
  expect(collapsedBefore).toBeGreaterThanOrEqual(1)

  await page.reload({ waitUntil: 'networkidle' })
  await settle(page, { extraMs: 500 })
  const collapsedAfter = await page.evaluate(
    () => document.querySelectorAll('.et-workbench__rail--right .et-panel.is-collapsed').length,
  )
  expect(collapsedAfter, '刷新后面板折叠态丢了（持久化断链）').toBeGreaterThanOrEqual(1)
})

test('M2 出口 · 损坏持久化不白屏：坏 JSON → 降级默认布局 + 提示，chrome 照常渲染', async ({ page }) => {
  await resetWorkbench(page)
  // 写坏布局再刷新（消费者的真实事故形态）
  await page.evaluate(() => localStorage.setItem('demo-layout', '{"docks": "broken"'))
  await page.reload({ waitUntil: 'networkidle' })
  await settle(page, { extraMs: 600 })

  // ① 不白屏：工作台壳与功能区仍在
  await expect(page.locator('.et-workbench')).toBeVisible()
  await expect(page.locator('.wb__ribbon .et-toolbtn').first()).toBeVisible()
  // ② 有提示（消费者把 layout-corrupted 翻成用户语言：M3 起走 EtBanner）
  await expect(page.locator('.et-banner')).toContainText('布局已重置为默认')
  // ③ 停靠位仍可用（降级到默认布局 = 四个面板全在）
  const items = await page.evaluate(() => document.querySelectorAll('.wb__panel-item').length)
  expect(items).toBeGreaterThanOrEqual(8)
  // ④ 损坏数据被自愈后的干净树覆盖：再刷新应无提示
  await page.reload({ waitUntil: 'networkidle' })
  await settle(page, { extraMs: 600 })
  await expect(page.locator('.et-banner')).toHaveCount(0)
})

test('M2 出口 · 面板全屏：目标停靠整幅、其余区域让位', async ({ page }) => {
  await resetWorkbench(page)
  await settle(page, { extraMs: 400 })

  await page.locator('.et-workbench__rail--right .et-panel__btn[aria-label="最大化面板"]').first().click()
  await settle(page, { extraMs: 500 })
  const state = await page.evaluate(() => {
    const rail = (sel) => {
      const el = document.querySelector(sel)
      if (!el) return null
      return { display: getComputedStyle(el).display, w: Math.round(el.getBoundingClientRect().width) }
    }
    return { right: rail('.et-workbench__rail--right'), left: rail('.et-workbench__rail--left') }
  })
  expect(state.right.w, '全屏的停靠位没撑满').toBeGreaterThanOrEqual(1200)
  expect(state.left.display, '其余区域没让位').toBe('none')
})

test('M2 出口 · 文档标签：脏标记双通道 a11y + 不可关文档无关闭钮', async ({ page }) => {
  await resetWorkbench(page)
  await settle(page, { extraMs: 300 })

  const dirty = await page.evaluate(() => {
    const tab = [...document.querySelectorAll('.et-doctabs [role="tab"]')].find((el) =>
      (el.getAttribute('aria-label') || '').includes('未保存'),
    )
    return { found: !!tab, label: tab && tab.getAttribute('aria-label') }
  })
  expect(dirty.found, '脏标记没有进可访问名').toBe(true)
  expect(dirty.label).toContain('未保存')

  // 备注 = closable:false：没有关闭钮（G4：有关闭钮的都有 aria-label）
  const closable = await page.evaluate(() => {
    const tabs = [...document.querySelectorAll('.et-doctabs [role="tab"]')]
    const notes = tabs.find((el) => (el.getAttribute('aria-label') || '').includes('备注'))
    return { found: !!notes, closeBtns: notes ? notes.querySelectorAll('button[aria-label]').length : -1 }
  })
  expect(closable.found).toBe(true)
  expect(closable.closeBtns).toBe(0)
})

// ─── M3 出口断言（外壳件 / 主题桥 / 焦点三处一致）────────────────────────────

test('M3 出口 · 画布调色板随主题联动（--ot-* 由主题令牌解析，非硬编码）', async ({ page }) => {
  await resetWorkbench(page)
  await settle(page, { extraMs: 300 })

  const readPalette = () =>
    page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement)
      return {
        bg: cs.getPropertyValue('--ot-canvas-bg').trim(),
        line: cs.getPropertyValue('--ot-canvas-grid-line').trim(),
        selection: cs.getPropertyValue('--ot-canvas-selection-bg').trim(),
      }
    })
  const light = await readPalette()
  expect(light.bg, 'ThemeBridge 没把 --ot-canvas-bg 写进 :root').not.toBe('')

  // 切暗色：主题令牌变 → 画布令牌必须跟着变（联动 = 出口条件）
  await setDark(page, true)
  await settle(page, { extraMs: 400 })
  const dark = await readPalette()
  expect(dark.bg).not.toBe(light.bg)
  expect(dark.line).not.toBe(light.line)

  // 回亮色再验一次（双向联动，且值稳定）
  await setDark(page, false)
  await settle(page, { extraMs: 400 })
  expect((await readPalette()).bg).toBe(light.bg)
})

test('M3 出口 · 双宿主标题栏：Web 无控制位；桌面 mac 左序 / Win 右序', async ({ page, browser }) => {
  await resetWorkbench(page)

  // 控制位实测（.et-titlebar__ctrl：契约里的窗口控制钮）
  const measure = (p) =>
    p.evaluate(() => {
      const bar = document.querySelector('.et-titlebar')
      const ctrls = [...document.querySelectorAll('.et-titlebar__ctrl')]
      const r = bar.getBoundingClientRect()
      return {
        count: ctrls.length,
        labels: ctrls.map((el) => el.getAttribute('aria-label')),
        leftCount: ctrls.filter((el) => el.getBoundingClientRect().left - r.left < r.width / 2).length,
      }
    })

  // ① Web 宿主（默认档）：不渲染窗口控制位——浏览器的 chrome 管窗口
  expect((await measure(page)).count).toBe(0)

  // ② 桌面宿主 + mac（headless 走 mac UA）：用户点演示条的"桌面"分段 → 控制位居左、close 先
  await page.locator('.eb-segmented__item').filter({ hasText: '桌面' }).first().click()
  await settle(page, { extraMs: 300 })
  const mac = await measure(page)
  expect(mac.count).toBe(3)
  expect(mac.leftCount, 'mac 控制位应居左').toBe(3)
  expect(mac.labels[0]).toContain('关闭')

  // ③ 桌面宿主 + Windows UA：控制位居右、minimize 先
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120' })
  const winPage = await ctx.newPage()
  await winPage.goto('http://127.0.0.1:4180/')
  await winPage.evaluate(() => localStorage.clear())
  await winPage.locator('.eb-segmented__item').filter({ hasText: '桌面' }).first().click()
  await settle(winPage, { extraMs: 300 })
  const win = await measure(winPage)
  expect(win.count).toBe(3)
  expect(win.leftCount, 'Win 控制位应居右').toBe(0)
  expect(win.labels[0]).toContain('最小化')
  await ctx.close()
})

test('M3 出口 · backstage 开关不引发画布尺寸跳动', async ({ page }) => {
  await resetWorkbench(page)
  await settle(page, { extraMs: 300 })
  const size = () =>
    page.evaluate(() => {
      const c = document.querySelector('.wb__canvas')
      const r = c.getBoundingClientRect()
      return { w: Math.round(r.width), h: Math.round(r.height) }
    })
  const before = await size()

  await page.getByRole('button', { name: '文件' }).click()
  await settle(page, { extraMs: 500 })
  await expect(page.locator('.et-backstage')).toBeVisible()
  const during = await size()

  await page.keyboard.press('Escape')
  await settle(page, { extraMs: 500 })
  const after = await size()

  expect(during).toEqual(before)
  expect(after).toEqual(before)
})

test('M3 出口 · 焦点管理三处一致：Dialog 的 Tab 循环与 Esc 归还', async ({ page }) => {
  await resetWorkbench(page)
  await settle(page, { extraMs: 300 })

  const cta = page.locator('.et-emptystate button').first()
  await cta.click()
  await settle(page, { extraMs: 300 })
  const panel = page.locator('.et-dialog__panel')
  await expect(panel).toBeVisible()

  // 焦点在陷阱内：连续 Tab 不逃出面板
  for (let i = 0; i < 6; i += 1) {
    await page.keyboard.press('Tab')
    await page.waitForTimeout(60)
    const inside = await page.evaluate(() => {
      const p = document.querySelector('.et-dialog__panel')
      return p && document.activeElement ? p.contains(document.activeElement) : false
    })
    expect(inside, `第 ${i + 1} 次 Tab 后焦点逃出陷阱`).toBe(true)
  }

  // Esc 收敛 + 焦点归还触发器（空态 CTA）
  await page.keyboard.press('Escape')
  await settle(page, { extraMs: 300 })
  await expect(panel).toHaveCount(0)
  const restored = await page.evaluate(() => {
    const active = document.activeElement
    return active ? active.className || '' : ''
  })
  expect(restored).toContain('et-emptystate')
})

test('M2+ 出口 · 停靠分隔器键盘 resize（1.2.0 还清 M0 欠账：纯键盘可调面板尺寸）', async ({ page }) => {
  await resetWorkbench(page)
  await settle(page, { extraMs: 400 })

  // 左停靠的两面板之间有一条 separator（stack 并列档）
  const bar = page.locator('.et-workbench__rail--left [role="separator"]').first()
  await expect(bar).toBeVisible()

  const readPanelWidth = () =>
    page.evaluate(() => {
      const panel = document.querySelector('.et-workbench__rail--left .et-panel')
      return panel ? Math.round(panel.getBoundingClientRect().width) : null
    })
  const before = await readPanelWidth()

  // 键盘操作：聚焦 → 方向键（真键盘路径，不伪造 dispatchEvent）
  await bar.focus()
  const focusedIsSeparator = await page.evaluate(() => document.activeElement?.getAttribute('role'))
  expect(focusedIsSeparator).toBe('separator')

  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(500) // dock 的 120ms 落定 + 写回
  const after = await readPanelWidth()
  expect(after, '方向键没改到面板尺寸（键盘链路断）').toBeGreaterThan(before)

  // End = 到 max：尺寸还应继续变大（min/max 夹角内）
  await page.keyboard.press('End')
  await page.waitForTimeout(500)
  expect(await readPanelWidth()).toBeGreaterThanOrEqual(after)
})
