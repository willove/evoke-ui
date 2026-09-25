/**
 * 构建产物存在性校验（vite build + vue-tsc + post-types 之后跑）
 *
 * 为什么需要它：`vite build` 会清空 dist/，而类型与子路径存根依赖后续步骤真正跑完。
 * 手工/管道跑构建链时失败会被吞掉，结果发出一个「有 JS、没类型」的包——
 * 对外等于「组件没有接口声明」。本脚本把这句话变成可执行判定：
 *
 *   1. src/index.js 的每个组件导入 → dist/<kebab>.mjs 与 dist/types/entries/<kebab>.d.ts 都在
 *   2. dist/index.mjs 里含每个组件的 PascalCase 导出名
 *   3. dist/types/index.d.ts 存在，且含所有具名导出（组件 + composable）
 *   4. dist/<kebab>.mjs 数量与入口清单一致（漏构建会当场红）
 *
 * 运行：node scripts/check-artifacts.mjs   （package.json 的 build 链末尾已接）
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')
const dist = join(pkgRoot, 'dist')
const srcIndex = readFileSync(join(pkgRoot, 'src/index.js'), 'utf8')

const fail = []

// ── 1. 入口清单：组件（SFC import）与具名导出（composable 等）──
const componentImports = [...srcIndex.matchAll(/import (Eb[A-Za-z0-9]+) from ["']\.\/components\/[^"']+\.vue["']/g)]
  .map((m) => m[1])
const kebab = (name) => name.replace(/^Eb/, '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

const namedExports = [...srcIndex.matchAll(/^export \{ ([^}]+) \}/gm)]
  .flatMap((m) => m[1].split(',').map((s) => s.trim().split(/\s+as\s+/).pop()))
  .map((s) => s.trim())
  .filter(Boolean)

if (!componentImports.length) fail.push('src/index.js 未解析到任何组件导入（脚本口径失效，先修脚本）')
if (!existsSync(dist)) fail.push('dist/ 不存在 —— 构建根本没跑')

// ── 2. 每个组件的 JS 入口与类型存根 ──
const missingJs = []
const missingStub = []
for (const name of componentImports) {
  const entry = kebab(name)
  if (!existsSync(join(dist, `${entry}.mjs`))) missingJs.push(`${entry}.mjs`)
  if (!existsSync(join(dist, 'types/entries', `${entry}.d.ts`))) missingStub.push(`${entry}.d.ts`)
}
if (missingJs.length) fail.push(`缺少 JS 入口：${missingJs.join(', ')}`)
if (missingStub.length) fail.push(`缺少类型存根：${missingStub.join(', ')}`)

// ── 3. 包根导出面：JS 与类型都要含全部名字 ──
const rootJs = existsSync(join(dist, 'index.mjs')) ? readFileSync(join(dist, 'index.mjs'), 'utf8') : ''
if (!rootJs) fail.push('dist/index.mjs 不存在')
const rootTypesPath = join(dist, 'types/index.d.ts')
if (!existsSync(rootTypesPath)) {
  fail.push('dist/types/index.d.ts 不存在 —— 类型链没跑完（vue-tsc / post-types）')
} else {
  const rootTypes = readFileSync(rootTypesPath, 'utf8')
  const lostTypes = [...componentImports, ...namedExports].filter((n) => !rootTypes.includes(n))
  if (lostTypes.length) fail.push(`dist/types/index.d.ts 缺少导出：${lostTypes.join(', ')}`)
}
const lostJs = [...componentImports, ...namedExports].filter((n) => !rootJs.includes(n))
if (lostJs.length) fail.push(`dist/index.mjs 缺少导出：${lostJs.join(', ')}`)

// ── 4. 入口数量：防止「漏构建但文件还在」的假绿 ──
const builtEntries = existsSync(dist) ? readdirSync(dist).filter((f) => f.endsWith('.mjs')).length : 0
if (builtEntries < componentImports.length) {
  fail.push(`dist/*.mjs 只有 ${builtEntries} 个，少于组件入口 ${componentImports.length} 个`)
}

if (fail.length) {
  console.error('[check-artifacts] 构建产物不完整：')
  for (const line of fail) console.error(`  - ${line}`)
  console.error('  提示：用 `CI=true pnpm --filter @wil-works/evoke-chat build` 跑完整链，不要用管道手工拼。')
  process.exit(1)
}

console.log(`[check-artifacts] 通过：${componentImports.length} 个组件入口 / ${builtEntries} 个 JS 产物 / 类型存根与包根导出齐全（具名导出 ${namedExports.length} 个）`)