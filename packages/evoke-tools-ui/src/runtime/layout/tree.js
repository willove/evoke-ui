/**
 * 工作台布局树契约（tools-ui 计划 05 L3 / M2 交付物 1）
 *
 * 形态：dock 区域树（left / right / bottom）+ 中列画布位；面板可折叠 / 隐藏 /
 * 最大化，尺寸随停靠区分摊。M0/M1 的纪律在这里延续：**先契约后组件**——
 * 布局是产品级能力（组件库层面做不了，EbSplitter 只是基元），增删改查、序列化、
 * 损坏降级全部是纯函数（06 §二 L1 契约层，可单测）。
 *
 * 两条硬要求：
 *   ① 损坏的持久化数据**不得白屏**——deserialize/load 一律降级到默认布局并报 errors；
 *   ② 面板隐藏 ≠ 不可达——hidden 是显式状态，"重置布局/显示面板"能把它找回来。
 */

/** 停靠区允许的方向（bottom 独占底部，left/right 分列） */
export const DOCK_SIDES = ['left', 'right', 'bottom']

/** 停靠区呈现：stack = 同屏多面板并列（默认，尺寸分摊）；tabs = 单渲染位 tab 化 */
export const DOCK_PRESENTATIONS = ['stack', 'tabs']

const ID_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/

/** 深拷（布局树是纯数据；所有操作返回新树，输入不被改） */
function clone(value) {
  return value === undefined ? value : JSON.parse(JSON.stringify(value))
}

/** 尺寸合法性：正数 px 或 'NN%' */
function isSizeValue(v) {
  if (typeof v === 'number') return Number.isFinite(v) && v > 0
  if (typeof v === 'string') return /^\d+(\.\d+)?%$/.test(v)
  return false
}

function assertPanel(panel, path, errors) {
  if (!panel || typeof panel !== 'object') {
    errors.push(`${path} 不是对象`)
    return null
  }
  const { id, title } = panel
  if (typeof id !== 'string' || !ID_RE.test(id)) {
    errors.push(`${path}.id 必须是非空 kebab-case 字符串：${String(id)}`)
    return null
  }
  if (typeof title !== 'string' || !title) {
    errors.push(`${path}(${id}).title 必填（面板标题栏要显示）`)
    return null
  }
  if (panel.size !== undefined && !isSizeValue(panel.size)) {
    errors.push(`${path}(${id}).size 必须是正数或 'NN%'：${String(panel.size)}`)
  }
  if (panel.min !== undefined && !isSizeValue(panel.min)) {
    errors.push(`${path}(${id}).min 无效：${String(panel.min)}`)
  }
  if (panel.max !== undefined && !isSizeValue(panel.max)) {
    errors.push(`${path}(${id}).max 无效：${String(panel.max)}`)
  }
  return {
    id,
    title,
    size: panel.size,
    min: panel.min,
    max: panel.max,
    collapsed: !!panel.collapsed,
    hidden: !!panel.hidden,
    closable: panel.closable !== false,
  }
}

function assertDock(dock, errors, seenIds) {
  if (!dock || typeof dock !== 'object') {
    errors.push('dock 不是对象')
    return null
  }
  const { id, side } = dock
  if (typeof id !== 'string' || !ID_RE.test(id)) {
    errors.push(`dock.id 必须是非空 kebab-case：${String(id)}`)
    return null
  }
  if (!DOCK_SIDES.includes(side)) {
    errors.push(`dock(${id}).side 必须是 ${DOCK_SIDES.join(' / ')}：${String(side)}`)
    return null
  }
  if (dock.presentation !== undefined && !DOCK_PRESENTATIONS.includes(dock.presentation)) {
    errors.push(`dock(${id}).presentation 必须是 ${DOCK_PRESENTATIONS.join(' / ')}：${String(dock.presentation)}`)
  }
  if (!Array.isArray(dock.panels)) {
    errors.push(`dock(${id}).panels 必须是数组`)
    return null
  }
  const panels = []
  for (const [i, raw] of dock.panels.entries()) {
    const panel = assertPanel(raw, `dock(${id}).panels[${i}]`, errors)
    if (panel) panels.push(panel)
  }
  // presentation 进树：tabs 档是产品/用户选择的呈现方式，要过持久化（不进 = 刷新丢）
  return {
    id,
    side,
    collapsed: !!dock.collapsed,
    presentation: dock.presentation === 'tabs' ? 'tabs' : 'stack',
    panels,
  }
}

