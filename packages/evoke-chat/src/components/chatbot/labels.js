/**
 * Chatbot 家族文案
 *
 * 文案住在本包的语言包里（`src/locale/zh-CN.js` 与 `en.js`），不再是底座
 * 语言包的一个命名空间。**语言名由底座决定**：组件经 useLocale() 读
 * EbConfigProvider 的 locale（或全局默认），拿到 `name`（'zh-cn' / 'en' …）
 * 后在本包语言表里取译文；没译文的语言停在基准包 zh-CN。
 *
 * 两种取法：
 * - `useChatLabels()`：组件里用。返回响应式对象，`labels.actionbar.copy` 在模板
 *   与脚本里写法一致，切语言即更新。
 * - `chatLabels`：拿不到 inject 的纯模块用（chatMarkdown / sandboxBootstrap 等）。
 *   它是基准包 zh-CN 的静态引用；需要本地化的渲染器请由组件把 labels 传进去。
 */
import { reactive, watchEffect } from 'vue'
import { useLocale } from '@wil-works/evoke-business-ui'
import { zhCN, getChatLocalePack } from '../../locale'

/** 基准文案：语言包缺整包或某键缺失时兜底 */
const FALLBACK = zhCN

/** 非组件环境的静态引用（永远是基准语言） */
export const chatLabels = FALLBACK

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

/** 逐键覆盖：对象递归合并，字符串/函数/数组整体替换 */
function mergeInto(target, source) {
  if (!isPlainObject(source)) return
  for (const [key, value] of Object.entries(source)) {
    if (isPlainObject(value) && isPlainObject(target[key])) {
      mergeInto(target[key], value)
    } else if (value !== undefined) {
      target[key] = value
    }
  }
}

function buildTree(source) {
  const out = {}
  for (const [key, value] of Object.entries(source)) {
    out[key] = isPlainObject(value) ? buildTree(value) : value
  }
  return out
}

export function useChatLabels() {
  const { locale } = useLocale()
  const labels = reactive(buildTree(FALLBACK))
  watchEffect(() => {
    // 先铺基准再覆盖译文：不先铺的话，切语言后上一语言的译文会残留在缺键处
    mergeInto(labels, FALLBACK)
    mergeInto(labels, getChatLocalePack(locale.value?.name))
  })
  return labels
}
