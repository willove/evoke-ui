import { describe, it, expect } from 'vitest'
import { marked } from 'marked'
import { renderChatMarkdown } from '../src/components/chatbot/chatMarkdown'

/**
 * 流式 Markdown 的成本预算（对标 DSH 的 MAIN_THREAD_DELAY_BUDGET_MS 思路）
 *
 * ChatMarkdown 流式期间按帧合并，但每帧仍是整篇重解析；逐片回写时总成本随长度平方增长。
 * 这条用例把「现实长度回答 + 逐片回写」的成本钉在预算内：以后谁把渲染改贵了会红，
 * 而不是等到线上长回答卡住才发现。
 *
 * 同时量了一个"尾部冻结"原型（只重解析最后两个块、前缀走缓存）的加速比——
 * 用于决定要不要真的上冻结：见用例末尾打印的数字。
 */

const STEP = 6 // 每次回写的字符数（约等于一帧合并后的量）

function buildAnswer(target) {
  const parts = []
  let i = 0
  while (parts.join('').length < target) {
    i += 1
    parts.push(
      `第 ${i} 段：渠道结构变化是主因，**信息流 CPM 上涨**约 20%，与 \`retention_7d\` 无关。\n\n`
      + `- 拆渠道看分端新增\n- 暂停 ROI < 1.5 的计划\n- 邀请裂变预算 +15%\n\n`,
    )
    if (i % 4 === 0) parts.push('```js\nfunction greet(name) {\n  return `hello ${name}`\n}\n```\n\n')
    if (i % 6 === 0) parts.push('| 渠道 | 新增 | 环比 |\n| --- | --- | --- |\n| 信息流 | 1,240 | -18% |\n\n')
  }
  return parts.join('')
}

/** 尾部冻结原型：切在最后两个顶层块之前，前缀 HTML 按前缀字符串缓存 */
function frozenSplit(src) {
  const blocks = src.split(/(?<=\n)\n(?=\S)/)
  if (blocks.length <= 3) return null
  return blocks.slice(0, blocks.length - 2).join('\n\n').length
}

function measureFullRedraw(answer) {
  let worst = 0
  let total = 0
  for (let i = STEP; i <= answer.length; i += STEP) {
    const src = answer.slice(0, i)
    const t = performance.now()
    renderChatMarkdown(src)
    const cost = performance.now() - t
    worst = Math.max(worst, cost)
    total += cost
  }
  return { total, worst, frames: Math.floor(answer.length / STEP) }
}

function measureFrozen(answer) {
  let worst = 0
  let total = 0
  let cacheKey = ''
  let cacheHtml = ''
  let cacheHits = 0
  for (let i = STEP; i <= answer.length; i += STEP) {
    const src = answer.slice(0, i)
    const t = performance.now()
    const cut = frozenSplit(src)
    if (cut === null) {
      renderChatMarkdown(src)
    } else {
      const prefix = src.slice(0, cut)
      if (prefix !== cacheKey) {
        cacheHtml = renderChatMarkdown(prefix)
        cacheKey = prefix
      } else {
        cacheHits += 1
      }
      renderChatMarkdown(src.slice(cut))
    }
    const cost = performance.now() - t
    worst = Math.max(worst, cost)
    total += cost
  }
  return { total, worst, cacheHits, cacheHtml: cacheHtml.length }
}

/** 词法器权威边界：按 marked lexer 的 token.raw 累加，取"最后两个块"之前的位置 */
function lexerCut(src) {
  const tokens = marked.lexer(src)
  if (tokens.length <= 3) return null
  let offset = 0
  for (const token of tokens.slice(0, tokens.length - 2)) offset += token.raw.length
  return offset
}

describe('流式 Markdown 成本预算', () => {
  it('2500 字回答逐片回写：单帧与总成本都在预算内', () => {
    const answer = buildAnswer(2500)
    const full = measureFullRedraw(answer)
    const frozen = measureFrozen(answer)
    // eslint-disable-next-line no-console
    console.log(`[markdown-cost] chars=${answer.length} frames=${full.frames} `
      + `full: total=${full.total.toFixed(0)}ms worst=${full.worst.toFixed(1)}ms | `
      + `frozen-proto: total=${frozen.total.toFixed(0)}ms worst=${frozen.worst.toFixed(1)}ms `
      + `hits=${frozen.cacheHits} speedup=${(full.total / frozen.total).toFixed(1)}x`)

    // 护栏口径：**相对冻结原型**（同一台机器上同场测两次，跨机器可比）；
    // 绝对值只做"别挂死"的兜底——共享 runner 的墙钟耗时不配当门槛
    // （2026-09-26 CI 上这条绝对断言曾经拦截过一次，本地却稳定通过，改成相对口径）。
    const speedup = full.total / frozen.total
    expect(speedup).toBeLessThan(15)
    expect(full.total).toBeLessThan(Math.max(30000, frozen.total * 15))
    expect(full.worst).toBeLessThan(Math.max(500, frozen.worst * 25))
  })

  it('冻结可行性：词法器边界拼接与整篇逐字节一致（决定要不要上冻结的依据）', () => {
    const answer = buildAnswer(1200)
    const cut = lexerCut(answer)
    expect(cut).toBeGreaterThan(0)
    const whole = renderChatMarkdown(answer)
    const stitched = renderChatMarkdown(answer.slice(0, cut)) + renderChatMarkdown(answer.slice(cut))
    // 权威边界下必须逐字节一致——一致才说明"前缀冻结"在渲染上是等价的；
    // 注意：手写字符串切分会切进段落内部（** 被劈开），这也是本用例存在的意义。
    expect(stitched).toBe(whole)

    // 反例钉：朴素字符串切边界会产出坏标记，别走这条路
    const naiveCut = answer.split(/(?<=\n)\n(?=\S)/).slice(0, -2).join('\n\n').length
    const naive = renderChatMarkdown(answer.slice(0, naiveCut)) + renderChatMarkdown(answer.slice(naiveCut))
    expect(naive).not.toBe(whole)
  })
})