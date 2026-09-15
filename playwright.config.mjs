import { defineConfig } from '@playwright/test'

/**
 * 视觉回归（ROADMAP 第 4 条）— Playwright 截图对比
 *
 * 架构：测试吃各文档站构建产物（vitepress serve 静态伺服），不引入 specimen 应用，
 * 文档页里的 DemoBlock 就是组件的真实用法——站点样式回归即被捕获。
 *
 * 运行：
 *   pnpm visual            # 重建 docs-web → 全量截图对比
 *   pnpm visual:only       # 跳过构建（dist 已是最新时）
 *   pnpm visual:update     # 重建并重录基线
 *
 * 基线为当前平台渲染（默认含平台后缀）；接入 CI 时改用 Playwright 官方
 * Docker 镜像跑（字体统一），避免跨平台字体差导致的大面积伪差异。
 */
export default defineConfig({
  testDir: 'visual',
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  workers: 1, // 静态页截图串行更稳，也避免 vitepress serve 争抢
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
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
  webServer: {
    // vitepress preview 默认端口即 4173（伺服 docs-web/.vitepress/dist）；
    // 不带参数调用，规避 pnpm 对 -- 的字面透传坑
    command: 'pnpm docs-web:preview',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    // 首批只覆盖 ui 站（evoke-ui）；business / charts 站待其改动落定后按同构扩展
    { name: 'ui', testIgnore: /business|charts/ },
  ],
})
