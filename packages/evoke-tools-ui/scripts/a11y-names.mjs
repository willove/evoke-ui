#!/usr/bin/env node
/**
 * G4 accessible name 门 — 图标按钮必须有可访问名（tools-ui 计划 06 §一 G4）
 *
 * 判据（继承 office-suite a11y-names.mjs，首跑 30 处 → 0）：
 *   ① 原生 <button> / role="button" 元素：没有 aria-label、没有 aria-labelledby、
 *      且没有可见文本（只有图标/插槽）→ 红
 *   ② 本库图标钮（class 含 et-toolbtn / et-tabstrip__item）：必须有 aria-label
 *      （title 不算——title 不进可访问名计算，读屏软件不认）
 *   ③ 模板里 title="x" 单独出现（无 aria-label）在图标钮上 → 红
 *
 * 静态门只做"可判定"的部分；role/aria 的运行时断言由组件测试覆盖（06 §二 L2）。
 *
 * 用法: node scripts/a11y-names.mjs （已挂入 build，违规即构建失败）
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, extname, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')
const SRC = resolve(pkgRoot, 'src')

const EXTS = new Set(['.vue'])
const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', 'test'])

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

/** 取 <template> 段（<script> 里的字符串不参与本门） */
function templateOf(src) {
  const m = /<template>([\s\S]*?)<\/template>/.exec(src)
  return m ? m[1] : ''
}

/** 收集开标签及其配对闭标签之间的内容（按标签名配平，够用于本库模板深度） */
function collectElements(tpl, tagNames) {
  const out = []
  for (const tag of tagNames) {
    const openRe = new RegExp(`<${tag}(\\s[^>]*?)?>`, 'g')
    let m
    while ((m = openRe.exec(tpl))) {
      const attrs = m[1] || ''
      const start = m.index
      const contentStart = m.index + m[0].length
      // 找配对闭标签（无则视为自闭合/空内容）
      let depth = 1
      let i = contentStart
      const innerOpen = new RegExp(`<${tag}(\\s[^>]*?)?>`, 'g')
      innerOpen.lastIndex = contentStart
      let im
      while ((im = innerOpen.exec(tpl))) {
        depth++
        innerOpen.lastIndex = im.index + im[0].length
      }
      const closeRe = new RegExp(`</${tag}>`, 'g')
      closeRe.lastIndex = contentStart
      let cm
      let end = contentStart
      while ((cm = closeRe.exec(tpl))) {
        depth--
        end = cm.index
        if (depth === 0) break
      }
      out.push({ attrs, content: tpl.slice(contentStart, end), index: start })
    }
  }
  return out
}

const violations = []
const files = walk(SRC)

for (const file of files) {
  const tpl = templateOf(readFileSync(file, 'utf8'))
  if (!tpl) continue

  // ① ② ③：原生 button 与 role=button
  const buttons = [
    ...collectElements(tpl, ['button']).map((e) => ({ ...e, attrs: e.attrs + ' ' })),
    ...[...tpl.matchAll(/<(\w[\w-]*)(\s[^>]*?)?\s+role=["']button["']/g)].map((m) => ({
      attrs: (m[2] || '') + ' ',
      content: '',
      index: m.index,
    })),
  ]
  for (const btn of buttons) {
    const hasAriaLabel = /aria-label\s*=/.test(btn.attrs)
    const hasLabelledBy = /aria-labelledby\s*=/.test(btn.attrs)
    const hasTitleOnly = /\btitle\s*=/.test(btn.attrs)
    // 可见文本：内容里去掉标签后仍有非空白字符
    const visibleText = btn.content.replace(/<[^>]*>/g, '').trim()
    if (!hasAriaLabel && !hasLabelledBy && !visibleText) {
      violations.push(
        `${file}  图标按钮缺可访问名（aria-label / 可见文本至少要有一个；title 不算）: ${btn.attrs.trim().slice(0, 80)}`,
      )
    } else if (!hasAriaLabel && !hasLabelledBy && hasTitleOnly && !visibleText) {
      violations.push(`${file}  仅 title 无可访问名: ${btn.attrs.trim().slice(0, 80)}`)
    }
  }

  // 本库图标钮契约：class 含 et-toolbtn 的元素必须显式带 aria-label
  for (const m of tpl.matchAll(/<(\w[\w-]*)(\s[^>]*?)?>/g)) {
    const attrs = (m[2] || '') + ' '
    if (/class=["'][^"']*\bet-toolbtn\b/.test(attrs) && !/aria-label\s*=/.test(attrs)) {
      violations.push(`${file}  .et-toolbtn 元素必须绑定 aria-label（本库图标钮契约）: ${attrs.trim().slice(0, 80)}`)
    }
    if (/class=["'][^"']*\bet-tabstrip__item\b/.test(attrs) && !/aria-label\s*=/.test(attrs)) {
      // tab 条的 aria 由 aria-selected + 可见文字承担；纯图标 tab 才必须 aria-label
      const selfClosing = /\/>$/.test(m[0])
      if (selfClosing) {
        violations.push(`${file}  .et-tabstrip__item 自闭合（无可见文字）必须绑定 aria-label`)
      }
    }
  }
}

if (violations.length) {
  console.error(`[a11y-names] 可访问名缺失共 ${violations.length} 处：`)
  for (const v of violations) console.error('  ' + v)
  console.error('\n判据：图标按钮/图标 tab 必须 aria-label；title 不进可访问名计算。')
  process.exit(1)
}

console.log('[a11y-names] 通过：图标按钮/图标 tab 均有可访问名')
