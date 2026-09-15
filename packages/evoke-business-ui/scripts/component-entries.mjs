/**
 * 组件入口清单解析 — vite 多入口构建与类型存根共用（单一事实源 = src/index.js）
 *
 * 识别两种导入形态：
 *   1. import EbButton from './components/button/index.vue'   （SFC，含子件 group/item 等）
 *   2. import { EbMessage } from './components/message'       （命令式 API 目录桶，单具名绑定）
 *
 * 子路径命名规则：Eb 前缀去除后 PascalCase → kebab-case，
 * 如 EbInputNumber → input-number、EbDropdownMenu → dropdown-menu。
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')
const SRC_INDEX = resolve(pkgRoot, 'src/index.js')

/** 包根绝对路径（vitest jsdom 下测试文件自身的 import.meta.url 非 file 协议，统一从这里取） */
export const PKG_ROOT = pkgRoot

/** PascalCase → kebab-case */
export function toKebab(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * 解析 index.js 中的组件 / 命令式 API 入口表
 * @returns {Array<{ exportName: string, name: string, file: string }>}
 *   exportName 如 "EbInputNumber"；name 为子路径名 "input-number"；file 为 src 下相对路径
 */
export function getComponentEntries(source = readFileSync(SRC_INDEX, 'utf8')) {
  const seen = new Map()
  const add = (exportName, file) => {
    const name = toKebab(exportName.slice(2))
    if (seen.has(name)) throw new Error(`[component-entries] 子路径名冲突: ${name}`)
    seen.set(name, { exportName, name, file })
  }

  for (const m of source.matchAll(/^import (Eb\w+) from '\.\/(components\/[^']+\.vue)'$/gm)) {
    add(m[1], m[2])
  }
  // 命令式 API 目录桶（无扩展名）：取绑定中的 Eb* 名（可为多绑定，如
  // `import { EbLoading, createLoadingDirective } from './components/loading'`）
  for (const m of source.matchAll(/^import \{ ([^}]+) \} from '\.\/(components\/[a-z0-9-]+)'$/gm)) {
    const ebNames = m[1].split(',').map((s) => s.trim()).filter((s) => /^Eb[A-Z]/.test(s))
    if (ebNames.length === 1) add(ebNames[0], `${m[2]}/index.js`)
  }

  if (seen.size === 0) throw new Error('[component-entries] index.js 未解析到任何组件导入')
  return [...seen.values()]
}
