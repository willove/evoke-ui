import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach } from 'vitest'
import ChatThreads from '../src/components/chatbot/ChatThreads.vue'
import { useChatSessions } from '../src/components/chatbot/useChatSessions'
import { chatLabels } from '../src/components/chatbot/labels'

/**
 * 批 D：多会话编排（useChatSessions）与会话列表（EbChatThreads）
 *
 * 最关键的一条是「流式中切走，回来还在」——这是把每个 thread 挂一个独立
 * engine 实例的理由，也是切走即中断方案做不到的事。
 */

// 断言失败会跳过 unmount，残留节点会让后续用例的 findAll 多算：统一在收尾清干净
afterEach(() => {
  document.body.innerHTML = ''
})

const THREADS = [
  { id: 't1', title: '报表口径', updatedAt: Date.now(), pinned: true },
  { id: 't2', title: '热泉口资料', updatedAt: Date.now() - 864e5 },
  { id: 't3', title: '旧的', updatedAt: Date.now() - 30 * 864e5, archived: true, unread: 3 },
]

function sessionsWith(transport) {
  const onChange = vi.fn()
  const onReject = vi.fn()
  const s = useChatSessions({ initialThreads: THREADS, activeId: 't1', transport, onChange, onReject })
  return { s, onChange, onReject }
}

describe('useChatSessions', () => {
  it('初始 thread 元数据就位，引擎按需惰性创建', () => {
    const { s } = sessionsWith()
    expect(s.threads.value.map((t) => t.id)).toEqual(['t1', 't2', 't3'])
    expect(s.activeId.value).toBe('t1')
    const engine = s.activeEngine.value
    expect(engine).toBeTruthy()
    // 同一个 thread 每次拿到的都是同一实例
    expect(s.engineOf('t1')).toBe(engine)
  })

  it('send 走 active engine；首条消息自动起标题，已有标题则不动', async () => {
    const seen = []
    const { s } = sessionsWith((content, _atts, _ctx, meta) => { seen.push([content, meta.threadId]) })
    s.create({ title: '' })
    const freshId = s.activeId.value
    const longText = '帮我对比一下批 A 的三个组件各自适合什么业务场景与手感差异'
    s.send(longText, [])
    await nextTick()
    expect(seen[0][1]).toBe(freshId)
    const fresh = s.threads.value.find((t) => t.id === freshId)
    // 超过 24 字截断加省略号
    expect(fresh.title).toBe(`${longText.slice(0, 24)}…`)

    s.select('t1')
    s.send('追加一问', [])
    await nextTick()
    expect(s.threads.value.find((t) => t.id === 't1').title).toBe('报表口径')

    // 短文本原样用，不加省略号
    s.create({ title: '' })
    const shortId = s.activeId.value
    s.send('短问题', [])
    await nextTick()
    expect(s.threads.value.find((t) => t.id === shortId).title).toBe('短问题')

    // 全是空白不生成标题，落到「新会话」
    s.create({ title: '' })
    const blankId = s.activeId.value
    await nextTick()
    expect(s.threads.value.find((t) => t.id === blankId).title).toBe('')
  })

  it('切走再切回：各自消息互不串，且流式内容不丢', async () => {
    const releases = []
    const { s } = sessionsWith(async (content, _atts, _ctx, meta) => {
      const engine = s.engineOf(meta.threadId)
      const msg = engine.createAssistantMessage()
      engine.appendContent(msg.id, `答：${content}`)
      // 两个会话并发，各自等自己的放行句柄——共用一个变量会让先发的永远挂着
      await new Promise((r) => releases.push(r))
      engine.completeMessage(msg.id)
    })

    s.select('t1')
    s.send('甲问题', [])
    await nextTick()

    // 流式中切到 t2，t1 的引擎仍在跑
    s.select('t2')
    s.send('乙问题', [])
    await nextTick()
    expect(s.engineOf('t1').messages.value.at(-1)?.status).toBe('streaming')
    expect(s.engineOf('t2').messages.value.at(-1)?.content).toBe('答：乙问题')

    releases.forEach((r) => r())
    await nextTick()
    s.select('t1')
    expect(s.engineOf('t1').messages.value.at(-1)).toMatchObject({ content: '答：甲问题', status: 'done' })
    // 两条会话的消息各自独立
    expect(s.engineOf('t2').messages.value.map((m) => m.content)).not.toContain('答：甲问题')
  })

  it('并发上限：用满时拒绝新会话的 send 并回调原因', async () => {
    const hang = []
    const { s, onReject } = sessionsWith(() => new Promise((r) => hang.push(r)))
    s.maxConcurrentStreaming.value = 1
    s.select('t1')
    expect(s.send('先占一个', [])).toBe(true)
    await nextTick()
    expect(s.streamingIds.value).toContain('t1')

    s.select('t2')
    expect(s.send('第二个', [])).toBe(false)
    expect(onReject).toHaveBeenCalledWith({ threadId: 't2', reason: 'concurrency' })
    // 同一个线程重复发也被 loading 挡住
    s.select('t1')
    expect(s.send('重复', [])).toBe(false)

    // 生成结束：活动标记清空、并发额度释放（列表里的「生成中」点靠这条才会消失）
    hang.forEach((r) => r())
    await nextTick()
    await nextTick()
    expect(s.streamingIds.value).toEqual([])
    expect(s.engineOf('t1').loading.value).toBe(false)
    expect(s.send('结束之后可以再发', [])).toBe(true)
    hang.forEach((r) => r())
  })

  it('create / rename / pin / archive / remove 与 active 兜底', () => {
    const { s, onChange } = sessionsWith()
    const id = s.create()
    expect(s.activeId.value).toBe(id)
    expect(s.visible.value.some((t) => t.id === id)).toBe(true)

    s.rename(id, '改个名')
    expect(s.threads.value.find((t) => t.id === id).title).toBe('改个名')
    s.pin(id)
    expect(s.threads.value.find((t) => t.id === id).pinned).toBe(true)
    s.archive(id)
    expect(s.archived.value.map((t) => t.id)).toContain(id)
    expect(s.visible.value.map((t) => t.id)).not.toContain(id)

    s.select('t1')
    s.remove('t1')
    // 删掉当前会话后自动落到剩下的第一条，不悬空
    expect(s.threads.value.some((t) => t.id === 't1')).toBe(false)
    expect(s.activeId.value).toBe(s.threads.value[0].id)
    expect(onChange.mock.calls.map((c) => c[1])).toContain('remove')
  })

  it('删到空时 activeId 归零，activeEngine 不悬空', () => {
    const { s } = sessionsWith()
    s.remove('t1'); s.remove('t2'); s.remove('t3')
    expect(s.threads.value).toHaveLength(0)
    expect(s.activeId.value).toBe('')
    expect(s.active.value).toBeNull()
    expect(s.activeEngine.value).toBeNull()
  })

  it('snapshot 带出各 thread 的消息，clear 清空', async () => {
    const { s } = sessionsWith((content, _a, _c, meta) => {
      const engine = s.engineOf(meta.threadId)
      const msg = engine.createAssistantMessage()
      engine.appendContent(msg.id, '回应')
      engine.completeMessage(msg.id)
    })
    s.select('t2')
    s.send('问一句', [])
    await nextTick()
    const snap = s.snapshot()
    expect(snap.find((t) => t.id === 't2').messages.map((m) => m.content)).toEqual(['问一句', '回应'])
    s.clear()
    expect(s.threads.value).toHaveLength(0)
    expect(s.activeId.value).toBe('')
  })

  it('select 清未读并回调 select', () => {
    const { s, onChange } = sessionsWith()
    s.select('t3')
    expect(s.threads.value.find((t) => t.id === 't3').unread).toBe(0)
    expect(onChange.mock.calls.at(-1)[1]).toBe('select')
  })
})

