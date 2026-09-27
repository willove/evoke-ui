/**
 * 组件 API 事实抽取 —— 文档站组件页的「六面」数据源
 *
 * 为什么要有这一份：组件页原本每页手写 Props / Emits / Slots / 可访问名 / 键盘 / 密度
 * 六张表，36 页 × 六面全靠手抄，于是每改一版就要重抄一遍（慢），而且抄漏的那几页
 * 会静默说谎（design.md 曾长期挂着 1.2.0 已经做完的「键盘 resize 未做」）。
 * 这里改成从**既有的单一来源**直接读：
 *
 *   Props / Emits / 暴露  ← SFC 的 defineProps / defineEmits / defineExpose（含 prop 上的 JSDoc）
 *   Slots                ← src/slots.js 槽位契约（G10 门已与 SFC 双向核对）
 *   层 / 分类 / 粒度 / 摘要 ← src/taxonomy.js（G9 门守的那份）
 *   键盘 / 可访问名 / 令牌  ← SFC 模板与件内 style.css 的实际引用
 *
 * 用法：vite 插件（virtual:component-api）在**每次请求时**重算，dev 改源码即生效，
 * 不落地任何生成物 → 不存在"生成的 json 忘了重新生成"这一类漂移。
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { getEtComponentEntries } from '../../packages/evoke-tools-ui/scripts/component-entries.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = resolve(__dirname, '../../packages/evoke-tools-ui')

const VIRTUAL_ID = 'virtual:component-api'
const RESOLVED_ID = '\0' + VIRTUAL_ID

/* ────────────────────────── 通用小工具 ────────────────────────── */

