/**
 * 剥离 md 文档页里手写的 :code 属性（demo-source 插件会自动注入）
 * 匹配 :code="` ...（含反斜杠转义）... `"
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = join(dirname(fileURLToPath(import.meta.url)), '../components')
const RE = /\s+:code="`(?:\\[\s\S]|[^`\\])*`"/g

let total = 0
for (const f of readdirSync(dir)) {
  if (!f.endsWith('.md')) continue
  const p = join(dir, f)
  const src = readFileSync(p, 'utf-8')
  const next = src.replace(RE, '')
  if (next !== src) {
    writeFileSync(p, next)
    total++
    console.log(`[strip] ${f}`)
  }
}
console.log(`[strip] 处理 ${total} 个文件`)
