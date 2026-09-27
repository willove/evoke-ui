/**
 * G10 槽位门 — 槽位契约（src/slots.js）↔ SFC 模板双向核对
 *
 * 查三件事：
 *   ① 契约里写的每个命名槽，SFC 里真的有（代码删槽、改名 → 红）；
 *   ② SFC 里每个命名槽，契约里都记了（文档漏记 → 红）；
 *   ③ 契约写了 default 而 SFC 没有默认槽（或反之）→ 红；
 *   ④ 标了 slotless（无槽件）却真的开了槽 → 红（声明与实现不符）。
 * 透传型（passthrough: true，popper 包装件）只核对"确实在用 <slot :name>"，
 * 不逐一列举底座槽名。
 *
 * 用法: node scripts/check-slots.mjs （已挂入 build，违规即构建失败）
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getEtComponentEntries } from './component-entries.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')

const { SLOT_CONTRACT, SLOT_CONTRACT_PATHS } = await import(resolve(pkgRoot, 'src/slots.js'))

const COMPONENT_DIR = resolve(pkgRoot, 'src/components')

/**
 * 契约 ↔ SFC 双向核对（CLI 与 test/slots.test.js 共用）
 * @returns {string[]} 违规清单（空 = 通过）
 */
export function checkSlotContract() {
  const failures = []
  const fail = (m) => failures.push(m)

/** 读 SFC 里的槽使用情况 */
function inspect(rel) {
  const src = readFileSync(resolve(COMPONENT_DIR, rel), 'utf8')
  const tags = [...src.matchAll(/<slot\b([^>]*?)\/?>/g)].map((m) => m[1])
  return {
    named: new Set(tags.filter((a) => /name="/.test(a)).map((a) => a.match(/name="([\w-]+)"/)[1])),
    dynamic: tags.some((a) => /:name=/.test(a)),
    hasDefault: tags.some((a) => !/name=|:name=/.test(a)),
  }
}

const covered = new Set()

for (const [key, contract] of Object.entries(SLOT_CONTRACT)) {
  const rel = SLOT_CONTRACT_PATHS[key]
  if (!rel) {
    fail(`slots.js 契约「${key}」缺少 SLOT_CONTRACT_PATHS 映射（不知道对应哪个 SFC）`)
    continue
  }
  covered.add(rel)
  const actual = inspect(rel)

  if (contract.passthrough) {
    if (!actual.dynamic) fail(`${rel} 标为透传型，但模板里没有 <slot :name="…"> 动态透传`)
    continue
  }

  if (contract.slotless) {
    if (actual.named.size || actual.hasDefault) {
      fail(`${rel} 标为无槽（${contract.slotless}），但模板里确实开了槽：${[...actual.named].join(', ') || '默认槽'}`)
    }
    continue
  }

  for (const slot of contract.slots ?? []) {
    if (!actual.named.has(slot.slot)) fail(`${rel} 契约有槽「${slot.slot}」，SFC 里找不到 <slot name="${slot.slot}">`)
  }
  const documented = new Set((contract.slots ?? []).map((s) => s.slot))
  for (const name of actual.named) {
    if (!documented.has(name)) fail(`${rel} SFC 有槽「${name}」，slots.js 契约漏记`)
  }
  if (contract.default && !actual.hasDefault) fail(`${rel} 契约写了默认槽，SFC 里没有 <slot>`)
  if (actual.hasDefault && !contract.default) fail(`${rel} SFC 有默认槽，slots.js 契约漏记`)
}

// 反向：有槽的组件不许游离在契约之外（新增组件忘了登记 → 红）
const entries = getEtComponentEntries()
for (const entry of entries) {
  const rel = entry.file.replace(/^components\//, '')
  if (covered.has(rel)) continue
  let actual
  try {
    actual = inspect(rel)
  } catch {
    continue
  }
  // 未登记的组件若开了槽，必须进契约；没槽的（纯展示件）可以不在表里
  if (actual.named.size > 0 || actual.hasDefault) {
    fail(`${rel}（${entry.name}）开了槽但不在 slots.js 契约里：${
      [...actual.named].join(', ') || '默认槽'
    }`)
  }
}

  return failures
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const failures = checkSlotContract()
  if (failures.length) {
    console.error('✗ G10 槽位门未通过：')
    for (const f of failures) console.error(`  · ${f}`)
    process.exit(1)
  }
  const namedCount = Object.values(SLOT_CONTRACT).reduce((n, c) => n + (c.slots?.length ?? 0), 0)
  console.log(
    `✓ G10 槽位门通过：${Object.keys(SLOT_CONTRACT).length} 个组件 / ${namedCount} 个命名槽与 SFC 双向一致`,
  )
}
