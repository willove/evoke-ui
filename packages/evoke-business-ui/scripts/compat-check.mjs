/**
 * 注册表校验脚本 — 校验 evoke-business-ui 构建产物的组件注册表
 *
 * 背景：ev-* 命名空间划归 evoke-ui 与 evoke-charts 后，本库整体切换到 eb-* 命名，
 * 与 evoke-ui 的"超集对比"校验失去前提，改为校验本库注册表自身的约定：
 *   1. 全部组件以 Eb* 命名（EbListy 为 EbVirtualList 的注册别名，放行）
 *   2. 图表组件以 EbChart 存在（来自 @wil-works/evoke-charts 的 EvChart 别名）
 *   3. 无兄弟库命名残留（Ev* / Ew*）
 *   4. 导出完整性：src/components 真实组件目录 ↔ src/index.js 导入交叉校验
 *      （新组件漏导出时此前构建全绿、用户却装不到）
 *
 * 用法: node scripts/compat-check.mjs （挂入 build，build 后运行）
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function extractRegistry(source, marker) {
  // 提取 `const components = { EbButton, EbCard, ... }` 注册表名列表
  const start = source.indexOf(marker)
  if (start === -1) return null
  const end = source.indexOf('}', start)
  const body = source.slice(start, end)
  const names = [...body.matchAll(/\b(E[A-Za-z][A-Za-z0-9]*)\b/g)].map((m) => m[1])
  return new Set(names)
}

async function main() {
  const ebuiDist = resolve(__dirname, '../dist/index.mjs')

  if (!existsSync(ebuiDist)) {
    console.error('[compat-check] dist/index.mjs 不存在，请先 pnpm build')
    process.exit(1)
  }

  const source = readFileSync(ebuiDist, 'utf-8')
  const names = extractRegistry(source, 'components = {') ?? extractRegistry(source, 'components={')

  if (!names) {
    console.error('[compat-check] 无法提取组件注册表')
    process.exit(1)
  }

  const violations = []

  // 允许清单：EbListy = EbVirtualList 注册别名；EvChart 为图表包组件（EbChart 别名的取值）
  const ALIAS_OK = new Set(['EbListy', 'EvChart'])

  // 1. 命名空间纯度：Eb* 之外不得出现兄弟库命名（EvChart 别名取值除外）
  const foreign = [...names].filter((n) => /^(Ev|Ew)[A-Z]/.test(n) && !ALIAS_OK.has(n))
  if (foreign.length) {
    violations.push(`注册表混入兄弟库命名: ${foreign.join(', ')}`)
  }

  // 2. 图表别名必须存在
  if (!names.has('EbChart')) {
    violations.push('缺少 EbChart（@wil-works/evoke-charts 的 EvChart 别名注册）')
  }

  // 3. 非 Eb* 命名须在允许清单内
  const nonEb = [...names].filter((n) => !/^Eb[A-Z]/.test(n))
  for (const n of nonEb) {
    if (!ALIAS_OK.has(n)) violations.push(`注册表出现非 Eb* 命名: ${n}`)
  }

  // 4. 导出完整性：src/components 真实组件目录必须全部进入 src/index.js 导入
  //    （目录索引导入 loading/message/msgbox/notify 与逐文件导入同口径覆盖）
  const compRoot = resolve(__dirname, '../src/components')
  const indexSrc = readFileSync(resolve(__dirname, '../src/index.js'), 'utf-8')
  const importedDirs = new Set(
    [...indexSrc.matchAll(/\/components\/([a-z0-9-]+)(?=\/|['"])/g)].map((m) => m[1]),
  )
  const missing = []
  for (const name of readdirSync(compRoot)) {
    const dir = join(compRoot, name)
    if (!statSync(dir).isDirectory()) continue
    // 空壳目录（仅工具缓存、无源码）不视为组件
    if (!readdirSync(dir).some((f) => f.endsWith('.vue') || f.endsWith('.js'))) continue
    if (!importedDirs.has(name)) missing.push(name)
  }
  if (missing.length) {
    violations.push(`src/components 未进 src/index.js 导入（用户装不到）: ${missing.join(', ')}`)
  }

  console.log(`evoke-business-ui 注册组件: ${names.size}`)

  if (violations.length) {
    console.error('\n[compat-check] ❌ 校验失败：')
    for (const v of violations) console.error('  - ' + v)
    process.exit(1)
  }

  console.log('\n✅ 注册表校验通过：Eb* 命名纯度 + EbChart 图表别名 + 别名白名单')
}

main()
