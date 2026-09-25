#!/usr/bin/env node
/**
 * G7 几何预算门 — chrome 度量与控件尺寸只准引用令牌（tools-ui 计划 06 §一 G7）
 *
 * 上一代教训："高度中性"补丁与重基线（UI-9 首轮 12 红、UI-15 首轮 51 红）——
 * 字面量 px 一旦写进组件，密度三档切换就会各自为政。本门把预算做成可检查约束：
 *
 * 规则：
 *   ① 布局属性（height/width/min、max、padding、margin、gap、top/right/bottom/left/inset 一族）
 *      出现字面量 px 即红；白名单：0 / 1px 描边 / 百分比 / calc 内部（calc 里也不许有裸 px）
 *   ② z-index 禁字面量：一律走 --et-z-* 阶梯（组件内写 9999 即红）
 *   ③ 组件契约：EtToolGroup 的组标题行必须引用 --et-chrome-group-label-height
 *      （固定一条基线，不随内容撑开 —— 上一代组名行 3 个基线的缺陷门）
 *   ④ 工具行禁换行：组内行必须声明 flex-wrap: nowrap（宽度不足走溢出折叠，不换行）
 *
 * chrome 各带高度/预算值本身定义在 src/styles/variables.css（单一事实源，豁免本门）。
 *
 * 用法: node scripts/check-geometry.mjs （已挂入 build，违规即构建失败）
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, extname, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')
const SRC = resolve(pkgRoot, 'src')

const EXTS = new Set(['.vue', '.js', '.mjs', '.ts', '.css'])
const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage'])
/** 令牌定义位（预算值的家）豁免规则 ① */
const EXEMPT_FILES = [
  resolve(SRC, 'styles/variables.css'),
  resolve(SRC, 'styles/dark.css'),
]

/** 布局属性清单（tools-ui 计划 03 §四 G7 判定方式 1） */
const LAYOUT_PROPS = [
  'height', 'width', 'min-height', 'min-width', 'max-height', 'max-width',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'padding-inline', 'padding-block', 'padding-inline-start', 'padding-inline-end',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'margin-inline', 'margin-block', 'margin-inline-start', 'margin-inline-end',
  'gap', 'row-gap', 'column-gap',
  'top', 'right', 'bottom', 'left', 'inset', 'inset-inline', 'inset-block',
]

function walk(dir) {
  const out = []
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) out.push(...walk(p))
    else if (EXTS.has(extname(p))) out.push(p)
  }
  return out
}

const violations = []
const files = walk(SRC).filter((f) => !EXEMPT_FILES.includes(f))

/** 值内是否残留 >1px 的字面量（var() 内容剥掉后再判；0/1px 白名单） */
function literalPxInValue(value) {
  const v = value.trim()
  if (v === '0' || v === 'auto' || v === 'none' || v === 'fit-content') return null
  if (/^-?[\d.]+%$/.test(v)) return null
  if (/^(min-content|max-content)$/.test(v)) return null
  const withoutVars = v.replace(/var\([^()]*\)/g, ' ')
  const hits = []
  for (const m of withoutVars.matchAll(/(^|[^\w.])(\d*\.?\d+)px/g)) {
    const num = parseFloat(m[2])
    if (num > 1) hits.push(`${num}px`)
  }
  return hits.length ? hits.join('、') : null
}

/** .vue 拆分出 <style> 块与模板内联 style 属性所在行 */
function scanCssText(text, file, where) {
  for (const m of text.matchAll(/([a-zA-Z-]+)\s*:\s*([^;{}]+)/g)) {
    const prop = m[1].toLowerCase()
    const value = m[2]
    if (LAYOUT_PROPS.includes(prop)) {
      const bad = literalPxInValue(value)
      if (bad) violations.push(`${where}  布局属性 ${prop}: ${value.trim().slice(0, 60)} 含字面量 ${bad}（应引用 --et-* 令牌）`)
    }
    if (prop === 'z-index' && /^\s*\d+\s*$/.test(value)) {
      violations.push(`${where}  z-index: ${value.trim()} 为字面量（应走 --et-z-* 阶梯）`)
    }
    if (prop === 'flex-wrap' && /wrap\b/.test(value) && !/nowrap/.test(value)) {
      violations.push(`${where}  flex-wrap 声明为换行（工具区宽度不足走溢出折叠，禁换行）`)
    }
  }
}

for (const file of files) {
  const src = readFileSync(file, 'utf8')
  const at = `${file}`
  if (file.endsWith('.vue')) {
    // <style src> / <style> 块
    for (const m of src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
      scanCssText(m[1], file, `${at} <style>`)
    }
    // 模板内联 style="..."
    for (const m of src.matchAll(/\sstyle="([^"]*)"/g)) {
      scanCssText(m[1], file, `${at} 内联 style`)
    }
    // JS style 绑定对象（style.css 之外的兜底）
    for (const m of src.matchAll(/(?:style)\s*:\s*\{([^}]*)\}/g)) {
      scanCssText(m[1], file, `${at} :style 绑定`)
    }
  } else if (file.endsWith('.css')) {
    scanCssText(src, file, at)
  } else {
    // JS：模板字符串里的 CSS 或 style 绑定都扫
    scanCssText(src, file, at)
  }
}

// ── 规则 ③/④：组件契约（工具组）──
{
  const groupCss = resolve(SRC, 'components/tool-group/style.css')
  if (existsSync(groupCss)) {
    const css = readFileSync(groupCss, 'utf8')
    if (!/--et-chrome-group-label-height/.test(css)) {
      violations.push(`${groupCss}  组标题行未引用 --et-chrome-group-label-height（固定一条基线，G7 判定 2）`)
    }
    if (!/flex-wrap:\s*nowrap/.test(css)) {
      violations.push(`${groupCss}  组行未声明 flex-wrap: nowrap（禁换行，G7 判定 4）`)
    }
  }
}

if (violations.length) {
  console.error(`[check-geometry] 违反几何预算约束，共 ${violations.length} 处：`)
  for (const v of violations) console.error('  ' + v)
  console.error('\n约束：布局属性只准引用 --et-* / --eb-* 令牌；z-index 走 --et-z-* 阶梯。')
  process.exit(1)
}

console.log('[check-geometry] 通过：布局属性无字面量 px、z-index 走阶梯、工具组契约齐备')