/** 从 index 处的 `(` / `{` / `[` 起取配对片段（跳过字符串内的括号） */
function sliceBalanced(src, openIdx) {
  const open = src[openIdx]
  const close = { '(': ')', '{': '}', '[': ']' }[open]
  if (!close) return null
  let depth = 0
  let i = openIdx
  let str = null
  for (; i < src.length; i++) {
    const ch = src[i]
    if (str) {
      if (ch === '\\') i++
      else if (ch === str) str = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') str = ch
    else if (ch === open) depth++
    else if (ch === close) {
      depth--
      if (depth === 0) return src.slice(openIdx + 1, i)
    }
  }
  return null
}

/** 去掉 `define*( ... )` 括号里那层字面量外壳，露出对象/数组正文 */
function unwrap(body) {
  const t = body.trim()
  if (t[0] !== '{' && t[0] !== '[') return t
  const inner = sliceBalanced(t, 0)
  return inner === null ? t : inner
}

/** 取一行内的值表达式（到该层级的逗号为止） */
function readValue(body, from) {
  let depth = 0
  let str = null
  for (let j = from; j < body.length; j++) {
    const ch = body[j]
    if (str) {
      if (ch === '\\') j++
      else if (ch === str) str = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') str = ch
    else if ('([{'.includes(ch)) depth++
    else if (')]}'.includes(ch)) {
      if (depth === 0) return body.slice(from, j).trim()
      depth--
    } else if (ch === ',' && depth === 0) return body.slice(from, j).trim()
  }
  return body.slice(from).trim()
}

/** 按**真正的顶层**逗号切段（忽略字符串、注释与嵌套括号内的逗号） */
function splitTopLevel(body) {
  const parts = []
  let depth = 0
  let str = null
  let start = 0
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    if (str) {
      if (ch === '\\') i++
      else if (ch === str) str = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') str = ch
    else if (ch === '/' && body[i + 1] === '*') {
      const end = body.indexOf('*/', i + 2)
      if (end > 0) i = end + 1
    } else if (ch === '/' && body[i + 1] === '/') {
      const end = body.indexOf('\n', i)
      i = end < 0 ? body.length : end
    } else if ('([{'.includes(ch)) depth++
    else if (')]}'.includes(ch)) depth--
    else if (ch === ',' && depth === 0) {
      parts.push(body.slice(start, i))
      start = i + 1
    }
  }
  if (body.slice(start).trim()) parts.push(body.slice(start))
  return parts
}

/** 一段 `/** 说明 *\/ key: value` → { desc, key, value } */
function readMember(segment) {
  const doc = segment.match(/\/\*\*([\s\S]*?)\*\//)
  const rest = doc ? segment.slice(doc.index + doc[0].length) : segment
  const key = rest.match(/^\s*([A-Za-z_$][\w$]*)\s*:\s*/)
  if (!key) return null
  return {
    desc: doc
      ? doc[1]
          .split('\n')
          .map((l) => l.replace(/^\s*\*?\s?/, '').trimEnd())
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()
      : '',
    key: key[1],
    value: rest.slice(key[0].length),
  }
}

/** 压掉换行与多余空白，长值截断（表格里可读） */
function short(text, max = 46) {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim()
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}

/** 从 `type: X` / `type: [String, Object]` 取人类可读的类型 */
function readType(value) {
  const m = value.match(/type:\s*(\[[^\]]*\]|[A-Za-z][\w.]*)/)
  if (!m) return ''
  return m[1].replace(/\s/g, '').replace(/^\[|\]$/g, '').replace(/,/g, ' | ')
}

/* ────────────────────────── SFC 解析 ────────────────────────── */

/** 选项式写法（defineComponent({ props: {…}, emits: […] })）的兜底定位 */
function optionsBlock(src, key) {
  const m = new RegExp(`^\\s{2}${key}:\\s*(\\{|\\[)`, 'm').exec(src)
  if (!m) return null
  return sliceBalanced(src, m.index + m[0].length - 1)
}

function parseProps(src) {
  const idx = src.indexOf('defineProps(')
  let body = null
  if (idx >= 0) body = unwrap(sliceBalanced(src, src.indexOf('(', idx)) || '')
  else body = optionsBlock(src, 'props')
  if (!body) return []
  return splitTopLevel(body)
    .map(readMember)
    .filter(Boolean)
    .map(({ key, value, desc }) => {
      const inner = value.trim().startsWith('{') ? sliceBalanced(value, value.indexOf('{')) : null
      const fields = inner ? splitTopLevel(inner).map(readMember).filter(Boolean) : []
      const def = fields.find((f) => f.key === 'default')
      const required = /true/.test(fields.find((f) => f.key === 'required')?.value || '')
      return {
        name: key,
        type: readType(inner || value),
        default: def ? short(readValue(def.value, 0)) : '',
        required,
        desc,
      }
    })
    .map((p) => ({ ...p, default: p.default || (p.required ? '必填' : '') }))
}

/** 事件载荷：从 `emit('name', a, b)` 的调用点读实际参数，不靠手写 */
function emitPayload(src, name) {
  const calls = [...src.matchAll(new RegExp(`\\bemit\\(\\s*['"]${name}['"]\\s*,([^)]*)\\)`, 'g'))]

  const args = new Set()
  for (const c of calls) {
    splitTopLevel(c[1] || '')
      .map((a) => a.trim())
      .filter(Boolean)
      .forEach((a) => args.add(short(readable(a), 22)))
  }
  return [...args].slice(0, 3).join(', ')
}

/** `props.panel?.id` / `draft.value` 这类调用点表达式，压成读者要看的形状 */
function readable(arg) {
  return arg
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\bprops\./g, '')
    .replace(/\?\./g, '.')
    .replace(/\.value\b/g, '')
}

/** `update:x` 是 v-model 的写入面，语义由名字自证，不占源码注释额度 */
const withVModelDesc = (list) =>
  list.map((e) => (e.desc || !e.name.startsWith('update:') ? e : { ...e, desc: `v-model（${e.name.slice(7)}）的写入` }))

function parseEmits(src) {
  const idx = src.indexOf('defineEmits(')
  let body = null
  if (idx >= 0) body = unwrap(sliceBalanced(src, src.indexOf('(', idx)) || '')
  else body = optionsBlock(src, 'emits')
  if (!body) return []
  // 数组式：['click']，事件名前的 JSDoc 作为说明
  const out = splitTopLevel(body)
    .map((seg) => {
      const m = seg.match(/(?:\/\*\*([\s\S]*?)\*\/\s*)?['"]([\w:.-]+)['"]/)
      if (!m) return null
      return {
        name: m[2],
        desc: m[1]
          ? m[1].split('\n').map((l) => l.replace(/^\s*\*?\s?/, '').trim()).join(' ').replace(/\s+/g, ' ').trim()
          : '',
      }
    })
    .filter(Boolean)
  if (out.length) return withVModelDesc(out.map((e) => ({ ...e, payload: emitPayload(src, e.name) })))
  // 对象式：{ click: ... }
  return withVModelDesc(
    splitTopLevel(body)
      .map(readMember)
      .filter(Boolean)
      .map(({ key, desc }) => ({ name: key, desc, payload: emitPayload(src, key) })),
  )
}

function parseExpose(src) {
  const idx = src.indexOf('defineExpose(')
  if (idx < 0) return []
  const body = unwrap(sliceBalanced(src, src.indexOf('(', idx)) || '')
  if (!body) return []
  return splitTopLevel(body)
    .map(readMember)
    .filter(Boolean)
    .map(({ key, desc }) => ({ name: key, desc }))
}

/** 键盘绑定：处理器数量 + 实际判定的按键名 */
const KEY_NAMES = [
  'Escape', 'Enter', 'Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Home', 'End', 'PageUp', 'PageDown', 'Delete', 'Backspace', 'F1',
]

function parseKeyboard(src) {
  const keys = [...new Set(KEY_NAMES.filter((k) => new RegExp(`['"\`)]\\s*${k}\\s*['"\`]`, '').test(src)))]
  const handlers = (src.match(/@keydown|v-on:keydown|onKeydown/g) || []).length
  const ime = /isImeComposing|compositionstart|compositionend/.test(src)
  return { keys, handlers, ime }
}

function parseA11y(src) {
  const aria = [...new Set([...src.matchAll(/\baria-([a-z-]+)\s*=/g)].map((m) => `aria-${m[1]}`))]
  const roles = [...new Set([...src.matchAll(/\brole\s*=\s*"([\w-]+)"/g)].map((m) => m[1]))]
  const labels = [...src.matchAll(/:aria-label\s*=\s*"([^"]*)"/g)].map((m) => m[1])
  return { aria: aria.sort(), roles, labelSource: labels[0] || '' }
}

/** 件内令牌引用（密度是否真的随档变化，看这里而非看文案） */
function parseTokens(cssPath) {
  if (!existsSync(cssPath)) return { all: [], metric: [] }
  const css = readFileSync(cssPath, 'utf8')
  const all = [...new Set([...css.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]))].sort()
  const metric = all.filter((t) => /--et-(density|size|chrome)-|--et-toolbtn-/.test(t))
  return { all, metric }
}

/* ────────────────────────── 汇总 ────────────────────────── */

export async function buildComponentApi() {
  const [{ COMPONENT_TAXONOMY, LAYERS, CATEGORIES, GRANULARITIES }, { SLOT_CONTRACT, SLOT_CONTRACT_PATHS }] =
    await Promise.all([
      import(resolve(PKG_ROOT, 'src/taxonomy.js')),
      import(resolve(PKG_ROOT, 'src/slots.js')),
    ])
  const entries = getEtComponentEntries()
  const byId = Object.fromEntries(COMPONENT_TAXONOMY.map((c) => [c.id, c]))
  // 槽契约的键 → SFC 相对路径（这份映射由 G10 门保证不漏），反手用它取键
  const keyByFile = Object.fromEntries(
    Object.entries(SLOT_CONTRACT_PATHS).map(([key, rel]) => [`components/${rel}`, key]),
  )
  const components = {}

  for (const entry of entries) {
    const file = resolve(PKG_ROOT, 'src', entry.file)
    const src = readFileSync(file, 'utf8')
    const contract = SLOT_CONTRACT[keyByFile[entry.file]]
    const tokens = parseTokens(resolve(PKG_ROOT, 'src', dirname(entry.file), 'style.css'))
    // SFC 里实际开的槽（G10 只双向核对**已登记**的件；未登记的件若开了槽，这里标出来给门禁用）
    const declared = [...src.matchAll(/<slot\b([^>]*?)\/?>/g)].map((m) => m[1])
    const usedSlots = [
      ...new Set(declared.filter((a) => /name="/.test(a)).map((a) => a.match(/name="([\w-]+)"/)[1])),
    ]
    components[entry.name] = {
      id: entry.name,
      exportName: entry.exportName,
      file: entry.file,
      ...(byId[entry.name] || {}),
      layerZh: LAYERS[byId[entry.name]?.layer]?.zh || '',
      categoryZh: CATEGORIES[byId[entry.name]?.category]?.zh || '',
      granularityZh: GRANULARITIES[byId[entry.name]?.granularity]?.zh || byId[entry.name]?.granularity || '',
      props: parseProps(src),
      /** 无声明 props 时是否在透传 $attrs（包装件的常见形态，页面要说明而不是留空表） */
      attrs: /\$attrs/.test(src),
      emits: parseEmits(src),
      expose: parseExpose(src),
      slots: contract
        ? {
            named: contract.slots || [],
            default: contract.default || '',
            passthrough: !!contract.passthrough,
            slotless: contract.slotless || '',
            declared: true,
            used: usedSlots,
          }
        : { named: [], default: '', passthrough: false, slotless: '', declared: false, used: usedSlots },
      keyboard: parseKeyboard(src),
      a11y: parseA11y(src),
      tokens,
    }
  }
  return { components, order: entries.map((e) => e.name) }
}

/** vite 插件：把上面的结果作为虚拟模块暴露给主题（每次请求重算，dev 即时跟随源码） */
export function componentApiPlugin() {
  return {
    name: 'evoke-component-api',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
      return null
    },
    async load(id) {
      if (id !== RESOLVED_ID) return null
      const api = await buildComponentApi()
      return `export default ${JSON.stringify(api)}`
    },
  }
}
