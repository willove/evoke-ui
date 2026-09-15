/**
 * Locale 入口
 */
export { zhCN } from './zh-CN'
export { en } from './en'
export { ja } from './ja'
export { zhTW } from './zh-TW'
export { ko } from './ko'
export { es } from './es'
export { pt } from './pt'

/**
 * @param {string} name
 * @param {Object} lang 语言包
 */
export function useLocaleEntry(name, lang) {
  const languages = { [name]: lang }
  return {
    lang: (n) => languages[n] ?? languages[name],
  }
}
