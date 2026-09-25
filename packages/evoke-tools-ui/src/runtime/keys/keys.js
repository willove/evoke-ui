/**
 * 键位表与助记键（tools-ui 计划 05 L0 · M0 交付物）
 *
 * 纯函数：解析 / 规范化 / 平台符号化 / 事件匹配。
 * 数据形态对齐 Univer 的 ICommand.shortcut 写法（`mod+shift+z` 字符串），
 * 不引入 RxJS；状态流由 Vue 的 ref/computed 表达。
 *
 * 平台识别：mod 在 macOS 是 ⌘，在 Windows/Linux 是 Ctrl（不是把 Ctrl 印成 ⌘）。
 */

const MAC_SYMBOLS = {
  mod: '⌘',
  ctrl: '⌃',
  alt: '⌥',
  shift: '⇧',
  enter: '↩',
  esc: 'esc',
  tab: '⇥',
  space: 'Space',
  backspace: '⌫',
  delete: '⌦',
  insert: 'ins',
  home: '↖',
  end: '↘',
  pageup: '⇞',
  pagedown: '⇟',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  plus: '+',
  minus: '–',
}

const WIN_SYMBOLS = {
  mod: 'Ctrl',
  ctrl: 'Ctrl',
  alt: 'Alt',
  shift: 'Shift',
  enter: 'Enter',
  esc: 'Esc',
  tab: 'Tab',
  space: 'Space',
  backspace: 'Backspace',
  delete: 'Del',
  insert: 'Ins',
  home: 'Home',
  end: 'End',
  pageup: 'PgUp',
  pagedown: 'PgDn',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  plus: '+',
  minus: '–',
}

/** 修饰键同义词 → 规范名 */
const MODIFIER_SYNONYMS = {
  cmd: 'mod',
  command: 'mod',
  meta: 'mod',
  super: 'mod',
  win: 'mod',
  opt: 'alt',
  option: 'alt',
  ctrlkey: 'ctrl',
  control: 'ctrl',
  escape: 'esc',
  return: 'enter',
  del: 'delete',
  spacebar: 'space',
  pluskey: 'plus',
}

const MODIFIERS = ['mod', 'ctrl', 'alt', 'shift']

const NAMED_KEYS = new Set([
  'enter', 'esc', 'tab', 'space', 'backspace', 'delete', 'insert',
  'home', 'end', 'pageup', 'pagedown',
  'up', 'down', 'left', 'right',
  'plus', 'minus', 'comma', 'period', 'slash', 'backslash', 'bracketleft', 'bracketright',
])

/** 合法单键：a-z / 0-9 / f1-f12 */
function isSingleKeyToken(token) {
  if (/^[a-z]$/.test(token)) return true
  if (/^[0-9]$/.test(token)) return true
  const fn = /^f([1-9]|1[0-2])$/.exec(token)
  return !!fn
}

export function isKnownKeyToken(token) {
  if (MODIFIERS.includes(token)) return true
  if (NAMED_KEYS.has(token)) return true
  return isSingleKeyToken(token)
}

/**
 * 规范化组合键串：`Cmd+Shift+Z` → `mod+shift+z`
 * 未知键名直接抛错 —— 拼写错误要在登记期炸，不要静默失效在用户手里。
 * @param {string} combo
 * @returns {string} 规范串（修饰键按 mod/ctrl/alt/shift 定序，单键在末尾）
 */
export function normalizeCombo(combo) {
  if (typeof combo !== 'string' || !combo.trim()) {
    throw new TypeError('[normalizeCombo] 组合键不能为空')
  }
  const tokens = combo
    .split(/[+\-\s]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .map((t) => MODIFIER_SYNONYMS[t] ?? t)
  for (const t of tokens) {
    if (!isKnownKeyToken(t)) {
      throw new RangeError(`[normalizeCombo] 未知键名「${t}」（来自 ${combo}）`)
    }
  }
  const mods = MODIFIERS.filter((m) => tokens.includes(m))
  const main = tokens.filter((t) => !MODIFIERS.includes(t))
  if (main.length !== 1) {
    throw new RangeError(`[normalizeCombo] 需要一个主键，得到 ${main.length} 个（来自 ${combo}）`)
  }
  return [...mods, main[0]].join('+')
}

/** 平台符号表 */
export function keySymbols(platform) {
  return platform === 'mac' ? MAC_SYMBOLS : WIN_SYMBOLS
}

/**
 * 平台符号化展示：`mod+shift+z` → macOS「⌘⇧Z」/ Windows「Ctrl+Shift+Z」
 * @param {string} combo 已规范化的组合键
 * @param {'mac'|'win'} platform
 * @returns {string}
 */
export function formatCombo(combo, platform = 'win') {
  const symbols = keySymbols(platform)
  const tokens = normalizeCombo(combo).split('+')
  const parts = tokens.map((t) => symbols[t] ?? t.toUpperCase())
  return platform === 'mac' ? parts.join('') : parts.join('+')
}

/** 从 KeyboardEvent 提取规范组合键（用于运行时匹配与自定义键位） */
export function comboFromEvent(event) {
  const key = event.key
  let main
  if (key === ' ') main = 'space'
  else if (key.length === 1) main = key.toLowerCase()
  else main = MODIFIER_SYNONYMS[key.toLowerCase()] ?? key.toLowerCase()
  if (!isKnownKeyToken(main)) return null
  const mods = []
  if (event.metaKey) mods.push('mod')
  if (event.ctrlKey) mods.push('ctrl')
  if (event.altKey) mods.push('alt')
  if (event.shiftKey) mods.push('shift')
  const uniqueMods = MODIFIERS.filter((m) => mods.includes(m))
  return [...uniqueMods, main].join('+')
}

/**
 * 事件是否命中某组合键
 *
 * 平台语义：mod 在 mac 映射到 metaKey、在 win 映射到 ctrlKey。判据 = 物理修饰键集合
 * 完全相等（多按一个都不算命中），主键逐一对应。
 * @param {string} combo 已规范化的组合键
 * @param {KeyboardEvent} event
 * @param {'mac'|'win'} [platform] 平台决定 mod 的物理落点
 */
export function comboMatchesEvent(combo, event, platform = 'win') {
  const tokens = normalizeCombo(combo).split('+')
  const main = tokens[tokens.length - 1]
  const wantMods = tokens.slice(0, -1)
  const got = comboFromEvent(event)
  if (!got) return false
  const gotTokens = got.split('+')
  if (gotTokens[gotTokens.length - 1] !== main) return false

  const modIsMeta = platform === 'mac'
  const wantPhysical = new Set(
    wantMods.map((m) => (m === 'mod' ? (modIsMeta ? 'meta' : 'ctrl') : m)),
  )
  const actualPhysical = new Set()
  if (event.metaKey) actualPhysical.add('meta')
  if (event.ctrlKey) actualPhysical.add('ctrl')
  if (event.altKey) actualPhysical.add('alt')
  if (event.shiftKey) actualPhysical.add('shift')
  if (wantPhysical.size !== actualPhysical.size) return false
  for (const m of wantPhysical) {
    if (!actualPhysical.has(m)) return false
  }
  return true
}

/** 当前平台（'mac' | 'win'）——浏览器环境判定一次，非浏览器按 win */
export function currentPlatform() {
  if (typeof navigator === 'undefined') return 'win'
  const ua = navigator.userAgent || ''
  const platform = navigator.userAgentData?.platform || navigator.platform || ''
  return /Mac|iPhone|iPad/i.test(`${ua} ${platform}`) ? 'mac' : 'win'
}
