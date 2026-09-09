/**
 * Tree 内部节点模型工具 — 构建/级联勾选/过滤（纯函数，可测）
 * 约定：根节点 level = 1，缩进 = (level - 1) * indent
 */

/**
 * 构建内部节点模型（带 parent 指针与层级）
 * @param {Array} data 原始数据
 * @param {Object} fieldMap { children, label, disabled, isLeaf }
 * @param {Object|null} parent
 * @param {number} level
 * @param {{ lazy?: boolean }} options lazy 模式下无 children 且未标记 isLeaf 的节点视为待加载
 * @returns {Array} 节点模型数组
 */
export function buildNodes(data, fieldMap, parent = null, level = 1, options = {}) {
  const childrenKey = fieldMap.children || 'children'
  const isLeafField = fieldMap.isLeaf || 'isLeaf'
  const lazy = !!options.lazy
  const list = []
  if (!Array.isArray(data)) return list
  for (const raw of data) {
    const children = Array.isArray(raw?.[childrenKey]) ? raw[childrenKey] : []
    let isLeaf
    if (lazy) {
      isLeaf = children.length > 0 ? false : !!raw?.[isLeafField]
    } else {
      isLeaf = children.length === 0
    }
    const node = {
      raw,
      data: raw, // 原始数据引用
      key: null, // 由调用方按 nodeKey 填充
      label: raw?.[fieldMap.label || 'label'],
      disabled: !!raw?.[fieldMap.disabled || 'disabled'],
      level,
      parent,
      isLeaf,
      childNodes: [],
      expandable: !isLeaf,
      loaded: !lazy || children.length > 0 || isLeaf,
    }
    node.childNodes = buildNodes(children, fieldMap, node, level + 1, options)
    list.push(node)
  }
  return list
}

/**
 * 填充节点 key
 * @param {Array} nodes
 * @param {string|Function} nodeKey
 */
export function fillKeys(nodes, nodeKey) {
  const walk = (list) => {
    for (const n of list) {
      n.key = typeof nodeKey === 'function' ? nodeKey(n.raw) : n.raw?.[nodeKey] ?? n
      walk(n.childNodes)
    }
  }
  walk(nodes)
}

/** 全部后代（不含自身） */
export function descendantsOf(node) {
  const out = []
  const walk = (n) => {
    for (const c of n.childNodes) {
      out.push(c)
      walk(c)
    }
  }
  walk(node)
  return out
}

/**
 * 勾选级联：给定 checkedKeys 集合，重算整棵树每个节点的勾选/半选状态
 * @param {Array} roots
 * @param {Set<string>} checkedKeys
 * @param {boolean} checkStrictly
 * @returns {{ checked: Set, half: Set }}
 */
export function cascadeCheck(roots, checkedKeys, checkStrictly) {
  const checked = new Set()
  const half = new Set()
  if (checkStrictly) {
    for (const k of checkedKeys) checked.add(k)
    return { checked, half }
  }
  const walk = (node) => {
    const children = node.childNodes
    let allChecked = children.length > 0
    let someChecked = false
    for (const c of children) {
      const st = walk(c)
      if (st === 'checked') someChecked = true
      else if (st === 'half') {
        someChecked = true
        allChecked = false
      } else allChecked = false
    }
    if (children.length === 0) {
      if (checkedKeys.has(node.key)) {
        checked.add(node.key)
        return 'checked'
      }
      return 'none'
    }
    if (allChecked) {
      checked.add(node.key)
      return 'checked'
    }
    if (someChecked) {
      half.add(node.key)
      return 'half'
    }
    return 'none'
  }
  for (const root of roots) walk(root)
  return { checked, half }
}

/** 深度优先查找节点 */
export function findNode(roots, predicate) {
  for (const n of roots) {
    if (predicate(n)) return n
    const found = findNode(n.childNodes, predicate)
    if (found) return found
  }
  return null
}

/** 过滤：命中节点保留（含其祖先链）；返回 [{ node, visibleChildren }] 结构 */
export function filterNodes(roots, filterMethod) {
  const walk = (list) => {
    const out = []
    for (const n of list) {
      const children = walk(n.childNodes)
      const hit = filterMethod ? !!filterMethod(n.label, n.raw) : true
      if (hit || children.length) {
        out.push({ node: n, visibleChildren: children })
      }
    }
    return out
  }
  return walk(roots)
}
