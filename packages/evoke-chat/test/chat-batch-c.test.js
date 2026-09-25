import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ChatToolCall from '../src/components/chatbot/ChatToolCall.vue'
import ChatMessage from '../src/components/chatbot/ChatMessage.vue'
import Chatbot from '../src/components/chatbot/Chatbot.vue'
import { useChatEngine } from '../src/components/chatbot/useChatEngine'
import { chatLabels } from '../src/components/chatbot/labels'

/**
 * 批 C：工具调用卡与引擎状态机
 */

describe('ChatToolCall', () => {
  it('四种状态渲染对应文案与标记', () => {
    const cases = [
      ['pending', chatLabels.tool.pending],
      ['running', chatLabels.tool.running],
      ['done', chatLabels.tool.done],
      ['error', chatLabels.tool.error],
    ]
    for (const [status, text] of cases) {
      const w = mount(ChatToolCall, { props: { toolCall: { id: 't', name: 'search', status } } })
      expect(w.find('.eb-chat-tool-call__status').text()).toBe(text)
      expect(w.classes()).toContain(`is-${status}`)
      w.unmount()
    }
  })

  it('label 覆盖 name；无 label 时用 name，都没有时兜底', () => {
    expect(mount(ChatToolCall, { props: { toolCall: { name: 'web_search', label: '搜索网页', status: 'done' } } }).find('.eb-chat-tool-call__name').text()).toBe('搜索网页')
    expect(mount(ChatToolCall, { props: { toolCall: { name: 'web_search', status: 'done' } } }).find('.eb-chat-tool-call__name').text()).toBe('web_search')
    expect(mount(ChatToolCall, { props: { toolCall: { status: 'done' } } }).find('.eb-chat-tool-call__name').text()).toBe(chatLabels.tool.fallback)
  })

  it('无参数无结果不可展开；失败态始终可展开看错误', () => {
    const bare = mount(ChatToolCall, { props: { toolCall: { id: 't', name: 'x', status: 'done' } } })
    expect(bare.find('.eb-chat-tool-call__header').attributes('disabled')).toBeDefined()
    const err = mount(ChatToolCall, { props: { toolCall: { id: 't', name: 'x', status: 'error', error: '上游 500' } } })
    expect(err.find('.eb-chat-tool-call__header').attributes('disabled')).toBeUndefined()
    expect(err.find('.eb-chat-tool-call__pre--error').text()).toBe('上游 500')
  })

  it('streaming：自动展开盯跑并显示输出光标；收尾后光标消失、回到折叠态', async () => {
    const base = { id: 't', name: 'run_tests', status: 'running', args: { cmd: 'pnpm test' } }
    const w = mount(ChatToolCall, {
      props: { toolCall: { ...base, result: 'running 1 test…', streaming: true } },
    })
    await w.vm.$nextTick()
    // 流式输出期间自动展开（用户没点过），光标夹在已流出文本末尾
    expect(w.find('.eb-chat-tool-call__header').attributes('aria-expanded')).toBe('true')
    expect(w.find('.eb-chat-tool-call__body').attributes('style') ?? '').not.toContain('display: none')
    expect(w.find('.eb-chat-tool-call__caret').exists()).toBe(true)
    expect(w.findAll('.eb-chat-tool-call__pre')[1].text()).toContain('running 1 test…')

    await w.setProps({ toolCall: { ...base, status: 'done', result: 'running 1 test…\n✓ passes', streaming: false } })
    await w.vm.$nextTick()
    expect(w.find('.eb-chat-tool-call__caret').exists()).toBe(false)
    // 用户没手动开合过：收尾回到折叠态（isVisible 在 jsdom 下不可靠，直接看 aria 与内联样式）
    expect(w.find('.eb-chat-tool-call__header').attributes('aria-expanded')).toBe('false')
    expect(w.find('.eb-chat-tool-call__body').attributes('style')).toContain('display: none')
  })

  it('streaming：用户手动开合过就尊重用户，收尾不自动收起', async () => {
    const base = { id: 't', name: 'x', status: 'running', args: { a: 1 } }
    const w = mount(ChatToolCall, {
      props: { toolCall: { ...base, result: 'out', streaming: true } },
    })
    await w.find('.eb-chat-tool-call__header').trigger('click')  // 用户收起
    await w.setProps({ toolCall: { ...base, status: 'done', result: 'out', streaming: false } })
    await w.vm.$nextTick()
    expect(w.find('.eb-chat-tool-call__header').attributes('aria-expanded')).toBe('false')
  })

  it('子调用：递归渲染 + 头部计数；深度到顶不再往下', () => {
    const parent = {
      id: 'p1', name: 'fetch_page', status: 'done', result: '页面正文',
      subCalls: [{ id: 'c1', name: 'parse_html', status: 'done', result: '正文 1.2k 字' }],
    }
    const w = mount(ChatToolCall, { props: { toolCall: parent, expanded: true } })
    expect(w.find('.eb-chat-tool-call__subcount').text()).toBe('1')
    const titles = w.findAll('.eb-chat-tool-call__section-title').map((t) => t.text())
    expect(titles).toContain(chatLabels.tool.subCalls(1))
    const nested = w.findAll('.eb-chat-tool-call')
    expect(nested).toHaveLength(2)
    expect(nested[1].find('.eb-chat-tool-call__name').text()).toBe('parse_html')
    expect(nested[1].find('.eb-chat-tool-call__pre').text()).toContain('正文 1.2k 字')

    // 深度到顶：不再渲染子层（引擎侧同样限制在 16 层）
    const deep = mount(ChatToolCall, { props: { toolCall: parent, expanded: true, depth: 16 } })
    expect(deep.findAll('.eb-chat-tool-call')).toHaveLength(1)
    expect(deep.find('.eb-chat-tool-call__subcount').text()).toBe('1')
  })

  it('自引用数据不无限递归：深度上限兜底', () => {
    const node = { id: 'x', name: 'loop', status: 'running', args: { a: 1 } }
    node.subCalls = [node]
    const w = mount(ChatToolCall, { props: { toolCall: node, expanded: true } })
    expect(w.findAll('.eb-chat-tool-call').length).toBeLessThanOrEqual(17)
  })

  it('展开后参数与结果各自成段，对象走 JSON 缩进', async () => {
    const w = mount(ChatToolCall, { props: { toolCall: { id: 't', name: 'x', status: 'done', args: { q: 'a' }, result: { hits: 2 } } } })
    const header = w.find('.eb-chat-tool-call__header')
    expect(header.attributes('aria-expanded')).toBe('false')
    expect(header.attributes('aria-controls')).toBe(w.find('.eb-chat-tool-call__body').attributes('id'))
    await header.trigger('click')
    expect(header.attributes('aria-expanded')).toBe('true')
    const pres = w.findAll('.eb-chat-tool-call__pre')
    expect(pres[0].text()).toContain('"q": "a"')
    expect(pres[1].text()).toContain('"hits": 2')
    expect(w.emitted('toggle')[0]).toEqual([w.props('toolCall'), true])
  })

  it('字符串 result 原样展示，不额外加引号', () => {
    const w = mount(ChatToolCall, { props: { toolCall: { id: 't', name: 'x', status: 'done', result: '纯文本输出' }, expanded: true } })
    expect(w.find('.eb-chat-tool-call__pre').text()).toBe('纯文本输出')
  })

  it('循环引用的参数不炸渲染', () => {
    const args = { a: 1 }
    args.self = args
    const w = mount(ChatToolCall, { props: { toolCall: { id: 't', name: 'x', status: 'pending', args }, expanded: true } })
    expect(w.find('.eb-chat-tool-call__pre').text()).toContain('[Circular]')
  })

  it('重试钮只在失败态出现，retryable 可关', async () => {
    const done = mount(ChatToolCall, { props: { toolCall: { id: 't', name: 'x', status: 'done', result: 'ok' }, expanded: true } })
    expect(done.find('.eb-chat-tool-call__retry').exists()).toBe(false)
    const failed = mount(ChatToolCall, { props: { toolCall: { id: 't', name: 'x', status: 'error', error: 'e' }, expanded: true } })
    await failed.find('.eb-chat-tool-call__retry').trigger('click')
    expect(failed.emitted('retry')[0][0].id).toBe('t')
    const off = mount(ChatToolCall, { props: { toolCall: { id: 't', name: 'x', status: 'error', error: 'e' }, expanded: true, retryable: false } })
    expect(off.find('.eb-chat-tool-call__retry').exists()).toBe(false)
  })

  it('cancelled：中断态用停止标记与「已停止」文案，不给重试钮', () => {
    const w = mount(ChatToolCall, {
      props: { toolCall: { id: 't', name: 'run_tests', status: 'cancelled', args: { cmd: 'pnpm test' }, result: '半截输出' }, expanded: true },
    })
    expect(w.classes()).toContain('is-cancelled')
    expect(w.find('.eb-chat-tool-call__status').text()).toBe(chatLabels.tool.cancelled)
    // 转圈的圆点必须停：中断后还转就是骗人
    expect(w.find('.eb-chat-tool-call__dot').exists()).toBe(false)
    expect(w.find('.eb-chat-tool-call__retry').exists()).toBe(false)
    expect(w.findAll('.eb-chat-tool-call__pre')[1].text()).toContain('半截输出')
  })

  it('error：折叠态直接给错误首行，不展开也知道为什么失败', () => {
    const w = mount(ChatToolCall, {
      props: { toolCall: { id: 't', name: 'x', status: 'error', error: '上游 500：连接被拒绝\n第二行不该出现' } },
    })
    const hint = w.find('.eb-chat-tool-call__hint')
    expect(hint.text()).toContain('上游 500：连接被拒绝')
    expect(hint.text()).not.toContain('第二行')
    const long = mount(ChatToolCall, {
      props: { toolCall: { id: 't', name: 'x', status: 'error', error: 'x'.repeat(120) } },
    })
    expect(long.find('.eb-chat-tool-call__hint').text().length).toBeLessThanOrEqual(61)
  })

  it('#args / #result 插槽可替换默认 pre', () => {
    const w = mount(ChatToolCall, {
      props: { toolCall: { id: 't', name: 'x', status: 'done', args: { q: 1 }, result: 'r' }, expanded: true },
      slots: { args: '<div class="mine">自定义参数</div>', result: '<div class="mine2">自定义结果</div>' },
    })
    expect(w.find('.mine').text()).toBe('自定义参数')
    expect(w.find('.mine2').text()).toBe('自定义结果')
    expect(w.findAll('.eb-chat-tool-call__pre')).toHaveLength(0)
  })
})

