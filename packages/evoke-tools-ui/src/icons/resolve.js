/**
 * 图标名解析与兜底（tools-ui 计划 04 §四：缺失兜底，硬要求）
 *
 * 上一代实测缺陷：表格功能区「插入列 / 删除列」渲染为 38×24 纯白方块 ——
 * EbIcon 对未命中名静默渲染空 <i>，缺陷无告警。本代规定：
 *   1. 未命中禁渲染空白：回落到显式兜底图标 + console.warn（仅 dev）；
 *   2. 同步未命中时先走 business-ui 注册表的异步自愈（加载全量库再重试），
 *      仍不命中才兜底 —— 顺序反了会把"只在全量库里的图标"误判为悬空名。
 *
 * 本文件只放**纯函数**（可单测，不依赖 vue / 注册表），组件接线见 icon.vue。
 */
import { getDomainAlias } from './aliases'

/** 显式兜底图标：builtin 集内最近似 question 的语义名（business-ui 441 内置集无裸 question/square） */
export const FALLBACK_ICON_NAME = 'question-circle'

/** custom: 前缀（消费方运行时注册的自定义图标）直通注册表，不做别名与兜底判定 */
export function isCustomIconName(name) {
  return typeof name === 'string' && name.startsWith('custom:')
}

/**
 * 领域名 → 组件语义名（③ → ②）
 * @param {string} name 模板/命令表里写的图标名
 * @returns {string} 解析后的语义名（无别名时原样返回）
 */
export function resolveIconName(name) {
  if (!name || typeof name !== 'string') return name
  if (isCustomIconName(name)) return name
  return getDomainAlias(name) ?? name
}

/**
 * 悬空名判定（构建期 G2 门用）：既不在组件语义集、也不是 custom: 直通名
 * @param {string} name
 * @param {{ hasName: (n: string) => boolean }} registry 名字存在性判定器
 * @returns {boolean} true = 悬空（门禁红）
 */
export function isDanglingIconName(name, registry) {
  if (!name || typeof name !== 'string') return false
  if (isCustomIconName(name)) return false
  return !registry.hasName(resolveIconName(name))
}

/**
 * 图标名全量校验（构建期 G2 门入口）
 * @param {Iterable<string>} names 从模板/命令表提取的候选名
 * @param {{ hasName: (n: string) => boolean }} registry
 * @returns {string[]} 悬空名清单（空数组 = 通过）
 */
export function findDanglingIconNames(names, registry) {
  const dangling = []
  for (const name of names) {
    if (isDanglingIconName(name, registry)) dangling.push(name)
  }
  return [...new Set(dangling)]
}

/**
 * 兜底选择（运行期）：解析不到时返回的显式兜底名
 * 只对语义名兜底；custom: 未注册时同样兜底（用户看到的是显式问号，不是白块）
 */
export function pickFallbackIconName(name) {
  if (isCustomIconName(name)) return FALLBACK_ICON_NAME
  return FALLBACK_ICON_NAME
}
