/**
 * 键位表构建与冲突检测（tools-ui 计划 M1 交付物 6）
 *
 * 单一来源 = 命令注册表（命令表声明 keys）+ runtime/keys 的平台符号化。
 * 冲突检测在登记后做一次：同一组合键绑两条命令 = 必现 Bug，注册表期就红。
 */
import { formatCombo, normalizeCombo } from '../keys/keys'

/**
 * 从注册表构建键位表（按域分组）
 * @param {{ list: () => Array<object> }} registry
 * @param {'mac'|'win'} [platform]
 * @returns {Array<{ group: string, items: Array<{ id: string, title: string, combo: string, display: string }> }>}
 */
export function buildShortcutTable(registry, platform = 'win') {
  const groups = new Map()
  for (const cmd of registry.list()) {
    if (!cmd.keys) continue
    const group = cmd.group ?? cmd.surfaces?.[0] ?? '通用'
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group).push({
      id: cmd.id,
      title: cmd.title ?? cmd.id,
      combo: cmd.keys,
      display: formatCombo(cmd.keys, platform),
    })
  }
  return [...groups.entries()].map(([group, items]) => ({ group, items }))
}

/**
 * 冲突检测（登记期判定，不在用户手里随机触发）
 * @param {{ list: () => Array<object> }} registry
 * @returns {Array<{ combo: string, ids: string[] }>} 空数组 = 无冲突
 */
export function detectKeyConflicts(registry) {
  const byCombo = new Map()
  for (const cmd of registry.list()) {
    if (!cmd.keys) continue
    const combo = normalizeCombo(cmd.keys)
    if (!byCombo.has(combo)) byCombo.set(combo, [])
    byCombo.get(combo).push(cmd.id)
  }
  const conflicts = []
  for (const [combo, ids] of byCombo) {
    if (ids.length > 1) conflicts.push({ combo, ids })
  }
  return conflicts
}

/** 按快捷键找命令（键位绑定的运行时匹配入口） */
export function findCommandByCombo(registry, combo) {
  const target = normalizeCombo(combo)
  for (const cmd of registry.list()) {
    if (cmd.keys && normalizeCombo(cmd.keys) === target) return cmd
  }
  return null
}
