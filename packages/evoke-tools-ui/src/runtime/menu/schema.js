/**
 * 菜单 / 工具区 schema 运行时（tools-ui 计划 01 §二 数据契约 / M1 交付物 2）
 *
 * 布局数据模型照 Univer 已验证的形态（05 §四）：条目布局用 `gridLayout` 的等价声明式字段
 * （rowSpan=2 大钮 / 1×1 小钮 / width 输入类控件固定宽 / showLabel），**不用散落的 size prop**；
 * 组必须声明降级终点（ScalingPolicy），任意宽度可渲染。
 *
 * 三个能力都是纯函数：按 key 路径 merge / 空节点剪枝 / 悬空引用检查（G3 ①）。
 * "加一个功能 = 加一行数据"，不是改一个 2556 行文件。
 */

/** 节点类型（toolbar 与 menu 共用一套；menu 多 separator/submenu 由组件层表达） */
export const SCHEMA_NODE_TYPES = ['tab', 'group', 'item', 'select', 'separator', 'spacer']

const KEY_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/

/** 校验单节点（key 必填且同层唯一由 merge/构建方保证，这里校验形状） */
export function assertSchemaNode(node, path = 'schema') {
  if (!node || typeof node !== 'object') {
    throw new TypeError(`[schema] ${path} 不是对象`)
  }
  if (typeof node.key !== 'string' || !KEY_RE.test(node.key)) {
    throw new TypeError(`[schema] ${path}.key 必须是非空 kebab-case 字符串：${String(node.key)}`)
  }
  if (!SCHEMA_NODE_TYPES.includes(node.type)) {
    throw new RangeError(`[schema] ${path}(${node.key}).type「${node.type}」不在 ${SCHEMA_NODE_TYPES.join(' / ')} 之内`)
  }
  if ((node.type === 'item' || node.type === 'select') && typeof node.command !== 'string') {
    throw new TypeError(`[schema] ${path}(${node.key}).command 必填（控件绑命令 id）`)
  }
  if (node.type === 'select' && node.width !== undefined && typeof node.width !== 'number') {
    throw new TypeError(`[schema] ${path}(${node.key}).width 必须是数字（px）`)
  }
  if (node.children !== undefined && !Array.isArray(node.children)) {
    throw new TypeError(`[schema] ${path}(${node.key}).children 必须是数组`)
  }
  return node
}

/** 深拷一份节点树（merge/剪枝都返回新树，输入不被改） */
function cloneNode(node) {
  if (Array.isArray(node)) return node.map(cloneNode)
  if (!node || typeof node !== 'object') return node
  const out = { ...node }
  if (Array.isArray(node.children)) out.children = node.children.map(cloneNode)
  return out
}

/** 同层子节点按 key 建索引（重复 key 直接抛—— schema 期就发现的错误不留给运行时） */
function indexChildren(children, path) {
  const map = new Map()
  for (const child of children) {
    assertSchemaNode(child, path)
    if (map.has(child.key)) {
      throw new Error(`[schema] ${path} 出现重复 key：${child.key}（同层 key 必须唯一）`)
    }
    map.set(child.key, cloneNode(child))
  }
  return map
}

/**
 * 按 key 路径 merge（产品层在框架默认 schema 上打补丁）
 *
 * 规则：
 *   - 同 key 节点递归合并（标量字段后者覆盖，children 按 key 对齐递归）；
 *   - 补丁里出现新 key → 追加到该层末尾（新增 tab / 组 / 条目都是"加一行数据"）；
 *   - 补丁节点带 `remove: true` → 从结果里删除该子树；
 *   - 返回新树，base 与 patch 都不被修改。
 *
 * @param {object|object[]} base
 * @param {object|object[]} patch
 * @returns {object|object[]}
 */
export function mergeSchema(base, patch) {
  const baseList = Array.isArray(base) ? base : [base]
  const patchList = Array.isArray(patch) ? patch : [patch]
  const merged = indexChildren(baseList, 'base')
  const order = [...merged.keys()]
  // 补丁层先过同一套重复 key 校验（schema 期的错误不留到运行时）
  const patchIndex = indexChildren(patchList, 'patch')

  for (const [key, patchNode] of patchIndex) {
    if (patchNode.remove === true) {
      if (merged.delete(key)) {
        const i = order.indexOf(key)
        if (i >= 0) order.splice(i, 1)
      }
      continue
    }
    const existing = merged.get(key)
    if (!existing) {
      merged.set(key, cloneNode(patchNode))
      order.push(key)
      continue
    }
    const next = { ...existing }
    for (const [field, value] of Object.entries(patchNode)) {
      if (field === 'children' || field === 'key') continue
      next[field] = value
    }
    if (patchNode.children) {
      next.children = mergeChildren(existing.children ?? [], patchNode.children, `${key}`)
    }
    merged.set(key, next)
  }

  const result = order.map((k) => merged.get(k))
  return Array.isArray(base) ? result : result[0]
}

