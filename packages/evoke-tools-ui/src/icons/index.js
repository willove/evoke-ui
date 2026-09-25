/**
 * 图标机制统一出口（tools-ui 计划 04）
 * - EtIcon：解析与兜底载体（内部件）
 * - registerDomainIcons / clearDomainIcons：领域别名注册 API（③ 层，形态包用）
 * - FALLBACK_ICON_NAME / resolveIconName / findDanglingIconNames：纯函数（G2 门与单测用）
 */
export { default as EtIcon } from './icon.vue'
export {
  registerDomainIcons,
  getDomainAlias,
  hasDomainAlias,
  clearDomainIcons,
  listDomainAliases,
} from './aliases'
export {
  FALLBACK_ICON_NAME,
  resolveIconName,
  isCustomIconName,
  isDanglingIconName,
  findDanglingIconNames,
  pickFallbackIconName,
} from './resolve'
