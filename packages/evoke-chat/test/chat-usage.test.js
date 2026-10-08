import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatUsage from '../src/components/chatbot/ChatUsage.vue'
import ChatMessage from '../src/components/chatbot/ChatMessage.vue'
import { useChatEngine } from '../src/components/chatbot/useChatEngine'
import { chatLabels } from '../src/components/chatbot/labels'

/**
 * 批 L：token 与成本计量
 *
 * 组件只展示宿主给的 usage——成本要价目表，那是宿主的业务数据，引擎与组件都不猜。
 */

const usage = (extra = {}) => ({ promptTokens: 120, completionTokens: 380, totalTokens: 500, ...extra })

describe('ChatUsage 格式化', () => {
  it('小于一千原样，一千 / 一百万以上折算', () => {
    const w = mount(ChatUsage, { props: { usage: usage({ totalTokens: 999 }) } })
    expect(w.find('.eb-chat-usage__tokens').text()).toBe(chatLabels.usage.tokens('999'))
    w.unmount()
    const k = mount(ChatUsage, { props: { usage: usage({ totalTokens: 12400 }) } })
    expect(k.find('.eb-chat-usage__tokens').text()).toContain('12.4k')
    k.unmount()
    const m = mount(ChatUsage, { props: { usage: usage({ totalTokens: 2300000 }) } })
    expect(m.find('.eb-chat-usage__tokens').text()).toContain('2.3M')
    m.unmount()
  })

  it('total 缺失时用输入+输出补', () => {
    const w = mount(ChatUsage, { props: { usage: { promptTokens: 100, completionTokens: 50 } } })
    expect(w.find('.eb-chat-usage__tokens').text()).toContain('150')
  })

  it('成本小额保留四位、常规两位，币种前缀跟随数据', () => {
    const small = mount(ChatUsage, { props: { usage: usage({ cost: 0.0032, currency: '$' }) } })
    expect(small.find('.eb-chat-usage__cost').text()).toBe('$0.0032')
    small.unmount()
    const big = mount(ChatUsage, { props: { usage: usage({ cost: 1.239, currency: '¥' }) } })
    expect(big.find('.eb-chat-usage__cost').text()).toBe('¥1.24')
    big.unmount()
  })

  it('没给成本就不显示成本位', () => {
    const w = mount(ChatUsage, { props: { usage: usage() } })
    expect(w.find('.eb-chat-usage__cost').exists()).toBe(false)
  })

  it('输入/输出明细以读屏文本与悬浮提示给出，视觉上不占位', () => {
    const w = mount(ChatUsage, { props: { usage: usage() } })
    const detail = w.find('.eb-chat-usage__detail')
    expect(detail.attributes('role')).toBe('status')
    expect(detail.text()).toContain('输入 120')
    expect(detail.text()).toContain('输出 380')
    expect(w.attributes('title')).toBe(detail.text())
  })

  it('没有任何用量数据时整个不渲染', () => {
    expect(mount(ChatUsage, { props: { usage: {} } }).find('.eb-chat-usage').exists()).toBe(false)
    expect(mount(ChatUsage, { props: { usage: null } }).find('.eb-chat-usage').exists()).toBe(false)
  })
})

describe('ChatUsage 汇总', () => {
  const ITEMS = [
    { promptTokens: 100, completionTokens: 200, totalTokens: 300, cost: 0.001, currency: '$' },
    { promptTokens: 50, completionTokens: 50, totalTokens: 100, cost: 0.002, currency: '$' },
  ]

  it('多条累加，token 与成本都汇总', () => {
    const w = mount(ChatUsage, { props: { items: ITEMS } })
    expect(w.find('.eb-chat-usage__tokens').text()).toContain('400')
    expect(w.find('.eb-chat-usage__cost').text()).toBe('$0.0030')
    expect(w.find('.eb-chat-usage__detail').text()).toContain('近 2 条合计')
  })

  it('部分条目没有成本时，有成本才汇总', () => {
    const w = mount(ChatUsage, { props: { items: [{ promptTokens: 10 }, { totalTokens: 5 }] } })
    expect(w.find('.eb-chat-usage__cost').exists()).toBe(false)
    expect(w.find('.eb-chat-usage__tokens').text()).toContain('15')
  })

  it('混币种取第一个出现的，不做汇率换算', () => {
    const w = mount(ChatUsage, { props: { items: [{ cost: 1, currency: '$' }, { cost: 1, currency: '¥' }] } })
    expect(w.find('.eb-chat-usage__cost').text()).toBe('$2.00')
  })

  it('空数组与含空项都不炸', () => {
    expect(mount(ChatUsage, { props: { items: [] } }).find('.eb-chat-usage').exists()).toBe(false)
    const w = mount(ChatUsage, { props: { items: [null, { totalTokens: 7 }] } })
    expect(w.find('.eb-chat-usage__tokens').text()).toContain('7')
  })
})

