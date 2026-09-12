#!/usr/bin/env node
/**
 * @wil-works/evoke-mcp — Evoke 生态 MCP 服务（stdio）
 *
 * 给 AI 编码助手提供三库（Evoke UI / Business UI / Charts）的组件目录与文档检索、
 * 图表 options 的 JSON Schema、spec 校验（lint）与数据直生（generate）。
 *
 * 文档正文实时取自三个文档站的 .md 纯文本版（由 vitepress-plugin-llms 生成），
 * 组件目录内置于 data/catalog.json（scripts/generate-catalog.mjs 生成）。
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import {
  chartOptionsSchema,
  lintChartSpec,
  generateChartSpec,
  buildChartPrompt,
} from '@wil-works/evoke-charts/ai'

const here = dirname(fileURLToPath(import.meta.url))
const catalog = JSON.parse(readFileSync(resolve(here, 'data/catalog.json'), 'utf8'))

const SITE_KEYS = Object.keys(catalog.sites)

function pickSite(site) {
  return site ?? 'ui'
}

function findEntries(site, query) {
  const q = query.trim().toLowerCase()
  const pool = catalog.entries.filter((e) => e.site === site)
  if (!q) return pool
  return pool.filter((e) =>
    [e.name, e.title, e.category, e.path].some((v) => v?.toLowerCase().includes(q)),
  )
}

function entryLine(e) {
  return `- ${e.name}${e.title && e.title !== e.name ? `（${e.title}）` : ''} — ${catalog.sites[e.site].host}${e.path}`
}

async function fetchPageMarkdown(site, path) {
  const host = catalog.sites[site]?.host
  if (!host) throw new Error(`未知站点「${site}」，可选：${SITE_KEYS.join(' / ')}`)
  const clean = path.replace(/\/+$/, '') || '/'
  const url = `${host}${clean === '/' ? '/index' : clean}.md`
  const res = await fetch(url, { headers: { 'user-agent': 'evoke-mcp' } })
  if (!res.ok) {
    throw new Error(
      `获取失败（${res.status}）：${url}\n该站点可能尚未部署 .md 纯文本版，或路径不存在。可用路径见 catalog：search_components / list_components。`,
    )
  }
  return res.text()
}

const server = new McpServer({
  name: 'evoke-mcp',
  version: '0.1.0',
})

// ─── 目录与文档 ───

server.registerTool(
  'list_components',
  {
    title: '列出 Evoke 组件',
    description:
      '列出 Evoke 三库（ui=官网级 Evoke UI / business=中后台 Business UI / charts=图表库）的组件与页面目录。写界面前先看这里，确认该用哪个包、哪个组件。',
    inputSchema: {
      site: z.enum(SITE_KEYS).optional().describe('限定站点，缺省列出全部'),
    },
  },
  async ({ site }) => {
    const pool = site ? catalog.entries.filter((e) => e.site === site) : catalog.entries
    const lines = []
    for (const key of site ? [site] : SITE_KEYS) {
      const s = catalog.sites[key]
      lines.push(`## ${s.label}（${key}）`, `${s.desc}`, '')
      for (const e of pool.filter((e) => e.site === key)) lines.push(entryLine(e))
      lines.push('')
    }
    return { content: [{ type: 'text', text: lines.join('\n') }] }
  },
)

server.registerTool(
  'search_components',
  {
    title: '搜索 Evoke 组件',
    description:
      '按关键词（英文名 / 中文名 / 分类 / 路径片段）搜索三库组件与图表页面，返回路径供 get_component_docs 取正文。',
    inputSchema: {
      query: z.string().describe('关键词，如 button / 表格 / 折线 / k线 / modal'),
      site: z.enum(SITE_KEYS).optional().describe('限定站点'),
    },
  },
  async ({ query, site }) => {
    const pool = site ? catalog.entries.filter((e) => e.site === site) : catalog.entries
    const q = query.trim().toLowerCase()
    const hits = pool.filter((e) =>
      [e.name, e.title, e.category, e.path].some((v) => v?.toLowerCase().includes(q)),
    )
    if (!hits.length) {
      return { content: [{ type: 'text', text: `无匹配「${query}」。用 list_components 浏览全部目录。` }] }
    }
    return {
      content: [{ type: 'text', text: [`共 ${hits.length} 条：`, ...hits.map(entryLine)].join('\n') }],
    }
  },
)

server.registerTool(
  'get_component_docs',
  {
    title: '获取组件文档',
    description:
      '取某个组件/图表页的完整文档（纯 Markdown，含何时使用、配置要点与示例）。site + name（如 ui + Button / charts + 折线图 line），名字模糊匹配。',
    inputSchema: {
      site: z.enum(SITE_KEYS).describe('所属站点'),
      name: z.string().describe('组件英文名或中文标题，如 Button / 按钮 / 折线图'),
    },
  },
  async ({ site, name }) => {
    const q = name.trim().toLowerCase()
    const hit =
      catalog.entries.find((e) => e.site === site && e.name.toLowerCase() === q) ||
      catalog.entries.find((e) => e.site === site && e.path.toLowerCase().endsWith(`/${q}`)) ||
      catalog.entries.find((e) => e.site === site && e.name.toLowerCase().includes(q)) ||
      catalog.entries.find((e) => e.site === site && e.title.toLowerCase().includes(q))
    if (!hit) {
      return {
        content: [{ type: 'text', text: `「${name}」在 ${site} 无匹配，先 search_components 确认名称。` }],
      }
    }
    const md = await fetchPageMarkdown(site, hit.path)
    return { content: [{ type: 'text', text: md }] }
  },
)

server.registerTool(
  'get_docs_page',
  {
    title: '获取文档页',
    description: '按路径取任意文档页的纯 Markdown（如 /guide/install、/chart/interaction、/guide/design）。',
    inputSchema: {
      site: z.enum(SITE_KEYS).describe('所属站点'),
      path: z.string().describe('页面路径，如 /guide/install'),
    },
  },
  async ({ site, path }) => {
    const md = await fetchPageMarkdown(site, path)
    return { content: [{ type: 'text', text: md }] }
  },
)

// ─── 图表 spec：schema / 校验 / 生成 ───

server.registerTool(
  'get_chart_spec_schema',
  {
    title: '获取图表 options Schema',
    description:
      '返回 Evoke Charts 图表 options 的 JSON Schema（ECharts 风格配置：type/labels/series 等）。写图表配置前先取一份对照。',
    inputSchema: {},
  },
  async () => ({
    content: [
      { type: 'text', text: '```json\n' + JSON.stringify(chartOptionsSchema, null, 2) + '\n```' },
    ],
  }),
)

server.registerTool(
  'lint_chart_spec',
  {
    title: '校验图表 spec',
    description:
      '对图表 options 做三层校验（JSON Schema → 图表规则 → 无头渲染文本越界检查），返回问题列表与自动修正结果。生成配置后务必调用一次。',
    inputSchema: {
      options: z.record(z.unknown()).describe('图表 options 对象（ECharts 风格）'),
    },
  },
  async ({ options }) => {
    const result = await lintChartSpec(options)
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
  },
)

server.registerTool(
  'generate_chart_spec',
  {
    title: '由数据生成图表 spec',
    description:
      '传入表格数据（CSV 字符串或二维数组，首行为表头）与一句需求描述，自动选型并生成图表 options。',
    inputSchema: {
      data: z.string().describe('表格数据：CSV 字符串或 JSON 二维数组，首行为表头'),
      requirement: z.string().optional().describe('需求描述，如「对比各季度营收趋势」「突出占比」'),
    },
  },
  async ({ data, requirement }) => {
    const spec = generateChartSpec(data, { requirement })
    return { content: [{ type: 'text', text: JSON.stringify(spec, null, 2) }] }
  },
)

server.registerTool(
  'build_chart_prompt',
  {
    title: '构建图表提示词',
    description:
      '按 Evoke Charts 的约定生成一份可喂给任意大模型的提示词（含 schema 约束与 few-shot 示例），让任意 AI 都能写出合法图表配置。',
    inputSchema: {
      data: z.string().optional().describe('表格数据（CSV 或二维数组）'),
      requirement: z.string().optional().describe('需求描述'),
    },
  },
  async ({ data, requirement }) => {
    const prompt = buildChartPrompt({ data, requirement })
    return { content: [{ type: 'text', text: prompt }] }
  },
)

await server.connect(new StdioServerTransport())
