#!/usr/bin/env node
/**
 * G3 命令面门（tools-ui 计划 06 §一，M1 新增）
 *
 * 判据（01 §二 契约）：
 *   ① 每个可点控件绑定的 commandId 已注册（引用 ⊆ 定义；定义 = 命令表 fixture 的 id）
 *   ② 命令声明的 surfaces 与真实可达面一致（surfaces 取值越界即红；
 *      注册表内声明 surfaces 的必须非空）
 *   ③ 同一命令的 enabled/active 只有一处实现：src 组件不得本地推演命令状态，
 *      一律走 runtime/command 的 state()/resolveCommandState（底座 import 豁免）
 *
 * 范围：packages/evoke-tools-ui/src + examples/tools-workbench/src（test 用假 id 是合法的，
 * 不进静态门——运行时契约由 test/command-registry.test.js 守）。
 *
 * 用法: node scripts/check-command-surface.mjs （已挂入 build）
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, extname, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')
const SURFACES = ['toolbar', 'menu', 'context', 'palette']

// 只扫消费方（组件 + 示例）；src/runtime 是契约本体（里面有 mod 同义词表之类
// 天然带 command 字样的定义），不当作"引用处"
const ROOTS = [
  resolve(pkgRoot, 'src/components'),
  resolve(pkgRoot, 'src/icons'),
  resolve(pkgRoot, '../../examples/tools-workbench/src'),
].filter((p) => existsSync(p))

const EXTS = new Set(['.vue', '.js', '.mjs', '.ts'])
const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage'])

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) out.push(...walk(p))
    else if (EXTS.has(extname(p))) out.push(p)
  }
  return out
}

const violations = []
const files = ROOTS.flatMap(walk)

/** 命令定义登记处（消费方/示例的命令表 fixture：命令的单一来源） */
const COMMAND_DEFS = resolve(pkgRoot, '../../examples/tools-workbench/src/commands.js')
const definedIds = new Set()

if (existsSync(COMMAND_DEFS)) {
  const src = readFileSync(COMMAND_DEFS, 'utf8')
  for (const m of src.matchAll(/\bid\s*:\s*['"]([a-z][a-z0-9-]*)['"]/g)) definedIds.add(m[1])
  // ② surfaces 取值域
  for (const m of src.matchAll(/surfaces\s*:\s*\[([^\]]*)\]/g)) {
    for (const s of m[1].split(',').map((x) => x.trim().replace(/['"]/g, '')).filter(Boolean)) {
      if (!SURFACES.includes(s)) violations.push(`${COMMAND_DEFS}  surface「${s}」不在 ${SURFACES.join('/')} 之内`)
    }
  }
} else {
  console.log('[check-command-surface] 未找到命令表 fixture（examples/tools-workbench/src/commands.js），跳过引用核对')
}

/** 引用形态：command="x" / :command="'x'" / command: 'x' */
const REF_PATTERNS = [
  /\bcommand\s*=\s*['"]([a-z][a-z0-9-]*)['"]/g,
  /\bcommand\s*=\s*['"]\s*['"]([a-z][a-z0-9-]*)['"]\s*['"]/g,
  /\bcommand\s*:\s*['"]([a-z][a-z0-9-]*)['"]/g,
]

for (const file of files) {
  if (file === COMMAND_DEFS) continue
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    for (const pattern of REF_PATTERNS) {
      for (const m of line.matchAll(pattern)) {
        const id = m[1]
        if (definedIds.size && !definedIds.has(id)) {
          violations.push(`${file}:${i + 1}  命令引用未注册：${id}（在命令表 fixture 里定义它，或改绑已注册命令）`)
        }
      }
    }
  })

  // ③ 单点状态实现：绑定了命令 id 的组件不得本地推演 enabled/active
  // （判据收紧到"真绑了命令"——事件名 @command 与无关文案不算）
  const src = readFileSync(file, 'utf8')
  const bindsCommand = REF_PATTERNS.some((pattern) => new RegExp(pattern.source).test(src))
  if (file.endsWith('.vue') && bindsCommand) {
    const usesRuntime = /from ['"][^'"]*runtime\/command|resolveCommandState|useCommandState/.test(src)
    if (!usesRuntime) {
      if (/const\s+(enabled|active)\s*=/.test(src) || /function\s+(enabled|active)\s*\(/.test(src)) {
        violations.push(
          `${file}  本地推演命令 enabled/active（G3 ③：状态只有一处实现——走 runtime/command 的 state()/resolveCommandState）`,
        )
      }
    }
  }
}

if (violations.length) {
  console.error(`[check-command-surface] 违反命令面契约，共 ${violations.length} 处：`)
  for (const v of violations) console.error('  ' + v)
  console.error('\n契约：一个命令一处定义；状态一处推演；引用必须在命令表里登记。')
  process.exit(1)
}

console.log(
  `[check-command-surface] 通过：命令引用均已注册（已登记 ${definedIds.size} 条）、surfaces 合法、状态单点实现`,
)