describe('ChatUsage 尺寸与外观', () => {
  it('compact 与 default 两档；bare 决定要不要底色', () => {
    const compact = mount(ChatUsage, { props: { usage: usage() } })
    expect(compact.classes()).toContain('eb-chat-usage--compact')
    expect(compact.classes()).toContain('is-bare')
    compact.unmount()
    const rich = mount(ChatUsage, { props: { usage: usage(), size: 'default', bare: false } })
    expect(rich.classes()).toContain('eb-chat-usage--default')
    expect(rich.classes()).not.toContain('is-bare')
  })
})

describe('引擎与消息接线', () => {
  it('setUsage 写进消息；空值可清回', () => {
    const eng = useChatEngine({})
    const m = eng.createAssistantMessage()
    eng.completeMessage(m.id)
    eng.setUsage(m.id, usage())
    expect(eng.messages.value[0].usage.totalTokens).toBe(500)
    eng.setUsage(m.id, null)
    expect(eng.messages.value[0].usage).toBeNull()
  })

  it('消息带 usage 时元信息行显示，不带就不显示（回归钉）', () => {
    const withUsage = mount(ChatMessage, {
      props: { message: { id: 'a1', role: 'assistant', content: 'x', status: 'done', usage: usage({ cost: 0.5, currency: '$' }) } },
    })
    expect(withUsage.find('.eb-chat-usage').exists()).toBe(true)
    expect(withUsage.text()).toContain('500')
    withUsage.unmount()

    const without = mount(ChatMessage, {
      props: { message: { id: 'a2', role: 'assistant', content: 'x', status: 'done' } },
    })
    expect(without.find('.eb-chat-usage').exists()).toBe(false)
  })
})

/**
 * 阶梯披露（本轮新增）：一行摘要常驻，明细点开可见
 * 口径与 assistant-ui / AI Elements 一致：为 0 的分项不渲染；无明细就不做可点控件。
 */
