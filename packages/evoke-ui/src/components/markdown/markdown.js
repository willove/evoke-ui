/**
 * EwMarkdown 内置轻量 Markdown 解析器 — 零依赖
 *
 * 块级：标题(#{1,6}) / 段落 / 无序·有序列表（缩进嵌套）/ 引用（递归）/
 *       分隔线 / 围栏代码块（复用 EwCodeBlock 高亮分词器）/ GFM 表格（含对齐）
 * 行内：加粗 / 斜体 / 删除线 / 行内代码 / 链接 / 图片
 *
 * 安全模型：原文全量 HTML 转义后再包裹自有标签，链接与图片地址仅放行
 * http(s) / mailto / 相对路径 / 锚点，产物可安全用于 v-html
 */
import { highlightCode } from '../code-block/highlight'

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// 仅放行安全协议与相对地址，阻断 javascript: 等注入向量
function safeUrl(u) {
  const t = u.trim()
  if (/^(https?:|mailto:|\/|#|\.\/|\.\.\/?)/i.test(t)) return t
  return '#'
}

/** 行内解析：转义 → 行内代码占位 → 图片 → 链接 → 强调 → 恢复代码 */
function renderInline(text) {
  let s = escapeHtml(text)
  const codes = []
  s = s.replace(/`([^`]+)`/g, (_m, c) => {
    codes.push(`<code class="ew-md__code-inline">${c}</code>`)
    return `\u0000${codes.length - 1}\u0000`
  })
  s = s.replace(
    /!\[([^\]]*)\]\(([^)\s]+)\)/g,
    (_m, alt, src) => `<img class="ew-md__img" src="${safeUrl(src)}" alt="${alt}" />`,
  )
  s = s.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_m, label, href) =>
      `<a class="ew-md__link" href="${safeUrl(href)}" target="_blank" rel="noopener">${label}</a>`,
  )
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  s = s.replace(/\u0000(\d+)\u0000/g, (_m, i) => codes[Number(i)])
  return s
}

function mapFenceLang(info) {
  const t = info ? info.trim().toLowerCase() : ''
  if (['js', 'javascript', 'ts', 'typescript', 'jsx', 'tsx'].includes(t)) return 'js'
  if (t === 'json') return 'json'
  if (['sh', 'shell', 'bash', 'zsh', 'console', 'terminal'].includes(t)) return 'shell'
  return 'auto'
}

// 围栏闭合：同字符（` 或 ~）且长度 ≥ 3 的独立行
const FENCE_CLOSE_RE = /^(`{3,}|~{3,})\s*$/

function isFenceClose(line, markerChar) {
  const m = line.match(FENCE_CLOSE_RE)
  if (m === null) return false
  return m[1][0] === markerChar
}

const isSepRow = (line) => {
  if (!line.includes('-')) return false
  const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|')
  return cells.every((c) => /^:?-+:?$/.test(c.trim()))
}

const cellAlign = (c) => {
  if (c.startsWith(':') && c.endsWith(':')) return 'center'
  if (c.endsWith(':')) return 'right'
  return ''
}

/** 表格起点：当前行含竖线且下一行为分隔行 */
function isTableStart(lines, i) {
  if (i + 1 >= lines.length) return false
  if (!lines[i].includes('|')) return false
  return isSepRow(lines[i + 1])
}

const PARAGRAPH_STOP =
  /^(#{1,6}\s|```|~~~|\s*>|\s*[-*+]\s|\s*\d+[.)]\s|\s*(-{3,}|\*{3,}|_{3,})\s*$)/

function canContinueParagraph(lines, i) {
  if (i >= lines.length) return false
  if (!lines[i].trim()) return false
  if (PARAGRAPH_STOP.test(lines[i])) return false
  if (isTableStart(lines, i)) return false
  return true
}

const LIST_ITEM_RE = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/

function renderList(lines, start) {
  let html = ''
  let i = start
  const stack = []
  const closeTo = (indent) => {
    while (stack.length > 0) {
      const top = stack[stack.length - 1]
      if (top.indent <= indent) break
      html += `</li></${stack.pop().type}>`
    }
  }

  while (i < lines.length) {
    const m = lines[i].match(LIST_ITEM_RE)
    if (m === null) {
      // 宽松列表：跳过中间的空行
      const nextLine = lines[i + 1] ? lines[i + 1] : ''
      if (!lines[i].trim() && LIST_ITEM_RE.test(nextLine)) {
        i += 1
        continue
      }
      break
    }
    const indent = m[1].replace(/\t/g, '  ').length
    const type = /\d/.test(m[2]) ? 'ol' : 'ul'
    const content = renderInline(m[3])

    closeTo(indent)
    const top = stack[stack.length - 1]
    if (stack.length === 0) {
      stack.push({ type, indent })
      html += `<${type} class="ew-md__list">`
    } else if (top.type !== type) {
      // 同层级切换列表类型：完全收栈再开新列表
      while (stack.length > 0) {
        html += `</li></${stack.pop().type}>`
      }
      stack.push({ type, indent })
      html += `<${type} class="ew-md__list">`
    } else if (top.indent < indent) {
      stack.push({ type, indent })
      html += `<${type} class="ew-md__list">`
    } else {
      html += '</li>'
    }
    html += `<li>${content}`
    i += 1
  }
  while (stack.length > 0) {
    html += `</li></${stack.pop().type}>`
  }
  return { html, next: i }
}

function cellHtml(c, idx, aligns, tag) {
  const a = aligns[idx]
  if (a === 'left' ? false : Boolean(a)) {
    return `<${tag} style="text-align:${a}">${renderInline(c)}</${tag}>`
  }
  return `<${tag}>${renderInline(c)}</${tag}>`
}

function renderTable(lines, i) {
  const splitRow = (r) =>
    r.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
  const head = splitRow(lines[i])
  const aligns = splitRow(lines[i + 1]).map(cellAlign)
  let cursor = i + 2
  const rows = []
  while (cursor < lines.length) {
    if (!lines[cursor].includes('|')) break
    if (!lines[cursor].trim()) break
    rows.push(splitRow(lines[cursor]))
    cursor += 1
  }
  const thead = `<tr>${head.map((c, idx) => cellHtml(c, idx, aligns, 'th')).join('')}</tr>`
  const tbody = rows
    .map((r) => `<tr>${r.map((c, idx) => cellHtml(c, idx, aligns, 'td')).join('')}</tr>`)
    .join('')
  return {
    html: `<div class="ew-md__table-wrap"><table class="ew-md__table"><thead>${thead}</thead><tbody>${tbody}</tbody></table></div>`,
    next: cursor,
  }
}

function renderFence(lines, i, markerChar, lang) {
  const buf = []
  let cursor = i + 1
  while (cursor < lines.length) {
    if (isFenceClose(lines[cursor], markerChar)) break
    buf.push(lines[cursor])
    cursor += 1
  }
  if (cursor < lines.length) cursor += 1
  const mapped = mapFenceLang(lang)
  const body = buf.join('\n')
  const inner = mapped === 'auto' ? highlightCode(body) : highlightCode(body, mapped)
  return {
    html: `<pre class="ew-md__pre"><code>${inner}</code></pre>`,
    next: cursor,
  }
}

/** 解析入口：输入 Markdown 源文本，输出 HTML 片段 */
export function parseMarkdown(src) {
  const lines = String(src != null ? src : '').replace(/\r\n?/g, '\n').split('\n')
  const out = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) {
      i += 1
      continue
    }

    // 围栏代码块
    const fence = line.match(/^\s*(`{3,}|~{3,})\s*(\S*)\s*$/)
    if (fence) {
      const { html, next } = renderFence(lines, i, fence[1][0], fence[2])
      out.push(html)
      i = next
      continue
    }

    // 标题
    const h = line.match(/^(#{1,6})\s+(.+?)\s*#*$/)
    if (h) {
      const level = h[1].length
      out.push(`<h${level} class="ew-md__h">${renderInline(h[2])}</h${level}>`)
      i += 1
      continue
    }

    // 分隔线
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push('<hr class="ew-md__hr" />')
      i += 1
      continue
    }

    // 引用（递归解析内层）
    if (/^\s*>/.test(line)) {
      const buf = []
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ''))
        i += 1
      }
      out.push(`<blockquote class="ew-md__quote">${parseMarkdown(buf.join('\n'))}</blockquote>`)
      continue
    }

    // 表格
    if (isTableStart(lines, i)) {
      const { html, next } = renderTable(lines, i)
      out.push(html)
      i = next
      continue
    }

    // 列表
    if (LIST_ITEM_RE.test(line)) {
      const { html, next } = renderList(lines, i)
      out.push(html)
      i = next
      continue
    }

    // 段落（连续非空行；单换行转 <br>）
    const buf = [line]
    i += 1
    while (canContinueParagraph(lines, i)) {
      buf.push(lines[i])
      i += 1
    }
    out.push(`<p class="ew-md__p">${renderInline(buf.join('\n')).replace(/\n/g, '<br />')}</p>`)
  }

  return out.join('\n')
}
