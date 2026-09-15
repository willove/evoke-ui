/**
 * 组件入口清单解析 — vite 多入口构建与类型存根共用（单一事实源 = src/index.js 的组件导入）
 *
 * 子路径命名规则：Ev 前缀去除后 PascalCase → kebab-case，
 * 如 EvIconButton → icon-button、EvAvatarGroup → avatar-group。
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
 * 解析 index.js 中的组件导入表
 * @returns {Array<{ exportName: string, name: string, file: string }>}
 *   exportName 如 "EvIconButton"；name 为子路径名 "icon-button"；file 为 src 下相对路径
 */
export function getComponentEntries(source = readFileSync(SRC_INDEX, 'utf8')) {
  const re = /^import (Ev\w+) from '\.\/(components\/[^']+\.vue)'$/gm
  const seen = new Map()
  for (const m of source.matchAll(re)) {
    const exportName = m[1]
    const name = toKebab(exportName.slice(2))
    if (seen.has(name)) throw new Error(`[component-entries] 子路径名冲突: ${name}`)
    seen.set(name, { exportName, name, file: m[2] })
  }
  if (seen.size === 0) throw new Error('[component-entries] index.js 未解析到任何组件导入')
  return [...seen.values()]
}