function mergeChildren(baseChildren, patchChildren, path) {
  const merged = indexChildren(baseChildren, path)
  const order = [...merged.keys()]
  // 补丁层先过重复 key 校验，再按序合并（保序 = 追加到层尾的语义可预期）
  const patchIndex = indexChildren(patchChildren, `${path}(patch)`)
  for (const [key, patchNode] of patchIndex) {
    if (patchNode.remove === true) {
      if (merged.delete(key)) {
        const i = order.indexOf(key)
        if (i >= 0) order.splice(i, 1)
      }
      continue
    }
    const existing = merged.get(key)
    if (!existing) {
      merged.set(key, cloneNode(patchNode))
      order.push(key)
      continue
    }
    const next = { ...existing }
    for (const [field, value] of Object.entries(patchNode)) {
      if (field === 'children' || field === 'key') continue
      next[field] = value
    }
    if (patchNode.children) {
      next.children = mergeChildren(existing.children ?? [], patchNode.children, `${path}.${key}`)
    }
    merged.set(key, next)
  }
  return order.map((k) => merged.get(k))
}

/**
 * 空节点剪枝（工具区里"命令被禁用/命令不存在"不该留下空壳组）
 * @param {object|object[]} schema
 * @param {{ registry?: { has: (id: string) => boolean }, dropUnregistered?: boolean }} [options]
 *   registry 提供时登记悬空引用；dropUnregistered=true 时把悬空 item 一并剪掉
 * @returns {{ schema: any, removed: string[], dangling: string[] }}
 */
export function pruneSchema(schema, options = {}) {
  const { registry = null, dropUnregistered = false } = options
  const removed = []
  const dangling = []

  const pruneNode = (node) => {
    if (Array.isArray(node)) {
      const kept = []
      for (const child of node) {
        const pruned = pruneNode(child)
        if (pruned !== null) kept.push(pruned)
      }
      return kept.length ? kept : null
    }
    if (!node || typeof node !== 'object') return node
    if (node.remove === true) {
      removed.push(node.key)
      return null
    }
    if (node.command && registry && !registry.has(node.command)) {
      dangling.push(`${node.key} → ${node.command}`)
      if (dropUnregistered) {
        removed.push(node.key)
        return null
      }
    }
    if (Array.isArray(node.children)) {
      const kept = []
      for (const child of node.children) {
        const pruned = pruneNode(child)
        if (pruned !== null) kept.push(pruned)
      }
      const next = { ...node }
      if (kept.length === 0 && (node.type === 'tab' || node.type === 'group')) {
        removed.push(node.key)
        return null
      }
      next.children = kept
      return next
    }
    return node
  }

  const result = pruneNode(Array.isArray(schema) ? schema : [schema])
  const pruned = Array.isArray(schema) ? (result ?? []) : (result ? result[0] : null)
  return { schema: pruned, removed, dangling }
}

/** 收集 schema 树里的命令引用（path → commandId），G3 门与测试用 */
export function collectCommandRefs(schema) {
  const out = []
  const visit = (node, path) => {
    if (!node) return
    if (Array.isArray(node)) {
      for (const n of node) visit(n, path)
      return
    }
    if (typeof node !== 'object') return
    if (typeof node.command === 'string' && node.command) {
      out.push({ path: `${path}/${node.key}`, commandId: node.command })
    }
    if (Array.isArray(node.children)) {
      node.children.forEach((c, i) => visit(c, `${path}/${node.key}`))
    }
  }
  visit(schema, '')
  return out
}

/** 悬空引用清单（G3 ① 的判据：item 绑的命令必须已注册） */
export function findDanglingCommandRefs(schema, registry) {
  return collectCommandRefs(schema)
    .filter((ref) => !registry.has(ref.commandId))
    .map((ref) => `${ref.path} → ${ref.commandId}`)
}

/** 扁平化成渲染序列（组件层只消费这一份，不自己递归） */
export function flattenSchema(schema) {
  const groups = []
  const walk = (nodes, tabKey) => {
    for (const node of nodes ?? []) {
      if (node.type === 'group') {
        groups.push({ tab: tabKey, group: node })
      } else if (node.type === 'tab') {
        walk(node.children ?? [], node.key)
      } else if (Array.isArray(node.children)) {
        walk(node.children, tabKey)
      }
    }
  }
  walk(Array.isArray(schema) ? schema : [schema], null)
  return groups
}

/**
 * 可见量守约（05 §四：整条 ≤70、每组 ≤7、每 tab 组 ≤6）
 * @returns {{ ok: boolean, violations: string[] }}
 */
export function checkVisibleBudget(schema, limits = {}) {
  const { perItem = 70, perGroup = 7, groupsPerTab = 6 } = limits
  const violations = []
  const groups = flattenSchema(schema)
  const perTabCount = new Map()
  const perGroupCount = new Map()

  for (const { tab, group } of groups) {
    const items = (group.children ?? []).filter((c) => c.type === 'item' || c.type === 'select')
    perGroupCount.set(group.key, (perGroupCount.get(group.key) ?? 0) + items.length)
    if (tab) perTabCount.set(tab, (perTabCount.get(tab) ?? 0) + 1)
  }

  let total = 0
  for (const [key, count] of perGroupCount) {
    total += count
    if (count > perGroup) violations.push(`组 ${key} 可见条目 ${count} > ${perGroup}（超出走下拉/「更多」/对话框）`)
  }
  if (total > perItem) violations.push(`整条工具区可见命令 ${total} > ${perItem}`)
  for (const [tab, count] of perTabCount) {
    if (count > groupsPerTab) violations.push(`tab ${tab} 的组数 ${count} > ${groupsPerTab}`)
  }
  return { ok: violations.length === 0, violations }
}
