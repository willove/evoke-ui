/** 运行时统一出口（L0 契约，tools-ui 计划 05）
 *  M0 交付：键位表（解析/平台符号化/事件匹配）+ 焦点漫游基座（roving tabindex） */
export {
  normalizeCombo,
  formatCombo,
  comboFromEvent,
  comboMatchesEvent,
  isKnownKeyToken,
  keySymbols,
  currentPlatform,
} from './keys/keys'
export { nextRovingIndex, rovingTabindex, useRovingTabindex } from './focus/roving'
