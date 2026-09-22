/**
 * 对话家族语言包入口
 *
 * 语言名与底座语言包同口径（`zhCN.name === 'zh-cn'`），因此切换语言这件事
 * 只有底座说了算（EbConfigProvider 的 locale，或全局默认）；本包按名字取自己的译文。
 * 没译文的语言不在表里 —— 调用方停在基准包 zh-CN，不出现裸键。
 */
import zhCN from './zh-CN'
import en from './en'

export const chatLocalePacks = {
  'zh-cn': zhCN,
  en,
}

/** 按语言名取包；未收录返回 null（调用方回退基准包） */
export function getChatLocalePack(name) {
  if (!name) return null
  return chatLocalePacks[String(name).toLowerCase()] || null
}

export { zhCN, en }
