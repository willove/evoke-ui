/**
 * 生成 MCP 服务的组件目录数据（data/catalog.json）
 * 数据源：business / charts 的 meta.js（直接 import），UI 站的 config.mts 侧栏（正则提取）
 * 组件文档页变更后重跑：node scripts/generate-catalog.mjs
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '../../..')

const businessMeta = await import(pathToFileURL(resolve(repo, 'docs/.vitepress/theme/meta.js')).href)
const chartsMeta = await import(pathToFileURL(resolve(repo, 'docs-charts/.vitepress/theme/meta.js')).href)

const entries = []

for (const cat of businessMeta.CATEGORIES) {
  for (const comp of cat.components) {
    entries.push({
      site: 'business',
      name: comp.zh || comp.name,
      title: comp.name,
      category: cat.name,
      path: comp.path,
    })
  }
}

for (const cat of chartsMeta.CHART_NAV) {
  for (const comp of cat.components) {
    entries.push({
      site: 'charts',
      name: comp.name,
      title: cat.name === '图表' ? comp.name : `${cat.name} · ${comp.name}`,
      category: cat.name,
      path: comp.path,
    })
  }
}

// charts 指南页（主题/色板/AI 生成/设计规范等）一并入目录，list/search 可发现
for (const cat of chartsMeta.GUIDE_NAV) {
  for (const comp of cat.components) {
    entries.push({
      site: 'charts',
      name: comp.name,
      title: comp.name,
      category: cat.name,
      path: comp.path,
    })
  }
}

// UI 站目录在 config.mts 侧栏里，提取 /components/ 与 /mobile/components 下的条目
const uiConfig = await (async () => {
  const text = await import('node:fs').then((fs) => fs.readFileSync(resolve(repo, 'docs-web/.vitepress/config.mts'), 'utf8'))
  const items = []
  const re = /\{ text: '([^']+)', link: '([^']+)' \}/g
  let m
  while ((m = re.exec(text))) {
    if (!/\/components\//.test(m[2])) continue
    const text0 = m[1]
    const en = text0.replace(/\s[\u4e00-\u9fa5/＋（）()·].*$/, '').trim()
    const zh = text0.slice(en.length).trim()
    items.push({ site: 'ui', name: en || text0, title: text0, category: '组件', path: m[2] })
  }
  return items
})()
entries.push(...uiConfig)

const catalog = {
  generatedAt: new Date().toISOString(),
  sites: {
    ui: {
      label: 'Evoke UI',
      host: 'https://evoke-ui.wil-works.com',
      desc: '官网级 UI 框架：Clean Navy 设计语言，明暗双主题与运行时换色',
    },
    business: {
      label: 'Evoke Business UI',
      host: 'https://evoke-business-ui.wil-works.com',
      desc: '中后台 UI 框架：150+ 通用与业务组件，内嵌同一图表引擎',
    },
    charts: {
      label: 'Evoke Charts',
      host: 'https://evoke-charts.wil-works.com',
      desc: '零依赖 Canvas 自绘图表库：29 种图表类型，spec 配置式声明',
    },
  },
  entries,
}

// nav 与侧栏可能指向同一页面：按 site+path 去重，保留标题更长的一条
const seen = new Map()
for (const e of entries) {
  const key = `${e.site}:${e.path}`
  const prev = seen.get(key)
  if (!prev || e.title.length > prev.title.length) seen.set(key, e)
}
catalog.entries = [...seen.values()]

writeFileSync(resolve(here, '../data/catalog.json'), JSON.stringify(catalog, null, 2) + '\n')
const bySite = entries.reduce((m, e) => ((m[e.site] = (m[e.site] || 0) + 1), m), {})
console.log('catalog.json 已生成：', bySite, `共 ${entries.length} 条`)
