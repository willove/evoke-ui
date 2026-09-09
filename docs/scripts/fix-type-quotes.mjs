/**
 * 修复 type: ''xxx'' 联合类型行的引号混乱 —— type 值内一律去单引号
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = join(dirname(fileURLToPath(import.meta.url)), '../components')
const RE = /type: ''(.*)'', default:/

let n = 0
for (const f of readdirSync(dir)) {
  if (!f.endsWith('.md')) continue
  const p = join(dir, f)
  const lines = readFileSync(p, 'utf-8').split('\n')
  let changed = false
  const out = lines.map((line) => {
    const m = line.match(RE)
    if (!m) return line
    changed = true
    return line.replace(RE, `type: '${m[1].replaceAll("'", '')}', default:`)
  })
  if (changed) {
    writeFileSync(p, out.join('\n'))
    n++
    console.log(`[fix] ${f}`)
  }
}
console.log(`[fix] 处理 ${n} 个文件`)
