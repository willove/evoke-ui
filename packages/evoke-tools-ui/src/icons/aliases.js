/**
 * 领域别名层（图标三层命名的第 ③ 层）
 *
 * 第 ① 层 Remix 原生名只出现在 business-ui 的生成脚本里；
 * 第 ② 层组件语义名由 business-ui 的 MAPPING 维护（工具通用语义：search / more / bold…）；
 * 第 ③ 层领域语义名（cell-bold / merge-cells / freeze-panes…）由**产品形态包**声明，
 * 经本 API 在装配时注册进注册表 —— 这是 business-ui MAPPING 的运行时扩展版，
 * 不是新机制（tools-ui 计划 04 §二）。
 *
 * 纪律：领域别名表是单一来源，放形态包（如 office-works 的 sheets-ui/src/icons.ts），
 * 禁止在模板里散落字符串；工具框架只认第 ② 层。
 */

const domainAliases = new Map()

/**
 * 登记领域别名表（{ 领域名: 组件语义名 }）
 * 同名重复登记以最后一次为准（装配热更新 / 多形态包并存时后者覆盖前者）。
 * @param {Record<string, string>} map
 */
export function registerDomainIcons(map) {
  if (!map || typeof map !== 'object') {
    throw new TypeError('[registerDomainIcons] 需要 { 领域名: 组件语义名 } 形式的对象')
  }
  for (const [domainName, semanticName] of Object.entries(map)) {
    if (typeof domainName !== 'string' || typeof semanticName !== 'string') {
      throw new TypeError('[registerDomainIcons] 键与值都必须是字符串')
    }
    domainAliases.set(domainName, semanticName)
  }
  return domainAliases.size
}

/** 查询领域别名解析结果（未登记返回 null） */
export function getDomainAlias(name) {
  return domainAliases.get(name) ?? null
}

/** 是否已登记该领域名 */
export function hasDomainAlias(name) {
  return domainAliases.has(name)
}

/** 清空全部领域别名（测试与形态包卸载用） */
export function clearDomainIcons() {
  domainAliases.clear()
}

/** 当前别名表快照（文档站与调试用） */
export function listDomainAliases() {
  return Object.fromEntries(domainAliases)
}
