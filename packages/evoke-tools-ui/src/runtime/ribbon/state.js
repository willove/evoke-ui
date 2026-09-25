/**
 * 工具区状态机（tools-ui 计划 01 §3.1 / 05 §四 / M1 交付物 3）
 *
 * 四件事，全部纯函数（L1 契约层，可单测）：
 *   ① 真折叠：Ctrl+F1 / ⌥⌘R / 双击 tab 切换；折叠时 peek 浮层临时展开；每产品持久化；
 *   ② 分量降级（对齐 Windows Ribbon Framework 的 ScalingPolicy：IdealSizes + 逐组 Scale）：
 *      tier 0 全量 → tier 1 小图标 → tier 2 整组变下拉；
 *   ③ 溢出折叠：组级规划，放不下的组收进「更多」（禁换行——G7 已锁 nowrap）；
 *   ④ 上下文 tab：声明式唤出（选区/焦点推演），条件消失即退场。
 */

export const RIBBON_SCALE_TIERS = {
  FULL: 0, // 大钮 + caption（IdealSizes）
  SMALL: 1, // 小图标（标签收起）
  GROUP_DROPDOWN: 2, // 整组变成一个下拉按钮（官方建议：几乎每个组都声明到最小档）
}

/** 折叠状态机（toggle / collapse / expand / peek 四个动作） */
export function nextCollapsed(current, action) {
  switch (action) {
    case 'toggle':
      return !current
    case 'collapse':
      return true
    case 'expand':
      return false
    case 'peek':
      // peek 不改持久态：只表达"临时展开"，消费方渲染浮层后自行收回
      return current
    default:
      return current
  }
}

/** 折叠后工具区高度 = --et-chrome-toolarea-collapsed（0）；展开 = 控件行 + 组标题行 */
export function toolAreaHeight({ collapsed, largeButton, groupLabel }) {
  return collapsed ? 0 : largeButton + groupLabel
}

/**
 * 分量降级：把一个组按档位缩放（返回新节点树，不改输入）
 * @param {object} group schema 组节点
 * @param {0|1|2} tier
 * @param {{ smallLabel?: boolean }} [options] smallLabel=true 时 tier 1 保留小标签（Excel 语义）
 */
export function scaleGroup(group, tier, options = {}) {
  if (tier === RIBBON_SCALE_TIERS.FULL) return group
  if (tier === RIBBON_SCALE_TIERS.SMALL) {
    return {
      ...group,
      scaled: 'small',
      children: (group.children ?? []).map((child) =>
        child.type === 'item' ? { ...child, size: 'small', showLabel: !!options.smallLabel } : child,
      ),
    }
  }
  // 整组变下拉：组本身退化为一个下拉按钮（label = 组名，条目进 popover）
  return {
    ...group,
    scaled: 'dropdown',
    children: (group.children ?? []).map((child) => ({ ...child, inDropdown: true })),
  }
}

/**
 * 逐组降级规划（ScalingPolicy）：容器宽度不足时，从最宽的开始降档，
 * 直到放得下或全部到最小档（官方：几乎每个组都声明到最小尺寸档，任意宽度可渲染）。
 *
 * @param {Array<{ key: string, width: number }>} groups 各组实测宽（含组间距前的自身宽）
 * @param {number} available 容器可用宽
 * @param {{ gap?: number, moreWidth?: number }} [options]
 * @returns {{ tiers: Record<string, 0|1|2>, overflow: string[], fits: boolean }}
 */
export function planGroupScaleTiers(groups, available, options = {}) {
  const gap = Number.isFinite(options.gap) ? Math.max(0, options.gap) : 0
  const tiers = {}
  for (const g of groups) tiers[g.key] = RIBBON_SCALE_TIERS.FULL

  /** 当前档位下该组的估算宽：FULL=实测；SMALL≈条目数×小钮+gaps；DROPDOWN=一个标签钮 */
  const widthAt = (g, tier) => {
    if (tier === RIBBON_SCALE_TIERS.FULL) return Math.max(0, g.width)
    if (tier === RIBBON_SCALE_TIERS.SMALL) {
      const items = g.items ?? 1
      const small = g.smallWidth ?? Math.round(g.width / Math.max(1, items))
      return items * small + gap * Math.max(0, items - 1)
    }
    return g.dropdownWidth ?? 96
  }

  // 只统计仍在工具区里的组（被收进「更多」的组从 tierMap 删除，不占宽也不占 gap）
  const totalWidth = (tierMap) => {
    let sum = 0
    let present = 0
    for (const g of groups) {
      const tier = tierMap[g.key]
      if (tier === undefined) continue
      sum += widthAt(g, tier)
      present++
    }
    sum += gap * Math.max(0, present - 1)
    return sum
  }

  let tierMap = { ...tiers }
  let overflow = []
  // 逐轮：把当前最宽的未到最小档的组降一档
  while (totalWidth(tierMap) > available) {
    let target = null
    for (const g of groups) {
      if (tierMap[g.key] >= RIBBON_SCALE_TIERS.GROUP_DROPDOWN) continue
      if (!target || widthAt(g, tierMap[g.key]) > widthAt(target, tierMap[target.key])) target = g
    }
    if (!target) break // 全部已到最小档仍放不下 → 进溢出
    tierMap[target.key] = tierMap[target.key] + 1
  }

  if (totalWidth(tierMap) > available) {
    // 全部最小档还放不下：从最宽的组开始贪心收进「更多」，直到放得下或无可再收。
    // 收过至少一组后「更多」入口必然占位，故判定式统一带上它（更诚实，也避免
    // "收一组刚好放得下但入口自己又把行撑爆"的假阳性）。
    const sorted = [...groups].sort((a, b) => widthAt(b, 2) - widthAt(a, 2))
    overflow = []
    const more = options.moreWidth ?? 0
    const withMore = () => totalWidth(tierMap) + (overflow.length ? more + gap : 0)
    for (const g of sorted) {
      if (withMore() <= available) break
      delete tierMap[g.key]
      overflow.push(g.key)
    }
    return { tiers: tierMap, overflow, fits: withMore() <= available }
  }

  return { tiers: tierMap, overflow, fits: true }
}

/**
 * 上下文 tab 规划（声明式唤出）
 * @param {Array<{ id: string, when: (ctx: object) => boolean }>} contextTabs
 * @param {string|null} currentActive
 * @param {object} ctx 选区/焦点上下文
 * @returns {{ active: string|null, visible: string[], closed: string[] }}
 */
export function planContextTabs(contextTabs, currentActive, ctx = {}) {
  const visible = []
  const closed = []
  for (const tab of contextTabs ?? []) {
    if (tab.when ? !!tab.when(ctx) : true) visible.push(tab.id)
    else closed.push(tab.id)
  }
  // 当前激活的上下文 tab 不再可见 → 退回 null（由消费方决定落到哪个常驻 tab）
  const active = currentActive && visible.includes(currentActive) ? currentActive : null
  return { active, visible, closed }
}

/**
 * 持久化（localStorage）：异常静默降级（06 §四：读写 <1ms，坏数据不白屏）
 * @param {{ getItem: Function, setItem: Function }} storage
 */
export function loadCollapsed(storage, key) {
  try {
    return storage.getItem(key) === '1'
  } catch {
    return false
  }
}

export function saveCollapsed(storage, key, collapsed) {
  try {
    storage.setItem(key, collapsed ? '1' : '0')
    return true
  } catch {
    return false
  }
}