describe('用量明细披露', () => {
  const FULL = {
    promptTokens: 1200,
    completionTokens: 380,
    cacheReadTokens: 900,
    reasoningTokens: 260,
    ttftMs: 640,
    tokensPerSecond: 38.4,
  }

  it('为 0 的分项不渲染；给了成本才有成本行', async () => {
    const w = mount(ChatUsage, { props: { usage: FULL }, attachTo: document.body })
    await w.find('.eb-chat-usage__trigger').trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    const rows = [...document.body.querySelectorAll('.eb-chat-usage__row')].map((r) => r.textContent.replace(/\s+/g, ' ').trim())
    expect(rows).toHaveLength(6)                       // 输入/输出/缓存读/推理/首字/速度
    expect(rows[0]).toContain(chatLabels.usage.input)
    expect(rows[0]).toContain('1.2k')
    expect(rows[4]).toContain('0.64s')                 // 首字 640ms
    expect(rows[5]).toContain('38.4 tok/s')
    expect(rows.some((r) => r.includes(chatLabels.usage.cacheWrite))).toBe(false)  // 缓存写为 0 → 不渲染
    expect(rows.some((r) => r.includes(chatLabels.usage.cost))).toBe(false)        // 没给成本 → 不渲染
    w.unmount()
  })

  it('给了成本才出现成本行', async () => {
    const w = mount(ChatUsage, { props: { usage: { ...FULL, cost: 0.0234, currency: '$' } }, attachTo: document.body })
    await w.find('.eb-chat-usage__trigger').trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    const rows = [...document.body.querySelectorAll('.eb-chat-usage__row')].map((r) => r.textContent.replace(/\s+/g, ' ').trim())
    expect(rows.at(-1)).toContain(chatLabels.usage.cost)
    expect(rows.at(-1)).toContain('$0.02')
    w.unmount()
  })

  it('触发器是可点的 button 带无障碍名；关掉 disclosure 时不出现', () => {
    const on = mount(ChatUsage, { props: { usage: FULL } })
    const trigger = on.find('.eb-chat-usage__trigger')
    expect(trigger.element.tagName).toBe('BUTTON')
    expect(trigger.attributes('aria-label')).toBe(chatLabels.usage.disclosure)
    // 根元素与两档类名保持原样（宿主依赖）
    expect(on.find('.eb-chat-usage').classes()).toEqual(expect.arrayContaining(['eb-chat-usage--compact', 'is-bare']))

    const off = mount(ChatUsage, { props: { usage: FULL, disclosure: false } })
    expect(off.find('.eb-chat-usage__trigger').exists()).toBe(false)
    // 纯读数形态：摘要仍在
    expect(off.find('.eb-chat-usage__tokens').text()).toContain('1.6k')
  })

  it('只有总量、没有分项时不渲染可点控件（不做假按钮）', () => {
    const w = mount(ChatUsage, { props: { usage: { totalTokens: 500 } } })
    expect(w.find('.eb-chat-usage__trigger').exists()).toBe(false)
    expect(w.find('.eb-chat-usage__tokens').text()).toContain('500 tokens')
  })
})

describe('ChatUsage segments（宿主自定义分段记账）', () => {
  // 披露行在 popover 懒内容里，jsdom 挂载不渲染（与既有用例同口径：断言读屏文本/暴露方法）
  it('单条 segments 参与披露数据；label 是宿主措辞，组件不翻译', () => {
    const w = mount(ChatUsage, {
      props: { usage: usage({ segments: [{ label: '检索阶段', tokens: 320 }, { label: '生成阶段', tokens: 180 }] }) },
    })
    expect(w.vm.sumUsage([usage({ segments: [{ label: '检索阶段', tokens: 320 }, { label: '生成阶段', tokens: 180 }] })]).segments)
      .toEqual([{ label: '检索阶段', tokens: 320 }, { label: '生成阶段', tokens: 180 }])
  })

  it('多条汇总时 segments 按 label 合并累加', () => {
    const w = mount(ChatUsage, { props: { usage: {} } })
    expect(w.vm.sumUsage([
      { promptTokens: 10, completionTokens: 20, segments: [{ label: '检索', tokens: 8 }] },
      { promptTokens: 5, completionTokens: 5, segments: [{ label: '检索', tokens: 4 }, { label: '重排', tokens: 2 }] },
    ]).segments).toEqual([{ label: '检索', tokens: 12 }, { label: '重排', tokens: 2 }])
  })

  it('只有 segments（无 prompt/completion/cost）也判定有数据，不整件消失', () => {
    const w = mount(ChatUsage, { props: { usage: { segments: [{ label: '阶段', tokens: 64 }] } } })
    expect(w.find('.eb-chat-usage').exists()).toBe(true)
    expect(w.find('.eb-chat-usage__tokens').text()).toContain('0')
  })
})

describe('ChatMessage 阶段进度条（assistant/progress 的可见落点）', () => {
  it('message.progress 有 label 才渲染一行读数；没有就不渲染', () => {
    const withProgress = mount(ChatMessage, {
      props: { message: { id: 'a1', role: 'assistant', content: '', status: 'streaming', progress: { label: '检索知识库', detail: '3 个库', elapsedMs: 1200 } } },
    })
    expect(withProgress.find('.eb-chat-message__progress').exists()).toBe(true)
    expect(withProgress.find('.eb-chat-message__progress-label').text()).toBe('检索知识库')
    expect(withProgress.find('.eb-chat-message__progress').text()).toContain('3 个库')
    expect(withProgress.find('.eb-chat-message__progress').text()).toContain('1.2s')
    withProgress.unmount()

    const without = mount(ChatMessage, {
      props: { message: { id: 'a2', role: 'assistant', content: '正文', status: 'done' } },
    })
    expect(without.find('.eb-chat-message__progress').exists()).toBe(false)
  })
})

