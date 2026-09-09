/**
 * API 兼容性对比脚本 — 对比 evoke-business-ui 与 evoke-ui 的组件注册表差异
 *
 * 用法: node scripts/compat-check.mjs
 * 挂入 build（build 后运行）：校验新库导出的组件名是 evoke-ui 注册表的超集（白名单除外）
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** 新库新增组件（evoke-ui 未注册，白名单） */
const ADDED_WHITELIST = new Set([
  'EvTreeSelect', // 树选择器，evoke-ui 未注册
  'EvPopper', // 浮层基座
  // 业务组件
  'EvSearchFilter', 'EvDataTable', 'EvStatusTag', 'EvCellStack',
  'EvDetailDescriptions', 'EvImportExportPanel', 'EvAuditTimeline', 'EvColumnSettings',
  // 能力补全（虚拟滚动 / 联想 / 引导 / 二维码 / 提及 / 悬浮按钮 / 评论）
  'EvVirtualList', 'EvListy', 'EvAutoComplete', 'EvTour', 'EvQrcode',
  'EvMention', 'EvFloatButton', 'EvFloatButtonGroup', 'EvComment',
  // B 端生态
  'EvAuth',
  // 排版与锚点
  'EvTitle', 'EvParagraph', 'EvAnchor', 'EvAnchorLink',
  // 数据展示补全
  'EvStatistic',
  // Mobile 移动组件（下拉刷新 / 加载更多 / 动作面板 / 底部标签栏）
  'EvPullRefresh', 'EvLoadMore', 'EvActionSheet', 'EvTabbar', 'EvTabbarItem', 'EvNavBar',
])

/** 已知排除项：暂缺组件在此登记，补齐后移除；当前已全量覆盖，白名单为空 */
const PENDING_WHITELIST = new Set([])

function extractRegistry(source, marker) {
  // 提取 `const components = { EvButton, EvCard, ... }` 注册表名列表
  const start = source.indexOf(marker)
  if (start === -1) return null
  const end = source.indexOf('}', start)
  const body = source.slice(start, end)
  const names = [...body.matchAll(/\b(Ev[A-Z][A-Za-z0-9]*)\b/g)].map((m) => m[1])
  return new Set(names)
}

async function main() {
  const ebuiDist = resolve(__dirname, '../dist/index.mjs')

  if (!existsSync(ebuiDist)) {
    console.error('[compat-check] dist/index.mjs 不存在，请先 pnpm build')
    process.exit(1)
  }

  // evoke-ui 已随拆库移出本仓库；默认探测同级的旧 monorepo 位置，
  // 可用 EVOKE_UI_ROOT 环境变量指向 evoke-ui 包目录，找不到则跳过对比
  const euiRoot = process.env.EVOKE_UI_ROOT
    ? resolve(process.env.EVOKE_UI_ROOT)
    : resolve(__dirname, '../../../../practice-list/@wil-works/packages/evoke-ui')
  const euiDist = resolve(euiRoot, 'dist/index.mjs')
  const euiSrc = resolve(euiRoot, 'src/index.ts')

  if (!existsSync(euiDist) && !existsSync(euiSrc)) {
    console.log(`[compat-check] 未找到 evoke-ui（${euiRoot}），跳过兼容性对比（可用 EVOKE_UI_ROOT 指定其包目录）`)
    process.exit(0)
  }

  const ebuiSource = readFileSync(ebuiDist, 'utf-8')
  const ebuiNames = extractRegistry(ebuiSource, 'components = {') ?? extractRegistry(ebuiSource, 'components={')

  // 动态 import evoke-ui dist 获取注册表（更可靠）
  let euiNames = null
  if (existsSync(euiDist)) {
    try {
      const mod = await import(euiDist)
      euiNames = new Set(Object.keys(mod.components ?? {}))
    } catch (e) {
      console.warn('[compat-check] 无法加载 evoke-ui dist，回退源码解析:', e.message)
    }
  }
  if (!euiNames && existsSync(euiSrc)) {
    euiNames = extractRegistry(readFileSync(euiSrc, 'utf-8'), 'const components: Record<string, Component> = {')
  }

  if (!ebuiNames || !euiNames) {
    console.error('[compat-check] 无法提取组件注册表')
    process.exit(1)
  }

  const missing = [...euiNames].filter((n) => !ebuiNames.has(n))
  const added = [...ebuiNames].filter((n) => !euiNames.has(n))

  console.log(`evoke-ui 注册组件: ${euiNames.size}`)
  console.log(`evoke-business-ui 注册组件: ${ebuiNames.size}`)
  console.log(`覆盖: ${euiNames.size - missing.length}/${euiNames.size} (${(((euiNames.size - missing.length) / euiNames.size) * 100).toFixed(1)}%)`)

  if (missing.length) {
    console.log('\n缺失组件（相对 evoke-ui）:')
    for (const name of missing) {
      const tag = PENDING_WHITELIST.has(name) ? '（已知暂缺）' : '（❗ 未登记的缺失）'
      console.log(`  - ${name} ${tag}`)
    }
  } else {
    console.log('\n✅ 全量覆盖 evoke-ui 组件注册表')
  }

  if (added.length) {
    const illegal = added.filter((n) => !ADDED_WHITELIST.has(n))
    console.log('\n新增组件（相对 evoke-ui）:')
    for (const name of added) {
      const tag = ADDED_WHITELIST.has(name) ? '' : '（❗ 白名单外新增，请更新 ADDED_WHITELIST）'
      console.log(`  + ${name} ${tag}`)
    }
    if (illegal.length) process.exit(1)
  }

  const unexpectedMissing = missing.filter((n) => !PENDING_WHITELIST.has(n))
  if (unexpectedMissing.length) {
    console.error(`\n❌ ${unexpectedMissing.length} 个未登记的缺失组件`)
    process.exit(1)
  }
  console.log('\n✅ compat-check 通过')
}

main().catch((e) => {
  console.error('[compat-check] 执行失败:', e)
  process.exit(1)
})
