/**
 * 组件入口清单解析 — vite 多入口构建与类型存根共用（单一事实源 = src/index.js）
 *
 * 识别两种导入形态：
 *   1. import EbButton from './components/button/index.vue'   （SFC，含子件 group/item 等）
 *   2. import { EbMessage } from './components/message'       （命令式 API 目录桶，单具名绑定）
 *
 * 子路径命名规则：组件前缀去除后 PascalCase → kebab-case，
 * 如 EbInputNumber → input-number、EbDropdownMenu → dropdown-menu。
 *
 * 解析器按参数通用化（本库默认 Eb / 自身 src/index.js，行为与参数化前完全一致）：
 * 姐妹库（如 evoke-tools-ui，前缀 Et）以 { prefix: 'Et', pkgRoot } 复用同一实现，
 * 避免四库各写一份解析逻辑后规则漂移（tools-ui 计划 02 §五）。
 */
import { readFileSync, existsSync } from 'node:fs'
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
 * @param {string} [source] index.js 源码（缺省读本库 src/index.js）
 * @param {{ prefix?: string, pkgRoot?: string }} [options]
 *   prefix 组件名前缀（'Eb' / 'Et'…）；pkgRoot 包根（决定目录桶 index.ts/index.js 探测位置）
 * @returns {Array<{ exportName: string, name: string, file: string }>}
 *   exportName 如 "EbInputNumber"；name 为子路径名 "input-number"；file 为 src 下相对路径
 */
export function getComponentEntries(source = readFileSync(SRC_INDEX, 'utf8'), options = {}) {
  const { prefix = 'Eb', pkgRoot: root = pkgRoot } = options
  const strip = prefix.length
  const seen = new Map()
  const add = (exportName, file) => {
    const name = toKebab(exportName.slice(strip))
    if (seen.has(name)) throw new Error(`[component-entries] 子路径名冲突: ${name}`)
    seen.set(name, { exportName, name, file })
  }

  const sfcRe = new RegExp(`^import (${prefix}\\w+) from '\\./(components/[^']+\\.vue)'$`, 'gm')
  for (const m of source.matchAll(sfcRe)) {
    add(m[1], m[2])
  }
  // 命令式 API 目录桶（无扩展名）：取绑定中的本前缀名（可为多绑定，如
  // `import { EbLoading, createLoadingDirective } from './components/loading'`）
  const bucketRe = new RegExp(`^import \\{ ([^}]+) \\} from '\\./(components/[a-z0-9-]+)'$`, 'gm')
  for (const m of source.matchAll(bucketRe)) {
    const prefixedNames = m[1]
      .split(',')
      .map((s) => s.trim())
      .filter((s) => new RegExp(`^${prefix}[A-Z]`).test(s))
    if (prefixedNames.length === 1) {
      // 目录桶实现可能已迁 TS（index.ts），仍兼容残留 index.js
      const entryFile = existsSync(resolve(root, 'src', m[2], 'index.ts'))
        ? `${m[2]}/index.ts`
        : `${m[2]}/index.js`
      add(prefixedNames[0], entryFile)
    }
  }

  if (seen.size === 0) throw new Error('[component-entries] index.js 未解析到任何组件导入')
  return [...seen.values()]
}