describe('useChatEngine 工具调用状态机', () => {
  function seeded() {
    const eng = useChatEngine({})
    const m = eng.createAssistantMessage()
    return { eng, m }
  }

  it('startToolCall 新建并转 running，带已存在 id 则复用', () => {
    const { eng, m } = seeded()
    const id = eng.startToolCall(m.id, { name: 'search', args: { q: 'x' } })
    expect(eng.messages.value[0].toolCalls).toHaveLength(1)
    expect(eng.messages.value[0].toolCalls[0]).toMatchObject({ id, name: 'search', status: 'running' })
    eng.startToolCall(m.id, { id })
    expect(eng.messages.value[0].toolCalls).toHaveLength(1)
    expect(eng.messages.value[0].toolCalls[0].status).toBe('running')
  })

  it('completeToolCall 写入结果并算耗时', async () => {
    const { eng, m } = seeded()
    const id = eng.startToolCall(m.id, { name: 'search' })
    await new Promise((r) => setTimeout(r, 15))
    eng.completeToolCall(m.id, id, { hits: 3 })
    const tc = eng.messages.value[0].toolCalls[0]
    expect(tc.status).toBe('done')
    expect(tc.result).toEqual({ hits: 3 })
    expect(tc.duration).toBeGreaterThan(0)
  })

  it('未 start 直接 complete：耗时为 0 但状态与结果照写', () => {
    const { eng, m } = seeded()
    const tc = eng.addToolCall(m.id, { name: 'x' })
    eng.completeToolCall(m.id, tc.id, 'ok')
    expect(eng.messages.value[0].toolCalls[0]).toMatchObject({ status: 'done', result: 'ok', duration: 0 })
  })

  it('appendToolCallResult：逐片累积并转 running/streaming', () => {
    const { eng, m } = seeded()
    const id = eng.startToolCall(m.id, { name: 'run_tests' })
    eng.appendToolCallResult(m.id, id, 'running 1 test\n')
    eng.appendToolCallResult(m.id, id, '✓ passes\n')
    const tc = eng.messages.value[0].toolCalls[0]
    expect(tc.result).toBe('running 1 test\n✓ passes\n')
    expect(tc).toMatchObject({ id, status: 'running', streaming: true })
  })

  it('appendToolCallResult：complete 省略 result 时保留已流出的输出', () => {
    const { eng, m } = seeded()
    const id = eng.startToolCall(m.id, { name: 'run_tests' })
    eng.appendToolCallResult(m.id, id, '半截输出')
    eng.completeToolCall(m.id, id)
    expect(eng.messages.value[0].toolCalls[0]).toMatchObject({
      status: 'done', streaming: false, result: '半截输出',
    })
  })

  it('appendToolCallResult：终态与未知 id 不再接收增量', () => {
    const { eng, m } = seeded()
    const id = eng.startToolCall(m.id, { name: 'x' })
    eng.completeToolCall(m.id, id, 'done output')
    expect(eng.appendToolCallResult(m.id, id, 'late')).toBeNull()
    expect(eng.messages.value[0].toolCalls[0].result).toBe('done output')
    expect(eng.appendToolCallResult(m.id, 'missing', 'x')).toBeNull()
  })

  it('addSubToolCall：挂子调用，按 id 递归流式/收尾', () => {
    const { eng, m } = seeded()
    const parent = eng.startToolCall(m.id, { name: 'fetch_page' })
    const child = eng.addSubToolCall(m.id, parent, { name: 'parse_html' })
    expect(eng.messages.value[0].toolCalls[0].subCalls.map((t) => t.name)).toEqual(['parse_html'])

    expect(eng.appendToolCallResult(m.id, child, '半截')).toBe(child)
    eng.completeToolCall(m.id, child)
    expect(eng.findToolCall(m.id, child)).toMatchObject({ status: 'done', streaming: false, result: '半截' })
    // 父不存在 / 未知 id → null，不抛
    expect(eng.addSubToolCall(m.id, 'nope', { name: 'x' })).toBeNull()
    expect(eng.findToolCall(m.id, 'nope')).toBeNull()
  })

  it('cancelMessage：递归把在跑的子调用也落 cancelled，已完成的子调用不动', () => {
    const { eng, m } = seeded()
    const parent = eng.startToolCall(m.id, { name: 'fetch_page' })
    const doneChild = eng.addSubToolCall(m.id, parent, { name: 'cached' })
    const liveChild = eng.addSubToolCall(m.id, parent, { name: 'parse_html' })
    eng.completeToolCall(m.id, doneChild, 'ok')

    eng.cancelMessage(m.id)
    const tree = eng.messages.value[0].toolCalls[0]
    expect(tree.status).toBe('cancelled')
    expect(tree.subCalls.find((t) => t.id === doneChild).status).toBe('done')
    expect(tree.subCalls.find((t) => t.id === liveChild).status).toBe('cancelled')
    // 中断后子调用的迟到回写也被拒
    expect(eng.appendToolCallResult(m.id, liveChild, '更多')).toBeNull()
  })

  it('addSubToolCall：深度到 16 层封顶，不再往下挂', () => {
    const { eng, m } = seeded()
    let parent = eng.startToolCall(m.id, { name: 'root' })
    let depth = 0
    while (depth < 40) {
      const child = eng.addSubToolCall(m.id, parent, { name: `lvl${depth}` })
      if (!child) break
      parent = child
      depth += 1
    }
    expect(depth).toBe(16)
  })

  it('cancelMessage：在跑的工具调用落 cancelled，不再转圈也不接收增量', () => {
    const { eng, m } = seeded()
    const running = eng.startToolCall(m.id, { name: 'run_tests' })
    eng.appendToolCallResult(m.id, running, '跑到一半')
    const settled = eng.startToolCall(m.id, { name: 'already_done' })
    eng.completeToolCall(m.id, settled, 'ok')

    eng.cancelMessage(m.id)
    const [a, b] = eng.messages.value[0].toolCalls
    expect(a).toMatchObject({ status: 'cancelled', streaming: false })
    // 已经完成的调用不被追溯改写
    expect(b.status).toBe('done')
    // 中断后主机迟到的回写不能把它拽回 running/done
    expect(eng.appendToolCallResult(m.id, running, '更多')).toBeNull()
    eng.completeToolCall(m.id, running, '迟到的结果')
    eng.failToolCall(m.id, running, '迟到的失败')
    expect(eng.messages.value[0].toolCalls[0]).toMatchObject({ status: 'cancelled', result: '跑到一半' })
  })

  it('failToolCall 接 Error 取 message，接字符串原样', () => {
    const { eng, m } = seeded()
    const a = eng.addToolCall(m.id, { name: 'x' })
    const b = eng.addToolCall(m.id, { name: 'y' })
    eng.failToolCall(m.id, a.id, new Error('上游 500'))
    eng.failToolCall(m.id, b.id, '超时')
    const [t1, t2] = eng.messages.value[0].toolCalls
    expect(t1).toMatchObject({ status: 'error', error: '上游 500' })
    expect(t2).toMatchObject({ status: 'error', error: '超时' })
  })

  it('updateToolCall 局部改；找不到消息或调用不抛', () => {
    const { eng, m } = seeded()
    const tc = eng.addToolCall(m.id, { name: 'x' })
    eng.updateToolCall(m.id, tc.id, { label: '搜索网页' })
    expect(eng.messages.value[0].toolCalls[0].label).toBe('搜索网页')
    eng.addToolCall('nope', { name: 'x' })
    eng.startToolCall('nope', { name: 'x' })
    eng.updateToolCall(m.id, 'nope', { label: 'x' })
    expect(eng.messages.value[0].toolCalls).toHaveLength(1)
  })

  it('工具调用不影响消息状态机', () => {
    const { eng, m } = seeded()
    const id = eng.startToolCall(m.id, { name: 'x' })
    eng.completeToolCall(m.id, id, 'ok')
    eng.appendContent(m.id, '回答')
    eng.completeMessage(m.id)
    expect(eng.messages.value[0]).toMatchObject({ status: 'done', content: '回答' })
    expect(eng.messages.value[0].toolCalls[0].status).toBe('done')
  })
})