describe('useChatEngine progressLog（appendProgress / clearProgress）', () => {
  it('appendProgress 逐条追加轨迹，并联动把最后一项写进当前行 progress', () => {
    const eng = useChatEngine({})
    const m = eng.createAssistantMessage()
    eng.appendProgress(m.id, { label: '理解意图', elapsedMs: 80 })
    eng.appendProgress(m.id, { label: '检索知识库', detail: '命中 12 段' })
    const msg = eng.messages.value[0]
    expect(msg.progressLog).toHaveLength(2)
    expect(msg.progressLog[0]).toMatchObject({ label: '理解意图', elapsedMs: 80 })
    expect(msg.progress).toMatchObject({ label: '检索知识库', detail: '命中 12 段' })
  })

  it('收尾路径全部清轨迹：complete / cancel / error', () => {
    const eng = useChatEngine({})
    const a = eng.createAssistantMessage()
    eng.appendProgress(a.id, { label: 'x' })
    eng.completeMessage(a.id)
    expect(eng.messages.value[0].progressLog).toEqual([])

    const b = eng.createAssistantMessage()
    eng.appendProgress(b.id, { label: 'x' })
    eng.cancelMessage(b.id)
    expect(eng.messages.value[1].progressLog).toEqual([])

    const c = eng.createAssistantMessage()
    eng.appendProgress(c.id, { label: 'x' })
    eng.setMessageError(c.id, 'boom')
    expect(eng.messages.value[2].progressLog).toEqual([])
  })

  it('clearProgress 同时清当前行与轨迹；无 label 的 entry 不入轨迹', () => {
    const eng = useChatEngine({})
    const m = eng.createAssistantMessage()
    eng.appendProgress(m.id, { label: 'x' })
    eng.appendProgress(m.id, { detail: '没标签不算阶段' })
    expect(eng.messages.value[0].progressLog).toHaveLength(1)
    eng.clearProgress(m.id)
    expect(eng.messages.value[0].progress).toBeNull()
    expect(eng.messages.value[0].progressLog).toEqual([])
  })
})

describe('ChatMessage 流水线时间线（progressLog）', () => {
  const log3 = [
    { label: '理解意图', elapsedMs: 80 },
    { label: '检索知识库', detail: '命中 12 段', elapsedMs: 340 },
    { label: '合成答案', elapsedMs: 900 },
  ]

  it('多阶段：默认当前行 + 折叠钮计数；展开后完整轨迹且末条标记当前', async () => {
    const w = mount(ChatMessage, {
      props: { message: { id: 'a1', role: 'assistant', content: '', status: 'streaming', progress: { label: '合成答案' }, progressLog: log3 } },
    })
    // 默认收起：历史阶段不可见，折叠钮给「前 2 个阶段」
    const toggle = w.find('.eb-chat-message__progress-toggle')
    expect(toggle.exists()).toBe(true)
    expect(toggle.text()).toContain('前 2 个阶段')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(w.find('.eb-chat-message__progress-log').exists()).toBe(false)
    expect(w.find('.eb-chat-message__progress-label').text()).toBe('合成答案')

    await toggle.trigger('click')
    expect(w.find('.eb-chat-message__progress-toggle').attributes('aria-expanded')).toBe('true')
    const items = w.findAll('.eb-chat-message__progress-log li')
    expect(items).toHaveLength(3)
    expect(items.at(2).classes()).toContain('is-current')
    expect(items.at(0).text()).toContain('理解意图')
    expect(items.at(1).text()).toContain('340ms')
  })

  it('单阶段：不渲染折叠钮（不做假控件），当前行照常', () => {
    const w = mount(ChatMessage, {
      props: { message: { id: 'a1', role: 'assistant', content: '', status: 'streaming', progress: { label: '检索' }, progressLog: [{ label: '检索' }] } },
    })
    expect(w.find('.eb-chat-message__progress-toggle').exists()).toBe(false)
    expect(w.find('.eb-chat-message__progress-label').text()).toBe('检索')
  })
})
