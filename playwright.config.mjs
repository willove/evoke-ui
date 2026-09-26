import { defineConfig } from '@playwright/test'

/**
 * 视觉回归（ROADMAP 第 4 条）— Playwright 截图对比
 *
 * 架构：测试吃各文档站构建产物（vitepress serve 静态伺服），不引入 specimen 应用，
 * 文档页里的 DemoBlock 就是组件的真实用法——站点样式回归即被捕获。
 * 三站各占一个 project 与独立端口：ui 4173 / business 4174 / charts 4175，
 * baseURL 按 project 下发，spec 内统一用相对路径。
 *
 * 运行：
 *   pnpm visual            # 重建三站 → 全量截图对比
 *   pnpm visual:only       # 跳过构建（dist 已是最新时）
 *   pnpm visual:update     # 重建并重录基线
 *   pnpm visual:only -- --project=business   # 只跑单站（dist 需先构建）
 *
 * 基线为当前平台渲染（默认含平台后缀）；接入 CI 时改用 Playwright 官方
 * Docker 镜像跑（字体统一），避免跨平台字体差导致的大面积伪差异。
 */
export default defineConfig({
  testDir: 'visual',
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  workers: 1, // 静态页截图串行更稳，也避免多站 preview 争抢
  reporter: [['list']],
  use: {
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  },
  expect: {
    toHaveScreenshot: {
      animations: 'disabled', // 无限动画取消到初态、有限动画快进到终态，保证确定性
      caret: 'hide',
      maxDiffPixelRatio: 0.02, // 容忍亚像素渲染抖动
    },
  },
  /**
   * 视觉基线的**服务范围**：默认 all（本地跑全套）。
   * CI 的 tools 作业只需要 tools 相关那两份 preview（4176 docs-tools / 4180 工作台示例）——
   * 其余三站不启动，就不必为它们构建与等待（此前要建齐 5 个 preview 才能跑 18 例 tools 用例）。
   * 用法：VISUAL_SCOPE=tools pnpm exec playwright test --project=tools
   */
  webServer: (() => {
    const servers = {
      ui: {
        // vitepress preview 默认端口即 4173（伺服 docs-web/.vitepress/dist）；
        // 不带参数调用，规避 pnpm 对 -- 的字面透传坑
        command: 'pnpm docs-web:preview',
        url: 'http://127.0.0.1:4173',
      },
      business: { command: 'pnpm visual:preview:business', url: 'http://127.0.0.1:4174' },
      charts: { command: 'pnpm visual:preview:charts', url: 'http://127.0.0.1:4175' },
      tools: { command: 'pnpm visual:preview:tools', url: 'http://127.0.0.1:4176' },
      // M0 的视觉回归吃工作台装配示例（真实 chrome 装配 = 预算/不变量断言面）；
      // M2 起补 docs-tools 的 recipe 页（4176）
      'tools-example': { command: 'pnpm visual:preview:tools-example', url: 'http://127.0.0.1:4180' },
    }
    const scope = process.env.VISUAL_SCOPE || 'all'
    const keys = scope === 'tools' ? ['tools', 'tools-example'] : Object.keys(servers)
    return keys.map((k) => ({ ...servers[k], reuseExistingServer: !process.env.CI, timeout: 60_000 }))
  })(),
  projects: [
    { name: 'ui', testMatch: /visual\/ui\.spec\.mjs/, use: { baseURL: 'http://127.0.0.1:4173' } },
    { name: 'business', testMatch: /visual\/business\.spec\.mjs/, use: { baseURL: 'http://127.0.0.1:4174' } },
    { name: 'charts', testMatch: /visual\/charts\.spec\.mjs/, use: { baseURL: 'http://127.0.0.1:4175' } },
    { name: 'tools', testMatch: /visual\/tools\.spec\.mjs/, use: { baseURL: 'http://127.0.0.1:4180' } },
  ],
})
