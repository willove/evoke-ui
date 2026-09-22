/**
 * 注册表校验脚本 — 校验 evoke-chat 构建产物的组件注册表
 *
 * 约定：
 *   1. 全部组件以 Eb* 命名（与底座同一命名空间约定）
 *   2. 注册表不得混入兄弟库命名（Ev* / Ew*）
 *   3. 导出完整性：src/components 下每个 .vue 要么进 src/index.js 导入，
 *      要么在 INTERNAL 清单里显式登记为内部件（漏导出时此前构建全绿、用户却装不到）
 *
 * 用法: node scripts/compat-check.mjs （挂入 build，build 后运行）
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')

/** 内部件：由其它组件渲染，不作为公开组件注册（宿主经 props/slot 间接触达） */
const INTERNAL = new Set([
  'chatbot/ChatMessageRow.vue', // 虚拟/非虚拟两分支共用的纯透传壳
  'chatbot/ChatFileTreeNode.vue', // 文件树的递归节点
])

function extractRegistry(source, marker) {
  const start = source.indexOf(marker)
  if (start === -1) return null
  const end = source.indexOf('}', start)
  const body = source.slice(start, end)
  return new Set([...body.matchAll(/\b(E[A-Za-z][A-Za-z0-9]*)\b/g)].map((m) => m[1]))
}

function walkVue(dir, prefix = '') {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) out.push(...walkVue(p, `${prefix}${name}/`))
    else if (name.endsWith('.vue')) out.push(`${prefix}${name}`)
  }
  return out
}

async function main() {
  const dist = resolve(pkgRoot, 'dist/index.mjs')
  if (!existsSync(dist)) {
    console.error('[compat-check] dist/index.mjs 不存在，请先 pnpm build')
    process.exit(1)
  }

  const names = extractRegistry(readFileSync(dist, 'utf-8'), 'components = {')
  if (!names) {
    console.error('[compat-check] 无法提取组件注册表')
    process.exit(1)
  }

  const violations = []

  const foreign = [...names].filter((n) => /^(Ev|Ew)[A-Z]/.test(n))
  if (foreign.length) violations.push(`注册表混入兄弟库命名: ${foreign.join(', ')}`)

  const nonEb = [...names].filter((n) => !/^Eb[A-Z]/.test(n))
  if (nonEb.length) violations.push(`注册表出现非 Eb* 命名: ${nonEb.join(', ')}`)

  const compRoot = resolve(pkgRoot, 'src/components')
  const indexSrc = readFileSync(resolve(pkgRoot, 'src/index.js'), 'utf-8')
  const missing = []
  for (const rel of walkVue(compRoot)) {
    if (INTERNAL.has(rel)) continue
    if (!indexSrc.includes(`components/${rel}`)) missing.push(rel)
  }
  if (missing.length) {
    violations.push(`src/components 未进 src/index.js 导入（用户装不到）: ${missing.join(', ')}`)
  }

  console.log(`evoke-chat 注册组件: ${names.size}（内部件 ${INTERNAL.size}）`)

  if (violations.length) {
    console.error('\n[compat-check] ❌ 校验失败：')
    for (const v of violations) console.error('  - ' + v)
    process.exit(1)
  }

  console.log('\n✅ 注册表校验通过：Eb* 命名纯度 + 导出完整性')
}

main()