/**
 * 构造/校验布局树（同名 id 全局唯一：dock 与面板共用一个命名空间）
 * @param {{ docks: Array }} spec
 * @returns {{ docks: Array, maximized: string|null }}
 */
export function createLayoutTree(spec) {
  const errors = []
  const tree = normalizeLayout(spec, null, errors)
  if (!tree) {
    throw new RangeError(`[layout] 布局定义非法：${errors.join('；')}`)
  }
  return tree
}

/**
 * 规范化任意输入为布局树（不抛错：收集 errors，输入不可用时用 fallback）
 * @param {any} input
 * @param {{ docks: Array }|null} fallback 输入不可用时的默认布局（null = 允许返回 null）
 * @param {string[]} [errors] 错误收集器（复用调用方的数组）
 * @returns {{ docks: Array, maximized: string|null }|null}
 */
export function normalizeLayout(input, fallback = null, errors = []) {
  if (!input || typeof input !== 'object' || !Array.isArray(input.docks)) {
    errors.push('布局不是含 docks 数组的对象')
    return fallback ? clone(fallback) : null
  }
  const seenIds = new Set()
  const docks = []
  for (const raw of input.docks) {
    const dock = assertDock(raw, errors, seenIds)
    if (!dock) continue
    if (seenIds.has(dock.id)) {
      errors.push(`dock id 重复：${dock.id}`)
      continue
    }
    seenIds.add(dock.id)
    for (const panel of dock.panels) {
      if (seenIds.has(panel.id)) {
        errors.push(`面板 id 与已有节点重复：${panel.id}`)
        continue
      }
      seenIds.add(panel.id)
    }
    docks.push(dock)
  }
  if (docks.length === 0) {
    errors.push('布局没有任何可用 dock')
    return fallback ? clone(fallback) : null
  }
  const maximized = typeof input.maximized === 'string' ? input.maximized : null
  return { docks, maximized }
}

/** 序列化（纯 JSON；localStorage 直接存这个字符串） */
export function serializeLayout(tree) {
  return JSON.stringify(tree)
}

/**
 * 反序列化：**损坏数据不得白屏**——解析失败/校验不过一律降级到 fallback，
 * errors 里带原因（调用方 dev 下可 console.warn）。
 * @param {string} json
 * @param {{ docks: Array }} fallback
 * @returns {{ tree: object, errors: string[], usedFallback: boolean }}
 */
export function deserializeLayout(json, fallback) {
  const errors = []
  let parsed
  try {
    parsed = JSON.parse(json)
  } catch (e) {
    return { tree: clone(fallback), errors: [`JSON 解析失败：${e.message}`], usedFallback: true }
  }
  const tree = normalizeLayout(parsed, null, errors)
  if (!tree) {
    errors.push('持久化数据不可用，降级到默认布局')
    return { tree: clone(fallback), errors, usedFallback: true }
  }
  // 反序列化也要过一遍 id 命名空间（重复 id 会让折叠/最大化打到错误的面板）
  return { tree, errors, usedFallback: false }
}

/** 持久化读写（06 §四：单次 <1ms、异常静默降级——隐私模式/配额满不炸） */
export function loadLayout(storage, key, fallback) {
  try {
    const raw = storage.getItem(key)
    if (!raw) return { tree: clone(fallback), errors: [], usedFallback: false }
    return deserializeLayout(raw, fallback)
  } catch {
    return { tree: clone(fallback), errors: ['存储读取失败，降级到默认布局'], usedFallback: true }
  }
}

export function saveLayout(storage, key, tree) {
  try {
    storage.setItem(key, serializeLayout(tree))
    return true
  } catch {
    return false
  }
}

// ─── 查询 ───

/** 找面板（返回 { dock, panel, index } 或 null） */
export function findPanel(tree, panelId) {
  for (const dock of tree.docks) {
    const index = dock.panels.findIndex((p) => p.id === panelId)
    if (index >= 0) return { dock, panel: dock.panels[index], index }
  }
  return null
}

export function findDock(tree, dockId) {
  return tree.docks.find((d) => d.id === dockId) ?? null
}

export function dockOf(tree, panelId) {
  return findPanel(tree, panelId)?.dock ?? null
}

