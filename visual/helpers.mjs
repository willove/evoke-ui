/**
 * 视觉回归共享工具（各 spec 复用）
 * settle：等字体 / 懒加载图片 / 布局收敛后再截图；extraMs 供 canvas 图表页
 * 覆盖入场动画（rAF 驱动，Playwright 的 animations:'disabled' 管不到）。
 */
export async function settle(page, { extraMs = 250 } = {}) {
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
  await page.waitForTimeout(extraMs)
}
