#!/usr/bin/env node
/**
 * G5 输入法门 — 组字期禁快捷键（tools-ui 计划 06 §一 G5）
 *
 * 上一代 ime-guard.mjs 基线 28 → 0：中文/日文输入法组字期间，Enter/Esc/Backspace
 * 属于候选词上屏，不属于应用命令；不过守卫会把"选词"执行成"删除行/确认对话框"。
 *
 * 判据（静态、可判定）：
 *   ① window / document 级 keydown 监听：紧邻 600 字符内必须出现 isImeComposing(
 *      或 e.isComposing 判定
 *   ② 模板 @keydown.enter / @keydown.delete / @keydown.backspace / @keydown.esc
 *      挂在 window / document 上时同样判（@keydown.enter.window 形态）
 *
 * 用法: node scripts/ime-guard.mjs （已挂入 build，违规即构建失败）
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, extname, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')
const SRC = resolve(pkgRoot, 'src')

const EXTS = new Set(['.vue', '.js', '.mjs', '.ts'])
const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', 'test'])
const GUARD_WINDOW = 600

function walk(dir) {
  const out = []
  if (!existsSync(dir)) return out
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
const files = walk(SRC)

for (const file of files) {
  const src = readFileSync(file, 'utf8')

  // ① window/document 级 keydown 监听
  const globalRe = /(?:window|document)\s*\.\s*addEventListener\(\s*['"]keydown['"]/g
  for (const m of src.matchAll(globalRe)) {
    const vicinity = src.slice(m.index, m.index + GUARD_WINDOW)
    if (!/isImeComposing\s*\(/.test(vicinity) && !/isComposing/.test(vicinity)) {
      violations.push(
        `${file}:${lineOf(src, m.index)}  window/document 级 keydown 监听缺组字守卫（600 字符内须出现 isImeComposing）`,
      )
    }
  }

  // ② 模板挂在 window/document 上的 Enter/Esc/删除类修饰符
  const lines = src.split('\n')
  lines.forEach((line, i) => {
    if (/@keydown\.(enter|esc|delete|backspace)(\.[a-z]+)*\.(window|document)/.test(line)) {
      violations.push(
        `${file}:${i + 1}  @keydown.${'$'} 挂在 window/document 上：须先过 isImeComposing 守卫再判命令`,
      )
    }
  })
}

function lineOf(src, index) {
  return src.slice(0, index).split('\n').length
}

if (violations.length) {
  console.error(`[ime-guard] 组字守卫缺失共 ${violations.length} 处（上一代基线 28 → 0）：`)
  for (const v of violations) console.error('  ' + v)
  console.error('\n判据：window/document 级 keydown 必须判 isImeComposing / e.isComposing。')
  process.exit(1)
}

console.log('[ime-guard] 通过：键盘提交路径均有组字守卫')
