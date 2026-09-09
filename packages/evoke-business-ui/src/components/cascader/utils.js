/**
 * Cascader 内部工具 — 选项规范化/路径查找/叶子收集（纯函数）
 */

/**
 * 规范化选项树
 * @param {Array} options 原始 options
 * @param {Object} config { value, label, children, disabled }
 * @param {Object|null} parent
 * @returns {Array} 节点树 [{ value, label, children, disabled, isLeaf, data, parent }]
 */
export function normalizeOptions(options, config, parent = null) {
  const list = []
  if (!Array.isArray(options)) return list
  for (const raw of options) {
    const children = normalizeOptions(
      Array.isArray(raw?.[config.children]) ? raw[config.children] : [],
      config,
      null
    )
    const node = {
      value: raw?.[config.value],
      label: raw?.[config.label],
      disabled: !!raw?.[config.disabled],
      isLeaf: children.length === 0,
      children,
      data: raw,
      parent,
    }
    children.forEach((c) => {
      c.parent = node
    })
    list.push(node)
  }
  return list
}

/** 深度遍历 */
export function walkNodes(nodes, fn) {
  for (const n of nodes) {
    if (fn(n) === false) return
    walkNodes(n.children, fn)
  }
}

/**
 * 按 value（emitPath=false 时叶值）查找节点与路径
 * @returns {{ node, path: Array } | null}
 */
export function findByValue(nodes, value, matchPath) {
  let found = null
  const dfs = (list, trail) => {
    for (const n of list) {
      const next = [...trail, n.value]
      if (matchPath ? arrayEqual(next, matchPath) : n.value === value) {
        found = { node: n, path: next }
        return false
      }
      if (dfs(n.children, next) === false) return false
    }
  }
  dfs(nodes, [])
  return found
}

export function arrayEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
  return a.every((v, i) => v === b[i])
}

/** 路径数组 → 节点数组 */
export function pathToNodes(nodes, path) {
  const result = []
  let list = nodes
  for (const key of path) {
    const hit = list.find((n) => n.value === key)
    if (!hit) return null
    result.push(hit)
    list = hit.children
  }
  return result
}

/** 节点 → 路径（含自身，自根而下） */
export function nodeToPath(node) {
  const path = []
  let cur = node
  while (cur) {
    path.unshift(cur.value)
    cur = cur.parent
  }
  return path
}

/** 节点 → label 路径 */
export function nodeToLabels(node) {
  const labels = []
  let cur = node
  while (cur) {
    labels.unshift(cur.label)
    cur = cur.parent
  }
  return labels
}

/** 全部后代叶子路径 */
export function leafPathsOf(node) {
  const out = []
  const walk = (n, trail) => {
    const next = [...trail, n.value]
    if (n.isLeaf) {
      out.push(next)
      return
    }
    n.children.forEach((c) => walk(c, next))
  }
  walk(node, [])
  return out
}

/** 过滤：按 label 匹配（返回命中节点，含路径信息） */
export function filterNodes(nodes, query, filterMethod) {
  const hits = []
  walkNodes(nodes, (n) => {
    const match = filterMethod
      ? filterMethod(n.label, n.data)
      : String(n.label).toLowerCase().includes(String(query).toLowerCase())
    if (match) hits.push(n)
  })
  return hits
}
