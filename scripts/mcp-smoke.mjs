/**
 * evoke-mcp stdio 冒烟测试：起服务 → initialize → tools/list →
 * 依次调用 lint_chart_spec / generate_chart_spec / search_components / get_component_docs
 */
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

const repo = resolve(import.meta.dirname, '..')
const proc = spawn('node', [resolve(repo, 'packages/evoke-mcp/mcp.mjs')], {
  cwd: resolve(repo, 'packages/evoke-mcp'),
  stdio: ['pipe', 'pipe', 'pipe'],
})
let stderr = ''
proc.stderr.on('data', (d) => (stderr += d))

const pending = new Map()
let nextId = 1
let buf = ''

proc.stdout.on('data', (chunk) => {
  buf += chunk
  let idx
  while ((idx = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, idx).trim()
    buf = buf.slice(idx + 1)
    if (!line) continue
    const msg = JSON.parse(line)
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
    }
  }
})

function rpc(method, params) {
  const id = nextId++
  return new Promise((resolve2) => {
    pending.set(id, resolve2)
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
  })
}

function textOf(res) {
  return res.result?.content?.[0]?.text ?? JSON.stringify(res)
}

// 1. initialize
const init = await rpc('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: { name: 'smoke', version: '0.0.1' },
})
console.log('server:', init.result?.serverInfo?.name, init.result?.serverInfo?.version)
proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n')

// 2. tools/list
const list = await rpc('tools/list', {})
const names = list.result.tools.map((t) => t.name)
console.log('tools:', names.join(', '))
if (names.length !== 8) throw new Error(`期望 8 个工具，实际 ${names.length}`)

// 3. lint_chart_spec：合法 spec + 故意非法 spec
const lintOk = await rpc('tools/call', {
  name: 'lint_chart_spec',
  arguments: { options: { type: 'line', labels: ['一月', '二月'], series: [{ name: '营收', data: [120, 200] }] } },
})
console.log('\n[lint 合法] =>', textOf(lintOk).slice(0, 220))
const lintBad = await rpc('tools/call', {
  name: 'lint_chart_spec',
  arguments: { options: { type: 'nope' } },
})
console.log('\n[lint 非法] =>', textOf(lintBad).slice(0, 300))

// 4. generate_chart_spec
const gen = await rpc('tools/call', {
  name: 'generate_chart_spec',
  arguments: { data: '月份,销售额\n一月,120\n二月,200\n三月,150', requirement: '对比各月销售额' },
})
console.log('\n[generate] =>', textOf(gen).slice(0, 260))

// 5. search_components
const search = await rpc('tools/call', { name: 'search_components', arguments: { query: '表格' } })
console.log('\n[search 表格] =>', textOf(search).slice(0, 300))

// 6. get_component_docs（charts 站已部署 .md，走线上）
const docs = await rpc('tools/call', { name: 'get_component_docs', arguments: { site: 'charts', name: '折线图' } })
const docsText = textOf(docs)
console.log('\n[docs 折线图] =>', docsText.slice(0, 160).replace(/\n/g, ' '), '...')
if (!docsText.includes('# 折线图')) throw new Error('组件文档抓取失败')

console.log('\n✅ 冒烟通过')
proc.kill()
process.exit(0)
