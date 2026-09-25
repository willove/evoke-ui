#!/usr/bin/env node
/**
 * G6 文案门（tools-ui 计划 06 §一 / §三，M1 新增）
 *
 * 上一代把「…注释走协同（§5.1）」印进了工具栏、把操作指引段塞进 PDF 工具栏；
 * 把"条件格式 6 个变体各占一个按钮"铺满一个组。本门把可判定的部分做成构建期硬检查：
 *   ① 禁内部文档编号进 UI：模板里出现 `§`（以及 `§x.y` 引用形态）即红；
 *   ② 禁默认态成段说明：<template> 文本节点里 >10 字且以句号/叹号/问号/分号结尾的
 *      陈述句，单文件 >2 句即红（minimal-copy-disclosure：默认态同屏 >10 字陈述句 ≤2）；
 *   ③ 禁开发说明进模板：TODO / FIXME / 调试用 / 内部 / 测试用 等字样出现在模板文本即红。
 *
 * 不做的事：按钮文案 ≤4 字是"优先"不是硬禁（误报成本高）；组名小字抢行由视觉断言管。
 *
 * 范围：packages/evoke-tools-ui/src 下全部 .vue 组件的 template 段
 *
 * 用法: node scripts/check-copy.mjs （已挂入 build，违规即构建失败）
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, extname, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')
const SRC = resolve(pkgRoot, 'src')

const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage'])

function walk(dir) {
  const out = []
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) out.push(...walk(p))
    else if (name.endsWith('.vue')) out.push(p)
  }
  return out
}

const DEV_KEYWORDS = ['TODO', 'FIXME', 'XXX', '调试用', '内部文档', '测试用', '占位文案']
/** >10 字陈述句：以句末标点收尾的中文/英文长句 */
const SENTENCE_RE = /[一-龥A-Za-z0-9][^<>{}]{9,}[。！？；!?;]/

const violations = []

for (const file of walk(SRC)) {
  const src = readFileSync(file, 'utf8')

  // <template> 段（判据只看用户可见的模板；§ 引用禁在模板里出现，
  // 代码注释与计划文档里引用计划章节是允许的——06 §三 原文）
  const tplMatch = /<template>([\s\S]*?)<\/template>/.exec(src)
  if (!tplMatch) continue
  // 去掉 HTML 注释：注释不进渲染树，不是 UI 文案（§ 与说明句都只看可见文本）
  const tpl = tplMatch[1].replace(/<!--[\s\S]*?-->/g, '')
  const tplOffset = src.slice(0, tplMatch.index).split('\n').length

  // ① § 引用（仅模板段）
  tpl.split('\n').forEach((line, i) => {
    if (/§/.test(line)) {
      violations.push(`${file}:${tplOffset + i}  模板出现 § 小节引用（内部文档编号禁进 UI；引用只进代码注释与文档）`)
    }
  })

  // ② 成段说明句
  const sentences = []
  for (const m of tpl.matchAll(/>([^<>]+)</g)) {
    const text = m[1].trim()
    if (!text) continue
    if (SENTENCE_RE.test(text)) {
      const line = tplOffset + tpl.slice(0, m.index).split('\n').length - 1
      sentences.push({ line, text: text.slice(0, 40) })
    }
  }
  if (sentences.length > 2) {
    for (const s of sentences) {
      violations.push(`${file}:${s.line}  默认态成段说明句（>10 字陈述句）：${s.text}（同文件 ${sentences.length} 句 > 2，应收进 tooltip/折叠）`)
    }
  }

  // ③ 开发说明字样
  for (const m of tpl.matchAll(/>([^<>]+)</g)) {
    const text = m[1].trim()
    if (!text) continue
    for (const kw of DEV_KEYWORDS) {
      if (text.includes(kw)) {
        const line = tplOffset + tpl.slice(0, m.index).split('\n').length - 1
        violations.push(`${file}:${line}  模板文本含开发说明字样「${kw}」：${text.slice(0, 40)}`)
      }
    }
  }
}

if (violations.length) {
  console.error(`[check-copy] 违反文案纪律，共 ${violations.length} 处：`)
  for (const v of violations) console.error('  ' + v)
  console.error('\n口径：默认态说明句 ≤2（>10 字）；§ 引用与开发说明禁入 UI；文案走 minimal-copy-disclosure。')
  process.exit(1)
}

console.log('[check-copy] 通过：无 § 引用、无成段说明、无开发说明字样')