describe('ChatThreads', () => {
  const mountList = (props = {}, slots = {}) =>
    mount(ChatThreads, { props: { threads: THREADS, active: 't1', ...props }, slots, attachTo: document.body })

  it('渲染条目；置顶段在前，归档默认隐藏', () => {
    const w = mountList()
    const items = w.findAll('.eb-chat-threads__item')
    expect(items).toHaveLength(2)
    expect(items[0].attributes('data-thread-id')).toBe('t1')
    expect(items[0].classes()).toContain('is-active')
    expect(w.find('.eb-chat-threads__group').text()).toBe(chatLabels.threads.pinned)
    expect(w.text()).not.toContain('旧的')
    expect(w.find('.eb-chat-threads__archived-toggle').text()).toContain('1')
    w.unmount()
  })

  it('展开归档后归档条目出现', async () => {
    const w = mountList()
    await w.find('.eb-chat-threads__archived-toggle').trigger('click')
    expect(w.findAll('.eb-chat-threads__item')).toHaveLength(3)
    expect(w.text()).toContain('旧的')
    w.unmount()
  })

  it('点击条目 emit select；生成中的条目有活动标记', async () => {
    const w = mountList({ streaming: ['t2'] })
    await w.findAll('.eb-chat-threads__trigger')[1].trigger('click')
    expect(w.emitted('select')[0]).toEqual(['t2'])
    expect(w.findAll('.eb-chat-threads__live')).toHaveLength(1)
    w.unmount()
  })

  it('搜索：过滤、emit search、无结果走空态文案', async () => {
    const w = mountList()
    await w.find('.eb-chat-threads__search-input').setValue('热泉')
    expect(w.findAll('.eb-chat-threads__item')).toHaveLength(1)
    expect(w.emitted('search').at(-1)).toEqual(['热泉'])
    await w.find('.eb-chat-threads__search-input').setValue('不存在的词')
    expect(w.find('.eb-chat-threads__empty').text()).toContain(chatLabels.threads.noResult)
    w.unmount()
  })

  it('新建按钮 emit create；showCreate=false 时不出', async () => {
    const w = mountList()
    await w.find('.eb-chat-threads__create').trigger('click')
    expect(w.emitted('create')).toHaveLength(1)
    const w2 = mountList({ showCreate: false, searchable: false })
    expect(w2.find('.eb-chat-threads__create').exists()).toBe(false)
    w2.unmount()
    w.unmount()
  })

  it('重命名：双击进入、Enter 提交、Esc 放弃、空标题忽略', async () => {
    const w = mountList()
    await w.find('.eb-chat-threads__trigger').trigger('dblclick')
    const input = w.find('.eb-chat-threads__rename')
    expect(input.exists()).toBe(true)
    await input.setValue('新名字')
    await input.trigger('keydown', { key: 'Enter' })
    expect(w.emitted('rename')[0]).toEqual(['t1', '新名字'])

    await w.find('.eb-chat-threads__trigger').trigger('dblclick')
    await w.find('.eb-chat-threads__rename').trigger('keydown', { key: 'Escape' })
    expect(w.find('.eb-chat-threads__rename').exists()).toBe(false)
    expect(w.emitted('rename')).toHaveLength(1)

    await w.find('.eb-chat-threads__trigger').trigger('dblclick')
    await w.find('.eb-chat-threads__rename').setValue('   ')
    await w.find('.eb-chat-threads__rename').trigger('keydown', { key: 'Enter' })
    // 空标题视为放弃，不能把会话改成无名条目
    expect(w.emitted('rename')).toHaveLength(1)
    w.unmount()
  })

  it('更多菜单：置顶 / 归档 / 删除各带正确参数，操作后菜单收起', async () => {
    const w = mountList()
    const more = w.findAll('.eb-chat-threads__more')[0]
    await more.trigger('click')
    expect(more.attributes('aria-expanded')).toBe('true')
    const items = w.findAll('.eb-chat-threads__menu-item')
    await items[0].trigger('click') // 重命名
    expect(w.find('.eb-chat-threads__rename').exists()).toBe(true)
    expect(w.find('.eb-chat-threads__menu').exists()).toBe(false)

    await w.findAll('.eb-chat-threads__more')[1].trigger('click')
    const menuItems = w.findAll('.eb-chat-threads__menu-item')
    await menuItems[1].trigger('click')
    expect(w.emitted('pin')[0]).toEqual(['t2', true])
    await w.findAll('.eb-chat-threads__more')[1].trigger('click')
    await w.findAll('.eb-chat-threads__menu-item')[3].trigger('click')
    expect(w.emitted('remove')[0]).toEqual(['t2'])
    w.unmount()
  })

  it('renamable / removable 关掉后菜单相应收敛', async () => {
    const w = mountList({ renamable: false, removable: false })
    await w.findAll('.eb-chat-threads__more')[0].trigger('click')
    const labels = w.findAll('.eb-chat-threads__menu-item').map((n) => n.text())
    expect(labels).not.toContain(chatLabels.threads.renamed)
    expect(labels).not.toContain(chatLabels.threads.remove)
    // t1 本身是置顶态，菜单项因此是「取消置顶」
    expect(labels).toContain(chatLabels.threads.unpin)
    w.unmount()
  })

  it('未读角标渲染，超过 99 折叠为 99+', async () => {
    const w = mountList({ threads: [{ id: 'a', title: 'x', unread: 120 }, { id: 'b', title: 'y', unread: 5 }] })
    const badges = w.findAll('.eb-chat-threads__unread').map((n) => n.text())
    expect(badges).toEqual(['99+', '5'])
    w.unmount()
  })

  it('#item 插槽整条接管，itemProps 可回落默认渲染', async () => {
    const seen = []
    const w = mountList({}, {
      item: (p) => {
        seen.push({ id: p.thread.id, isActive: p.isActive, keys: Object.keys(p.itemProps).sort().join(',') })
        return h('div', { class: 'probe-row' }, p.thread.title)
      },
    })
    expect(w.findAll('.probe-row')).toHaveLength(2)
    expect(w.findAll('.eb-chat-threads__item')).toHaveLength(0)
    expect(seen[0]).toMatchObject({ id: 't1', isActive: true })
    expect(seen[0].keys).toBe('isActive,isStreaming,thread')
    w.unmount()
  })
})
