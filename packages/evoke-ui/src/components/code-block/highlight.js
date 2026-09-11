/**
 * EvCodeBlock 内置轻量语法高亮 — 零依赖
 * 覆盖 shell / js / json 三种常用形态，`auto` 按内容特征自动识别；
 * 所有原文一律先 HTML 转义再包裹 token span，产物可安全用于 v-html
 */

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * 规则项：[sticky 正则, token 类名]；可选 when(src, i, cmdNext) 做上下文门控。
 * 扫描从左到右，位置逐点尝试各规则，首个命中者胜出，未命中字符逐字落入普通文本
 */
function scan(src, rules) {
  let out = ''
  let plain = ''
  let cmdNext = true // shell 场景：行首 / 管道符之后是命令名
  const flush = () => {
    if (plain) {
      out += escapeHtml(plain)
      plain = ''
    }
  }

  let i = 0
  while (i < src.length) {
    let matched = null
    for (const rule of rules) {
      const [re, cls] = Array.isArray(rule) ? rule : [rule.re, rule.cls]
      if (rule.when) {
        const skip = !rule.when(src, i, cmdNext)
        if (skip) continue
      }
      re.lastIndex = i
      // sticky 正则锚定 lastIndex，match 与 exec 等价且返回同构结果
      const m = src.match(re)
      if (m !== null) {
        if (m.index === i) {
          matched = { text: m[0], cls }
          break
        }
      }
    }

    if (matched !== null) {
      flush()
      out += `<span class="tok-${matched.cls}">${escapeHtml(matched.text)}</span>`
      i += matched.text.length
      // 管道/逻辑符或换行之后回到「命令位」；其余 token 消费后离开命令位
      cmdNext = matched.cls === 'op'
      if (matched.text.includes('\n')) cmdNext = true
    } else {
      plain += src[i]
      if (src[i] === '\n') cmdNext = true
      i += 1
    }
  }
  flush()
  return out
}

// 注：逻辑与/或按 {2} 量词书写，避免与字面双写符号混淆
const RULES = {
  shell: [
    [/#[^\n]*/y, 'comment'],
    [/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/y, 'string'],
    [/\$\{?[A-Za-z_][A-Za-z0-9_]*\}?/y, 'env'],
    { re: /--?[a-zA-Z][\w-]*/y, cls: 'flag', when: (_s, i) => (i === 0 ? true : /\s/.test(_s[i - 1])) },
    [/\d[\d._]*/y, 'number'],
    [/&{2}|\|{2}|[|;&<>]/y, 'op'],
    { re: /[a-zA-Z@][\w./@-]*/y, cls: 'cmd', when: (_s, _i, cmdNext) => cmdNext },
  ],
  js: [
    [/\/\/[^\n]*|\/\*[\s\S]*?\*\//y, 'comment'],
    [/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/y, 'string'],
    [
      /\b(?:const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|import|from|export|default|class|extends|new|delete|in|of|instanceof|typeof|void|await|async|yield|try|catch|finally|throw)\b/y,
      'keyword',
    ],
    [/\b(?:true|false|null|undefined|this|super)\b/y, 'atom'],
    [/\b0x[\da-fA-F]+\b|\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/y, 'number'],
    [/[A-Za-z_$][\w$]*(?=\s*\()/y, 'fn'],
    [/=>|\.{3}|[{}()[\];,.:=+\-*/%<>!&|?]/y, 'punct'],
  ],
  json: [
    [/"(?:\\.|[^"\\])*"(?=\s*:)/y, 'key'],
    [/"(?:\\.|[^"\\])*"/y, 'string'],
    [/\b(?:true|false|null)\b/y, 'keyword'],
    [/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y, 'number'],
    [/[{}[\]:,]/y, 'punct'],
  ],
}

const ALIAS = { bash: 'shell', sh: 'shell', zsh: 'shell', javascript: 'js', ts: 'js', typescript: 'js' }

/** 按内容特征自动识别语言 */
export function detectLanguage(code) {
  const t = code.trim()
  if (/^[{[]/.test(t)) return 'json'
  if (/\b(?:const|let|var|function|import|export|class)\b/.test(t)) return 'js'
  if (/=>/.test(t)) return 'js'
  return 'shell'
}

/**
 * 高亮入口：language 传 'auto'（默认）或具体语言名；
 * 未知语言按纯文本处理（仅转义）
 */
export function highlightCode(code, language = 'auto') {
  if (!code) return ''
  let lang = language
  if (lang === 'auto') lang = detectLanguage(code)
  if (ALIAS[lang]) lang = ALIAS[lang]
  const rules = RULES[lang]
  if (!rules) return escapeHtml(code)
  return scan(code, rules)
}