export function allPanelIds(tree) {
  return tree.docks.flatMap((d) => d.panels.map((p) => p.id))
}

/** 可见面板（未隐藏、未折叠；折叠的面板仍在，只是内容不渲染） */
export function visiblePanels(tree) {
  return tree.docks.flatMap((d) => d.panels.filter((p) => !p.hidden && !p.collapsed))
}

// ─── 变更（一律返回新树） ───

function withDock(tree, dockId, updater) {
  return {
    ...clone(tree),
    docks: tree.docks.map((dock) => (dock.id === dockId ? updater(clone(dock)) : dock)),
  }
}

function withPanel(tree, panelId, updater) {
  return {
    ...clone(tree),
    docks: tree.docks.map((dock) => {
      const index = dock.panels.findIndex((p) => p.id === panelId)
      if (index < 0) return dock
      const next = clone(dock)
      next.panels[index] = updater(next.panels[index])
      return next
    }),
  }
}

/** 面板折叠切换（位宽收成标题条、声明宽保留——展开即还原，不回写冲洗过的宽） */
export function togglePanelCollapsed(tree, panelId) {
  if (!findPanel(tree, panelId)) return tree
  return withPanel(tree, panelId, (panel) => ({ ...panel, collapsed: !panel.collapsed }))
}

/** 整个停靠区折叠（侧栏整列收起；M2 的"折叠后命令仍可达"由产品层保证） */
export function toggleDockCollapsed(tree, dockId) {
  if (!findDock(tree, dockId)) return tree
  return withDock(tree, dockId, (dock) => ({ ...dock, collapsed: !dock.collapsed }))
}

/** 设面板尺寸（min/max 夹角互不越界——与 EbSplitter 的语义对齐） */
export function setPanelSize(tree, panelId, size) {
  if (!isSizeValue(size)) return tree
  const found = findPanel(tree, panelId)
  if (!found) return tree
  const { panel } = found
  let next = size
  if (typeof size === 'number') {
    if (typeof panel.min === 'number') next = Math.max(next, panel.min)
    if (typeof panel.max === 'number') next = Math.min(next, panel.max)
  }
  return withPanel(tree, panelId, (p) => ({ ...p, size: next }))
}

/** 隐藏面板（显式状态：重置布局或显示面板可恢复——"隐藏 ≠ 不可达"） */
export function hidePanel(tree, panelId) {
  if (!findPanel(tree, panelId)) return tree
  const next = withPanel(tree, panelId, (panel) => ({ ...panel, hidden: true, collapsed: false }))
  // 隐藏的是最大化目标时，退出最大化（否则残留一个指向不存在面板的 maximized）
  return next.maximized === panelId ? { ...next, maximized: null } : next
}

export function showPanel(tree, panelId) {
  if (!findPanel(tree, panelId)) return tree
  return withPanel(tree, panelId, (panel) => ({ ...panel, hidden: false }))
}

/** 最大化 / 还原（同刻只有一个面板全屏） */
export function maximizePanel(tree, panelId) {
  if (!findPanel(tree, panelId)) return tree
  return { ...clone(tree), maximized: panelId }
}

export function restorePanel(tree) {
  if (!tree.maximized) return tree
  return { ...clone(tree), maximized: null }
}

/** 增删 dock / 面板（产品层在自己默认布局上做结构变更） */
export function addDock(tree, dock) {
  const errors = []
  const normalized = normalizeLayout({ docks: [...tree.docks, dock], maximized: null }, null, errors)
  if (!normalized) return { tree, errors }
  return { tree: normalized, errors: [] }
}

export function removeDock(tree, dockId) {
  const docks = tree.docks.filter((d) => d.id !== dockId)
  if (docks.length === 0) return { tree, errors: ['至少保留一个 dock'] }
  const maximized = tree.maximized && findPanel({ docks }, tree.maximized) ? tree.maximized : null
  return { tree: { docks, maximized }, errors: [] }
}

/** 重置 = 回到默认布局（入口收口成显式函数，避免各处 clone 默认树） */
export function resetLayout(defaultTree) {
  return clone(defaultTree)
}

/** 两棵树是否等价（持久化写盘前比对，避免无变更也写 localStorage） */
export function layoutEquals(a, b) {
  return serializeLayout(a) === serializeLayout(b)
}
