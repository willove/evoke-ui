/**
 * 类型产物后处理（vue-tsc 之后运行）：
 *
 * 1. 说明符改写 — vue-tsc 产出的 d.ts 以 './x.vue' 引用 SFC 声明（实际文件为
 *    x.vue.d.ts）。普通 tsc 只对 .js 系后缀做 .d.ts 替换，解析不了 '.vue'；
 *    统一改写为 './x.vue.d.ts' 后，vue-tsc 与普通 tsc 消费端均可直接解析，
 *    无需消费端开启 allowArbitraryExtensions。
 * 2. 子路径存根 — 为 "./*" 通配 exports 生成 dist/types/entries/<name>.d.ts，
 *    re-export 对应 SFC 的镜像声明（发布包只含 dist，不得指向 src）。
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname, relative, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getComponentEntries } from './component-entries.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')
const typesDir = resolve(pkgRoot, 'dist/types')

// ── 1. 子路径类型存根 ──

const outDir = resolve(typesDir, 'entries')
mkdirSync(outDir, { recursive: true })

for (const { name, file } of getComponentEntries()) {
  // 指向 dist/types 内的镜像声明，而非源码（发布包只含 dist）
  const spec = relative(outDir, resolve(typesDir, file)).replaceAll('\\', '/')
  const code =
    `// 自动生成：${name} 子路径类型入口（源 = src/${file}），勿手改\n` +
    `export * from './${spec}'\n` +
    `export { default } from './${spec}'\n`
  writeFileSync(resolve(outDir, `${name}.d.ts`), code)
}

// ── 2. '.vue' 说明符 → '.vue.d.ts'（含上一步存根，统一走这一通道）──

const VUE_SPECIFIER = /(from\s+|import\()['"]([^'"]+\.vue)['"]/g

function walkDts(dir) {
  const out = []
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name)
    if (name.isDirectory()) out.push(...walkDts(p))
    else if (name.name.endsWith('.d.ts')) out.push(p)
  }
  return out
}

let rewritten = 0
for (const file of walkDts(typesDir)) {
  const code = readFileSync(file, 'utf8')
  const next = code.replace(VUE_SPECIFIER, (_, lead, spec) => `${lead}'${spec}.d.ts'`)
  if (next !== code) {
    writeFileSync(file, next)
    rewritten++
  }
}

console.log(
  `[post-types] 说明符改写 ${rewritten} 个文件；${getComponentEntries().length} 个子路径存根 → dist/types/entries/`,
)
