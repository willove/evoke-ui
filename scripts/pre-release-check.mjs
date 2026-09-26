#!/usr/bin/env node
/**
 * 发布前检查（pre-release check）
 *
 * 一次跑完发布前必须过的机械校验，任一不过即 exit 1，别再进入打 tag 流程。
 * 覆盖面来自 2026-09-25 v0.16.0 那次发布实际踩过的坑：
 *
 *   1. 包版本号 ↔ 文档站版本展示（hero 徽标 / meta.js / Layout.vue / 首页各处）
 *      ——由 docs-site-version 守卫测试覆盖，这里改为直接调用它们
 *   2. 文档宣称的图标数量 ↔ 图标源数据实际数量
 *      ——v0.16.0 时 docs/index.md 被整文件暂存，把未入库图标 WIP 的 438→441
 *        一并带进发布提交，而 npm 包按 tag 构建只有 433 个，文档与包对不上。
 *        此检查就是为了让这类「文档承诺了包里没有的东西」在发布前暴露
 *   3. 暂存区里没有意外的 hunk
 *      ——同上，整文件 `git add` 会把无关改动捎带进发布提交，此处逐条列出
 *        暂存的增删行供人工过目（只看，不拦截）
 *   4. （M4 G8）tools-ui 文档宣称的组件数 ↔ 组件入口产物实际条数
 *      ——DESIGN.md 的里程碑表写「L2 六个组件 / L3 七件 / L4 七件」，exports
 *        契约按入口数断言；两层数字对不上就是文档承诺了不存在的能力
 *
 * 用法：node scripts/pre-release-check.mjs   （在仓库根目录执行）
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..')

const failures = []
const notes = []

function read(rel) {
  return readFileSync(join(repoRoot, rel), 'utf8')
}

/** 读「将要发布」的那份内容：优先取暂存区（此时 commit 就是它），其次 HEAD，新文件回退工作区 */
function readAtHead(rel) {
  for (const spec of [`:${rel}`, `HEAD:${rel}`]) {
    try {
      return execSync(`git show ${spec}`, { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    } catch { /* 不在暂存区/未入库，继续下一个来源 */ }
  }
  return read(rel)
}

/** 源数据里的图标键数（顶层 export const XxxPaths = { ... } 的一层缩进引号键） */
function countIconKeys(rel) {
  const m = readAtHead(rel).match(/export const \w+ = \{([\s\S]*?)\n\}/)
  if (!m) return null
  const keys = [...m[1].matchAll(/^\s{1,2}"([a-z0-9-]+)":\s*\{/gm)]
  return keys.length
}

/** 文档里宣称的图标数量（几种已知句式） */
function claimedCounts(rel) {
  const src = readAtHead(rel)
  const out = []
  const patterns = [
    /(\d+)\s*个单色图标/g,
    /(\d+)\s*个内置图标/g,
    /<strong>(\d+)<\/strong><span>内置图标/g,
    /内置图标（\*\*(\d+)\*\*/g,
    /全部内置图标（\*\*(\d+)\*\*/g,
  ]
  for (const re of patterns) {
    for (const m of src.matchAll(re)) out.push({ rel, count: Number(m[1]) })
  }
  return out
}

// ─── 1. 版本号守卫（docs-site-version 测试） ───
const guardFiles = [
  'packages/evoke-business-ui/test/docs-site-version.test.js',
  'packages/evoke-ui/test/docs-site-version.test.js',
  'packages/evoke-charts/test/docs-site-version.test.js',
  'packages/evoke-tools-ui/test/docs-site-version.test.js',
].filter((f) => {
  try { read(f); return true } catch { return false }
})

if (guardFiles.length === 0) {
  notes.push('版本守卫测试文件不在（未跟踪的新文件？），跳过第 1 项——请人工核对文档站版本号')
} else {
  // .bin/vitest 是 shell 包装，不能直接 node 跑；取 .pnpm 里的真实入口
  const vitestEntry = execSync(
    'find node_modules/.pnpm -maxdepth 5 -path "*vitest@*/node_modules/vitest/vitest.mjs" | head -1',
    { cwd: repoRoot, encoding: 'utf8' },
  ).trim()
  if (!vitestEntry) {
    failures.push('找不到 vitest 入口，无法跑版本守卫测试')
  } else {
    try {
      execSync(
        `${JSON.stringify(process.execPath)} ${vitestEntry} run ${guardFiles.join(' ')}`,
        { cwd: repoRoot, stdio: 'pipe' },
      )
      notes.push(`版本号守卫：${guardFiles.length} 个测试文件通过`)
    } catch (err) {
      const tail = String(err.stderr || err.stdout || '').split('\n').filter(Boolean).slice(-12).join('\n')
      failures.push(`版本号守卫测试未通过：\n${tail}`)
    }
  }
}

// ─── 2. 图标数量一致性 ───
// 每边文档只能和自家包的图标源比：business 站点描述 business-ui 的图标集，
// ui 站点描述 evoke-ui 的核心集；charts 站不涉及图标。
const iconPairs = [
  {
    source: 'packages/evoke-business-ui/src/components/icon/remix-svg-paths.js',
    claims: ['docs/index.md', 'docs/components/icon.md', 'docs/components/icon-gallery.md'],
  },
  {
    source: 'packages/evoke-ui/src/components/icon/svg-paths.js',
    claims: ['docs-web/components/icon.md'],
  },
]
for (const pair of iconPairs) {
  let actual = null
  try { actual = countIconKeys(pair.source) } catch { /* 文件不存在则跳过 */ }
  if (actual === null) continue
  notes.push(`${pair.source} 实际图标键数：${actual}`)
  const claims = pair.claims.flatMap(claimedCounts)
  if (claims.length === 0) {
    notes.push('  └ 对应文档未声明数量，跳过比对')
    continue
  }
  for (const c of claims) {
    if (c.count !== actual) {
      failures.push(
        `图标数量不一致：${c.rel} 宣称 ${c.count} 个，但 ${pair.source} 实际 ${actual} 个键。` +
        '若图标集扩容尚未入库，先入库再发布（npm 包按 tag 构建，文档不能承诺包里没有的图标）',
      )
    }
  }
}

// ─── 2.5 （M4 G8）tools-ui 文档宣称组件数 ↔ 入口产物 ───
try {
  const { pathToFileURL } = await import('node:url')
  const entryModule = await import(
    pathToFileURL(join(repoRoot, 'packages/evoke-tools-ui/scripts/component-entries.mjs')).href,
  )
  const entries = entryModule.getEtComponentEntries()
  const names = new Set(entries.map((e) => e.name))
  // 分层归属：与 src/index.js 的结构注释同源（改这里 = 改分层表，必须与 DESIGN.md 同步）
  const LAYERS = {
    L1: ['provider', 'tool-button', 'tool-group', 'tab-strip', 'screen-tip', 'key-hint', 'divider', 'tool-spacer', 'dropdown', 'select', 'tooltip', 'splitter'],
    L2: ['ribbon-bar', 'overflow-menu', 'command-palette', 'context-menu', 'shortcut-panel', 'shortcut-hint'],
    L3: ['dock', 'panel', 'panel-group', 'scroll-area', 'empty-state', 'workbench', 'document-tabs'],
    L4: ['title-bar', 'status-bar', 'backstage', 'theme-bridge', 'dialog', 'toast', 'banner'],
  }
  // 辅件：splitter-panel（splitter 族的子路径辅件）/ icon（兜底载体）不进分层宣称
  const AUX = ['splitter-panel', 'icon']
  const classified = new Set([...Object.values(LAYERS).flat(), ...AUX])
  const unclassified = entries.filter((e) => !classified.has(e.name)).map((e) => e.name)
  if (unclassified.length) {
    failures.push(`tools-ui 组件入口有未归类条目（分层表过期？）：${unclassified.join(', ')}`)
  }
  const layerCount = (layer) => LAYERS[layer].filter((n) => names.has(n)).length

  // DESIGN.md 的里程碑表 = 宣称口径（L1 "12 个 L1 原子件" / L2 "六个组件" / L3 "七件" / L4 "七件"）
  const design = readAtHead('packages/evoke-tools-ui/DESIGN.md')
  const cn = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 十一: 11, 十二: 12 }
  const num = (raw) => (cn[raw] ?? Number(raw))
  // 每层一组候选句式（任一匹配即算宣称；全不中 = 文档丢了可核对的数字）
  const claimPatterns = {
    L1: [/(\d+)\s*个\s*L1 原子件/, /L1 原子件[^。\n]*?\*\*(\d+)\*\*/],
    L2: [/L2\s*([一二三四五六七八九十]+|\d+)\s*个组件/],
    L3: [/L3\s*([一二三四五六七八九十]+|\d+)\s*件/],
    L4: [/L4\s*([一二三四五六七八九十]+|\d+)\s*件/],
  }
  const claims = []
  for (const [layer, patterns] of Object.entries(claimPatterns)) {
    const hit = patterns.map((re) => design.match(re)).find(Boolean)
    if (!hit) {
      failures.push(`DESIGN.md 里找不到 ${layer} 的组件数宣称（G8 需要每层都有可核对的数字）`)
      continue
    }
    claims.push({ layer, count: num(hit[1]) })
  }
  for (const claim of claims) {
    const actual = layerCount(claim.layer)
    if (claim.count !== actual) {
      failures.push(
        `tools-ui 组件数不一致：DESIGN.md 宣称 ${claim.layer} ${claim.count} 个，入口产物实际 ${actual} 个。` +
        '文档承诺的能力必须真实存在于发布产物里',
      )
    }
  }
  const claimedTotal = claims.reduce((n, c) => n + c.count, 0)
  notes.push(`tools-ui 组件入口：${entries.length} 条（分层宣称合计 ${claimedTotal} + 辅件 ${AUX.length}）`)
  for (const c of claims) notes.push(`  └ ${c.layer} 宣称 ${c.count} / 实际 ${layerCount(c.layer)}`)
} catch (err) {
  failures.push(`tools-ui 组件数一致性检查失败：${err.message}`)
}

// ─── 3. 暂存区 hunk 供人工过目 ───
let staged = ''
try {
  staged = execSync('git diff --cached --unified=0', { cwd: repoRoot, encoding: 'utf8' })
} catch (err) {
  failures.push(`读取暂存区失败：${err.message}`)
}
const stagedFiles = staged.split(/^diff --git /m).filter(Boolean)
const addedLines = stagedFiles.reduce((n, f) => n + [...f.matchAll(/^\+[^+]/gm)].length, 0)
const removedLines = stagedFiles.reduce((n, f) => n + [...f.matchAll(/^-[^-]/gm)].length, 0)

// ─── 汇总 ───
console.log('── 发布前检查 ──────────────────────────────')
for (const n of notes) console.log(`  · ${n}`)
console.log(`  · 暂存区：${stagedFiles.length} 个文件，+${addedLines} / -${removedLines} 行`)
if (stagedFiles.length > 0) {
  console.log('  · 暂存文件清单（逐条确认没有无关 hunk）：')
  for (const f of stagedFiles) {
    const name = f.match(/a\/(\S+)/)?.[1] ?? '?'
    const plus = [...f.matchAll(/^\+[^+]/gm)].length
    const minus = [...f.matchAll(/^-[^-]/gm)].length
    console.log(`      ${name}  +${plus} / -${minus}`)
  }
}
console.log('─────────────────────────────────────────────')

if (failures.length > 0) {
  console.error(`\n✗ ${failures.length} 项未通过：\n`)
  for (const f of failures) console.error(`  ✗ ${f}\n`)
  process.exit(1)
}
console.log('\n✓ 全部通过，可以进入打 tag 流程')