describe('ChatMessage 工具卡分组', () => {
  const calls = [
    { id: 't1', name: 'search', status: 'done', result: 'a' },
    { id: 't2', name: 'calc', status: 'error', error: 'e' },
  ]

  it('多个才出组标题，单个不出', () => {
    const many = mount(ChatMessage, { props: { message: { id: 'a', role: 'assistant', status: 'done', content: 'x', toolCalls: calls } } })
    expect(many.find('.eb-chat-message__tools-heading').text()).toBe(chatLabels.tool.group(2))
    expect(many.findAllComponents(ChatToolCall)).toHaveLength(2)
    const one = mount(ChatMessage, { props: { message: { id: 'a', role: 'assistant', status: 'done', content: 'x', toolCalls: [calls[0]] } } })
    expect(one.find('.eb-chat-message__tools-heading').exists()).toBe(false)
  })

  it('组标题：跑着说「正在执行」并带流光，跑完结算总用时', () => {
    const live = mount(ChatMessage, {
      props: {
        message: {
          id: 'a', role: 'assistant', status: 'streaming', content: 'x',
          toolCalls: [
            { id: 't1', name: 'search', status: 'running', result: '…' },
            { id: 't2', name: 'calc', status: 'pending' },
          ],
        },
      },
    })
    const liveHeading = live.find('.eb-chat-message__tools-heading')
    expect(liveHeading.text()).toBe(chatLabels.tool.groupRunning(2))
    expect(liveHeading.find('.eb-chat-shimmer').exists()).toBe(true)

    const done = mount(ChatMessage, {
      props: {
        message: {
          id: 'a', role: 'assistant', status: 'done', content: 'x',
          toolCalls: [
            { id: 't1', name: 'search', status: 'done', duration: 1200 },
            { id: 't2', name: 'calc', status: 'done', duration: 800 },
          ],
        },
      },
    })
    const doneHeading = done.find('.eb-chat-message__tools-heading')
    expect(doneHeading.text()).toContain(chatLabels.tool.group(2))
    expect(doneHeading.text()).toContain('2.0s')
    expect(doneHeading.find('.eb-chat-shimmer').exists()).toBe(false)
  })

  it('tool-retry 交出 (toolCall, message) 两参', async () => {
    const w = mount(ChatMessage, { props: { message: { id: 'a', role: 'assistant', status: 'done', content: 'x', toolCalls: calls } } })
    const failing = w.findAllComponents(ChatToolCall)[1]
    await failing.find('.eb-chat-tool-call__header').trigger('click')
    await failing.find('.eb-chat-tool-call__retry').trigger('click')
    const evt = w.emitted('tool-retry')
    expect(evt[0][0].id).toBe('t2')
    expect(evt[0][1].id).toBe('a')
  })

  it('工具卡排在正文之前（先执行再作答）', () => {
    const w = mount(ChatMessage, { props: { message: { id: 'a', role: 'assistant', status: 'done', content: '回答', toolCalls: [calls[0]] } } })
    const content = w.find('.eb-chat-message__content')
    expect(content.element.children[0].className).toContain('eb-chat-message__tools')
    expect(content.element.children[1].className).toContain('eb-chat-message__bubble')
  })
})

describe('Chatbot 工具卡转发', () => {
  it('tool-retry 一路到根且保留两参', async () => {
    const w = mount(Chatbot, {
      props: {
        showTip: false,
        modelValue: [{ id: 'a1', role: 'assistant', status: 'done', content: 'x', toolCalls: [{ id: 't2', name: 'calc', status: 'error', error: 'e' }] }],
      },
    })
    await nextTick()
    await w.find('.eb-chat-tool-call__header').trigger('click')
    await w.find('.eb-chat-tool-call__retry').trigger('click')
    const evt = w.emitted('tool-retry')
    expect(evt[0][0].id).toBe('t2')
    expect(evt[0][1].id).toBe('a1')
  })
})
