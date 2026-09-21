import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * chatbot 家族文档覆盖守卫
 *
 * 这族的组件长期是「导出面有、文档里查不到」——宿主根本不知道它们存在。
 * 守卫口径：凡是从 components/chatbot/ 导出的组件，名字必须出现在文档树里
 * （独立页或「对话子组件」页的条目都算）。
 *
 * 只圈这一族，不追求全包：其余包内组件的子件（EbFormItem / EbOption /
 * EbTabPane 这类）由父组件页面承载，按名字逐个要求会产生大量噪音。
 */

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(here, '..')
const repoRoot = resolve(pkgRoot, '../..')

function exportedChatbotComponents() {
  const index = readFileSync(join(pkgRoot, 'src/index.js'), 'utf8')
  const hits = [...index.matchAll(/import (Eb[A-Za-z0-9]+) from '\.\/components\/chatbot\//g)]
  return [...new Set(hits.map((m) => m[1]))]
}

function docsText() {
  const docsRoot = join(repoRoot, 'docs')
  expect(existsSync(docsRoot), 'docs 目录不存在').toBe(true)
  const out = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!/node_modules|\.vitepress|dist/.test(p)) walk(p)
      } else if (entry.name.endsWith('.md')) {
        out.push(readFileSync(p, 'utf8'))
      }
    }
  }
  walk(docsRoot)
  return out.join('\n')
}

describe('chatbot 家族文档覆盖', () => {
  const names = exportedChatbotComponents()

  it('导出面本身不为空（守卫前提）', () => {
    expect(names.length).toBeGreaterThan(10)
  })

  it('每个导出组件都在文档里出现', () => {
    const text = docsText()
    const missing = names.filter((n) => !text.includes(n))
    expect(missing, `未在文档中出现的导出组件: ${missing.join(', ')}`).toEqual([])
  })
})
