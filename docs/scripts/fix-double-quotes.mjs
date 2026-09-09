/**
 * 修复上一步产生的成对双单引号：''系统'' → '系统'，'''' → ''
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = join(dirname(fileURLToPath(import.meta.url)), '../components')
const RE = /: ''([^'\n]*)''/g

let n = 0
for (const f of readdirSync(dir)) {
  if (!f.endsWith('.md')) continue
  const p = join(dir, f)
  const src = readFileSync(p, 'utf-8')
  const next = src.replace(RE, ": '$1'")
  if (next !== src) {
    writeFileSync(p, next)
    n++
    console.log(`[fix] ${f}`)
  }
}
console.log(`[fix] 处理 ${n} 个文件`)
