/**
 * demo-source 插件（移植自 guide_docs，见该处实现说明）
 *
 * 把 <DemoBlock> ...demo... </DemoBlock> 的内部源码转义后注入 code 属性，
 * 文档页只需写一遍演示代码。主路径 html_block，html_inline 兜底。
 */
const DEMO_BLOCK_RE = /^<DemoBlock(\s[^>]*)?>([\s\S]*?)<\/DemoBlock>[ \t]*$/
const HAS_CODE_ATTR = /^<DemoBlock[^>]*\scode\s*=/

function escapeAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

function injectCode(raw) {
  const m = raw.match(DEMO_BLOCK_RE)
  if (!m) return raw
  const [, attrs = '', inner] = m
  if (/\scode\s*=/.test(attrs)) return raw
  const source = inner.replace(/^\n/, '').replace(/\s+$/, '')
  return `<DemoBlock code="${escapeAttr(source)}"${attrs}>${inner}</DemoBlock>`
}

export function demoSourcePlugin(md) {
  md.core.ruler.push('demo_source', (state) => {
    for (const t of state.tokens) {
      if (t.type === 'html_block' && t.content.includes('<DemoBlock')) {
        t.content = t.content.replace(
          /<DemoBlock(\s[^>]*)?>[\s\S]*?<\/DemoBlock>/g,
          (raw) => injectCode(raw),
        )
      }
    }

    // 兜底：demo 内含空行被拆段的情况
    let openToken = null
    let parts = []
    const finish = () => {
      const source = parts.join('').replace(/\n{3,}/g, '\n\n').trim()
      if (openToken && !HAS_CODE_ATTR.test(openToken.content)) {
        openToken.content = openToken.content.replace(
          /^<DemoBlock/,
          `<DemoBlock code="${escapeAttr(source)}"`,
        )
      }
      openToken = null
    }
    const visit = (tokens) => {
      for (const t of tokens) {
        if (t.type === 'html_inline') {
          const c = t.content.trim()
          if (!openToken && c === '<DemoBlock>') {
            openToken = t
            parts = []
            continue
          }
          if (openToken && c === '</DemoBlock>') {
            finish()
            continue
          }
          if (openToken) parts.push(t.content)
        } else if (t.type === 'text') {
          if (openToken) parts.push(t.content)
        } else if (t.type === 'softbreak' || t.type === 'hardbreak') {
          if (openToken) parts.push('\n')
        } else if (t.children) {
          visit(t.children)
        } else if (openToken && (t.type === 'paragraph_open' || t.type === 'paragraph_close')) {
          parts.push('\n')
        }
      }
    }
    visit(state.tokens)
    if (openToken) finish()
    return true
  })
}
