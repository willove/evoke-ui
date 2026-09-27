/**
 * G11 文档覆盖门 — 组件页的"六面 + 实物"逐页可判定
 *
 * 为什么要这道门：文档站的验收口径写在计划 02 §四（一组件一页：props / events / slots /
 * 可访问名 / 键盘行为 / 密度表现），但这句话一直没有变成可判定的检查，于是 36 页里
 * 有的缺 demo、有的缺三面，"还剩哪些"每次都要人重新盘点——这正是编写慢的成因之一。
 * 门落地后，队列由 CI 维护：漏一页红一页。
 *
 * 查四件事：
 *   ① 每个组件入口都有页；
 *   ② 页里有 <CompApi id="本件" />（六面由源码现算，不再手抄）；
 *   ③ 页里不得残留手写 ## Props / ## Emits / ## Slots / ## 暴露 段（防回潮——手抄必漂移）；
 *   ④ 页里有活体 <DemoBlock>，或在 DEMO_NA 里**写明理由**（新增缺 demo 的页 = 红）；
 *   ⑤ 每个 prop / 事件 / 暴露方法都有源码注释（<CompApi> 的六面全靠它，缺一条页里就一个「未写」）。
 *
 * 用法: node scripts/check-docs-coverage.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getEtComponentEntries } from '../../packages/evoke-tools-ui/scripts/component-entries.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SITE = resolve(__dirname, '..')
const COMPONENTS = resolve(SITE, 'components')

/**
 * 确属"没有可视形态"的件在此登记理由（照 OFFICE_ALLOWLIST 的做法：显式清单 + 说明）。
 * 补上 demo 后请从这张表删掉——表只准变短。
 */
const DEMO_NA = {
  'context-menu': '右键菜单要真实 contextmenu 事件才有呈现，已在 /guide/commands 与示例工程内演示',
  'command-palette': '⌘K 浮层的完整装配在 /guide/commands 页演示，单件页重复一遍会漂',
  dropdown: '包装件，浮层内容由产品给；装配形态在 /guide/commands 演示',
  'overflow-menu': '功能区降档的产物，单独摆没有语义；见 ribbon-bar 页与视觉用例',
  'panel-group': '分组容器由 EtDock/EtWorkbench 驱动，单摆无状态；见 dock 与 workbench 页',
  'splitter-panel': '透传底座件，形态在 splitter 页演示',
  'shortcut-panel': '键位表由命令表生成，空表无内容；装配在 /guide/keyboard 演示',
}

const failures = []
const notes = []
const HAND_API_RE = /^## (Props|Emits \/ Slots|Emits|Slots|暴露)/m

const entries = getEtComponentEntries()
let withDemo = 0

for (const entry of entries) {
  const id = entry.name
  const file = resolve(COMPONENTS, `${id}.md`)
  if (!existsSync(file)) {
    failures.push(`${id}：没有组件页`)
    continue
  }
  const src = readFileSync(file, 'utf8')
  if (!src.includes(`<CompApi id="${id}" />`)) failures.push(`${id}：缺 <CompApi id="${id}" />（六面未接源码）`)
  if (HAND_API_RE.test(src)) failures.push(`${id}：残留手写 API 段——改由 <CompApi> 渲染，否则源码与文档会漂`)
  if (src.includes('<DemoBlock')) withDemo++
  else if (!DEMO_NA[id]) failures.push(`${id}：既无 <DemoBlock> 也不在 DEMO_NA 清单（补 demo 或写明理由）`)
}

for (const id of Object.keys(DEMO_NA)) {
  const file = resolve(COMPONENTS, `${id}.md`)
  if (existsSync(file) && readFileSync(file, 'utf8').includes('<DemoBlock')) {
    notes.push(`DEMO_NA 里的 ${id} 已有 demo，请从清单删除（表只准变短）`)
  }
}

// ⑤ API 成员说明零缺口：与文档页读同一份现算数据，缺一条即红（页里表现为「未写」徽标）
const { buildComponentApi } = await import(resolve(SITE, '.vitepress/component-api.mjs'))
const api = await buildComponentApi()
const undocumented = []
for (const id of Object.keys(api.components)) {
  const c = api.components[id]
  for (const p of c.props) if (!p.desc) undocumented.push(`${id} · prop ${p.name}`)
  for (const e of c.emits) if (!e.desc) undocumented.push(`${id} · 事件 ${e.name}`)
  for (const m of c.expose) if (!m.desc) undocumented.push(`${id} · 暴露 ${m.name}()`)
}
if (undocumented.length) {
  for (const u of undocumented) failures.push(`${u}：SFC 里缺 JSDoc 说明（补在源码，文档与 .d.ts 同源）`)
}

if (failures.length) {
  console.error(`[check-docs-coverage] 组件页覆盖未达标（${failures.length} 处）：`)
  for (const f of failures) console.error('  ' + f)
  process.exit(1)
}
console.log(
  `[check-docs-coverage] 通过：${entries.length} 件全部有页 + <CompApi>；活体 demo ${withDemo} 页，` +
    `显式免 demo ${Object.keys(DEMO_NA).length} 页`,
)
for (const n of notes) console.log('  注：' + n)
