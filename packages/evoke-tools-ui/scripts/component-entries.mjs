/**
 * 组件入口清单解析（tools-ui 版）
 *
 * 复用 business-ui 的参数化解析器（前缀 Et + 本包 src/index.js，tools-ui 计划
 * 02 §五：抽成带参数的解析器，business-ui 行为不变）。本文件只做两件事：
 * 把默认源指向本包 index.js，并对外保持与底座一致的调用面。
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getComponentEntries } from '../../evoke-business-ui/scripts/component-entries.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const PKG_ROOT = resolve(__dirname, '..')

/**
 * 解析本包 src/index.js 的组件 / 命令式 API 入口表
 * @param {string} [source] index.js 源码（缺省读本包 src/index.js）
 * @returns {Array<{ exportName: string, name: string, file: string }>}
 */
export function getEtComponentEntries(source = readFileSync(resolve(PKG_ROOT, 'src/index.js'), 'utf8')) {
  return getComponentEntries(source, { prefix: 'Et', pkgRoot: PKG_ROOT })
}
