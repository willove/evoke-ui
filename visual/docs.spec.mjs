import { expect, test } from '@playwright/test'
import { COMPONENT_TAXONOMY } from '../packages/evoke-tools-ui/src/taxonomy.js'

/**
 * 文档站自检（L4 集成的文档侧）
 *
 * 组件页现在由 <CompApi> 从源码现算六面、由 <DemoBlock> 挂活体演示，
 * 于是"页写错了"从"表格数字对不上"变成"页在浏览器里报错 / 演示区是空的 / 读数是 NaN"
 * 这类只有跑起来才看得见的问题。这里逐页守三条：
 *   ① 无 console error 与未捕获异常（Vue 警告与 prop 校验失败都会落在这里）；
 *   ② 每个演示块预览区有内容且高度 > 8px（空壳 = 演示没装配起来）；
 *   ③ 页内不出现 NaN / undefined 字样的读数（演示绑错载荷形状的信号）。
 * 结构面（每页有 <CompApi>、无手写 API 段、demo 或显式免 demo）由 G11 门
 * docs-tools/scripts/check-docs-coverage.mjs 在构建期守，两边不重复。
 */
const BASE = 'http://127.0.0.1:4176'

for (const c of COMPONENT_TAXONOMY) {
  test(`组件页 ${c.id} 渲染干净`, async ({ page }) => {
    const errors = []
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    page.on('pageerror', (e) => errors.push(String(e)))
    await page.goto(`${BASE}/components/${c.id}.html`, { waitUntil: 'networkidle' })
    // CompApi 真的挂上了：有 API 区块，且 Props 表存在（不是空壳组件）
    const api = page.locator('.comp-api')
    await expect(api, `${c.id} 页没有渲染 <CompApi>`).toBeVisible()
    await expect(api.locator('.api-table__title', { hasText: 'Props' }), `${c.id} 缺 Props 表`).toBeVisible()
    const blocks = page.locator('.demo-block')
    const n = await blocks.count()
    for (let i = 0; i < n; i++) {
      const preview = blocks.nth(i).locator('.demo-block__preview')
      await expect(preview, `${c.id} 第 ${i + 1} 个演示块预览为空`).toBeVisible()
      expect(await preview.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThan(8)
    }
    const body = await page.locator('.td-doc').innerText()
    expect(body, `${c.id} 页内出现 NaN/undefined 读数`).not.toMatch(/\bNaN\b|undefined%|undefinedpx/)
    expect(errors, `${c.id} 控制台报错：${errors[0] || ''}`).toEqual([])
  })
}
