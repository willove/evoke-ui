import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * 对话家族文档覆盖守卫（随包走：本包导出面 ↔ 文档站 components 树）
 *
 * 这族的组件长期是「导出面有、文档里查不到」——宿主根本不知道它们存在。
 * 守卫口径：凡是从 src/index.js 导出的组件，名字必须出现在文档树里
 * （独立页或「对话子组件」页的条目都算）。
 *
 * 只圈本包导出面，不追求全站：其它包的子件（EbFormItem / EbOption /
 * EbTabPane 这类）由父组件页面承载，按名字逐个要求会产生大量噪音。
 */

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(here, '..')
const repoRoot = resolve(pkgRoot, '../..')

function exportedComponents() {
  const index = readFileSync(join(pkgRoot, 'src/index.js'), 'utf8')
  const hits = [...index.matchAll(/import (Eb[A-Za-z0-9]+) from ["']\.\/components\/[a-z-]+\/[A-Za-z0-9]+\.vue["']/g)]
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

describe('对话家族文档覆盖', () => {
  const names = exportedComponents()

  it('导出面本身不为空（守卫前提）', () => {
    expect(names.length).toBeGreaterThan(10)
  })

  it('每个导出组件都在文档里出现', () => {
    const text = docsText()
    const missing = names.filter((n) => !text.includes(n))
    expect(missing, `未在文档中出现的导出组件: ${missing.join(', ')}`).toEqual([])
  })
})

/**
 * 旧路径重定向桩：对话文档 2026-09-22 从组件侧栏迁到 /chat 分区，
 * 站外可能留着老链接。桩页不能当死文件清掉，目标也不能漂。
 */
const LEGACY_PATHS = [
  'chatbot',
  'chat-subcomponents',
  'chat-agent',
  'chat-threads',
  'chat-widget',
  'ai-console',
  'ai-prompt-box',
]

describe('旧路径重定向桩', () => {
  for (const slug of LEGACY_PATHS) {
    it(`/components/${slug} → /chat/${slug}`, () => {
      const p = join(repoRoot, 'docs', 'components', `${slug}.md`)
      expect(existsSync(p), `缺少重定向桩 ${p}`).toBe(true)
      const src = readFileSync(p, 'utf8')
      expect(src, '缺少 meta refresh').toContain(`content: 0; url=/chat/${slug}`)
      expect(src, '桩页应标 noindex').toContain('noindex')
      expect(src, '缺少不能自动跳转时的兜底链接').toContain(`](/chat/${slug})`)
    })
  }
})
