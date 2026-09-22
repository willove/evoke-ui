import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import ChatPlan from '../src/components/chatbot/ChatPlan.vue'
import ChatConfirmation from '../src/components/chatbot/ChatConfirmation.vue'
import EbIcon from '../../evoke-business-ui/src/components/icon/index.vue'
import ChatArtifact from '../src/components/chatbot/ChatArtifact.vue'
import ChatMessage from '../src/components/chatbot/ChatMessage.vue'
import Chatbot from '../src/components/chatbot/Chatbot.vue'
import { useChatEngine } from '../src/components/chatbot/useChatEngine'
import { chatLabels } from '../src/components/chatbot/labels'

/**
 * 批 F：agent 三件套——计划 / 人工确认门 / 产物
 *
 * 三者共同点是「不是一次问答，而是一次受控执行」：计划要摊开进度、
 * 关键动作前要拿到批准、产出的文件要能带走。
 */

const PLAN = {
  title: '对齐季度口径',
  steps: [
    { id: 's1', label: '拉取两张表', status: 'done', duration: 820 },
    { id: 's2', label: '比对差异', status: 'running' },
    { id: 's3', label: '输出报告', status: 'pending' },
  ],
}

describe('ChatPlan', () => {
  it('头部给标题与进度；执行中默认展开', () => {
    const w = mount(ChatPlan, { props: { plan: PLAN } })
    expect(w.find('.eb-chat-plan__title').text()).toBe('对齐季度口径')
    expect(w.find('.eb-chat-plan__progress').text()).toBe(chatLabels.plan.progress(1, 3))
    expect(w.find('.eb-chat-plan__header').attributes('aria-expanded')).toBe('true')
    expect(w.findAll('.eb-chat-plan__step')).toHaveLength(3)
  })

  it('每步渲染状态文案与耗时，当前步高亮', () => {
    const w = mount(ChatPlan, { props: { plan: PLAN } })
    const steps = w.findAll('.eb-chat-plan__step')
    expect(steps[0].classes()).toContain('is-done')
    expect(steps[0].text()).toContain('820ms')
    expect(steps[1].classes()).toContain('is-current')
    expect(steps[1].text()).toContain(chatLabels.plan.status.running)
    expect(steps[2].text()).toContain(chatLabels.plan.status.pending)
  })

  it('失败步在头部标出，且不静默', () => {
    const w = mount(ChatPlan, {
      props: { plan: { steps: [{ id: 'a', label: 'x', status: 'error' }] } },
    })
    expect(w.find('.eb-chat-plan__failed').text()).toBe(chatLabels.plan.status.error)
    expect(w.find('.eb-chat-plan__step').classes()).toContain('is-error')
  })

  it('折叠切换带 aria-expanded 与 toggle 事件；受控时不动内部态', async () => {
    const w = mount(ChatPlan, { props: { plan: PLAN, expanded: true } })
    const header = w.find('.eb-chat-plan__header')
    await header.trigger('click')
    expect(w.emitted('toggle')[0]).toEqual([PLAN, false])
    // 受控：父没回写，面板照旧展开
    expect(header.attributes('aria-expanded')).toBe('true')
    w.unmount()

    const free = mount(ChatPlan, { props: { plan: { steps: [{ id: 'a', label: 'x', status: 'done' }] } } })
    await free.find('.eb-chat-plan__header').trigger('click')
    expect(free.find('.eb-chat-plan__header').attributes('aria-expanded')).toBe('false')
    free.unmount()
  })

  it('点击步骤抛 (step, index)；空计划给占位', async () => {
    const w = mount(ChatPlan, { props: { plan: PLAN } })
    await w.findAll('.eb-chat-plan__trigger')[1].trigger('click')
    expect(w.emitted('step-click')[0]).toEqual([PLAN.steps[1], 1])
    const empty = mount(ChatPlan, { props: { plan: { steps: [] } } })
    expect(empty.find('.eb-chat-plan__empty').text()).toBe(chatLabels.plan.empty)
  })

  it('#step 插槽逐条接管', () => {
    const w = mount(ChatPlan, {
      props: { plan: PLAN },
      slots: { step: (p) => h('div', { class: 'my-step' }, `${p.index}:${p.step.label}:${p.isCurrent}`) },
    })
    const rows = w.findAll('.my-step')
    expect(rows).toHaveLength(3)
    expect(rows[1].text()).toBe('1:比对差异:true')
    expect(w.findAll('.eb-chat-plan__trigger')).toHaveLength(0)
  })
})

describe('ChatConfirmation', () => {
  /** 只取动作按钮里的图标名（卡片头部还有状态图标，别混进来） */
  const btnIcons = (w) => w.findAll('.eb-chat-confirmation__btn').map((b) => b.findComponent(EbIcon).props('name'))

  const base = {
    id: 'c1',
    title: '即将删除 3 个文件',
    description: '此操作不可撤销',
    actions: [
      { key: 'approve', label: '批准', type: 'primary', icon: 'check-circle', status: 'approved' },
      { key: 'reject', label: '拒绝', type: 'danger', icon: 'close-circle', status: 'rejected' },
    ],
    status: 'pending',
  }

  it('待确认：按钮可用、给出提示、状态徽标正确', () => {
    const w = mount(ChatConfirmation, { props: { confirmation: base } })
    expect(w.find('.eb-chat-confirmation__title').text()).toBe('即将删除 3 个文件')
    expect(w.find('.eb-chat-confirmation__desc').text()).toBe('此操作不可撤销')
    expect(w.find('.eb-chat-confirmation__badge').text()).toBe(chatLabels.confirmation.status.pending)
    expect(w.findAll('.eb-chat-confirmation__btn')).toHaveLength(2)
    expect(w.find('.eb-chat-confirmation__foot').text()).toBe(chatLabels.confirmation.hint)
    expect(w.findAll('.eb-chat-confirmation__btn')[0].attributes('disabled')).toBeUndefined()
  })

  it('选中后那颗换成对勾图标（选了哪个比动作本身更该被看见）', () => {
    const w = mount(ChatConfirmation, {
      props: { confirmation: { ...base, status: 'approved', responseKey: 'reject' } },
    })
    // 拒绝那颗已选中 → 换对勾；批准那颗仍是自己的图标
    expect(btnIcons(w)).toEqual(['check-circle', 'check'])
    w.unmount()
  })

  it('点动作抛 (confirmation, key)；type 映射到类名', async () => {
    const w = mount(ChatConfirmation, { props: { confirmation: base } })
    const btns = w.findAll('.eb-chat-confirmation__btn')
    // 外观由库内 EbButton 承担：type 落在 eb-button--<type> 上（组件侧不再自绘 is-primary/is-danger）
    expect(btns[0].classes()).toContain('eb-button--primary')
    expect(btns[1].classes()).toContain('eb-button--danger')
    // 动作图标走 EbButton 的 icon（库内图标名）
    expect(btnIcons(w)).toEqual(['check-circle', 'close-circle'])
    await btns[1].trigger('click')
    expect(w.emitted('respond')[0]).toEqual([base, 'reject'])
  })

  it('已响应：按钮禁用、标出所选、脚注换成结论', () => {
    const w = mount(ChatConfirmation, {
      props: { confirmation: { ...base, status: 'rejected', responseKey: 'reject' } },
    })
    expect(w.find('.eb-chat-confirmation__badge').text()).toBe(chatLabels.confirmation.status.rejected)
    expect(w.classes()).toContain('is-rejected')
    expect(w.findAll('.eb-chat-confirmation__btn').every((b) => b.attributes('disabled') !== undefined)).toBe(true)
    expect(w.find('.eb-chat-confirmation__btn.is-chosen').text()).toContain('拒绝')
    expect(w.find('.eb-chat-confirmation__foot').text()).toBe(chatLabels.confirmation.responded('拒绝'))
  })

  it('超时是独立形态，不与已拒绝混淆', () => {
    const w = mount(ChatConfirmation, {
      props: { confirmation: { ...base, status: 'expired' } },
    })
    expect(w.find('.eb-chat-confirmation__badge').text()).toBe(chatLabels.confirmation.status.expired)
    expect(w.classes()).toContain('is-expired')
    expect(w.classes()).not.toContain('is-rejected')
  })

  it('无 actions 时不渲染按钮区', () => {
    const w = mount(ChatConfirmation, { props: { confirmation: { title: 'x', status: 'pending' } } })
    expect(w.findAll('.eb-chat-confirmation__btn')).toHaveLength(0)
  })
})

describe('ChatArtifact', () => {
  const ARTIFACTS = [
    { id: 'a1', title: 'report.md', type: 'markdown', content: '# 报告\n内容' },
    { id: 'a2', title: 'data.csv', type: 'table', url: 'https://example.com/data.csv', size: 2048 },
    { id: 'a3', title: 'chart.png' },
  ]

  it('逐条渲染标题与元信息，类型决定图标', () => {
    const w = mount(ChatArtifact, { props: { artifacts: ARTIFACTS } })
    const cards = w.findAll('.eb-chat-artifact')
    expect(cards).toHaveLength(3)
    expect(cards[0].text()).toContain('report.md')
    // 元信息是「语言 · 体积」：类型由图标表达，不重复成文字
    expect(cards[0].find('.eb-chat-artifact__meta').text()).toContain('B')
    expect(cards[1].text()).toContain('2.0 KB')
    expect(cards[2].find('.eb-chat-artifact__meta').exists()).toBe(false)
  })

  it('给了 language 时代码产物显示语言名', () => {
    const w = mount(ChatArtifact, {
      props: { artifacts: [{ id: 'c', title: 'index.ts', type: 'code', language: 'typescript', content: 'const a = 1' }] },
    })
    expect(w.find('.eb-chat-artifact__meta').text()).toContain('typescript')
    // 类型认不出来时按扩展名回落图标，不空着
    const byExt = mount(ChatArtifact, { props: { artifacts: [{ id: 'z', title: 'a.ts', type: 'unknown-thing' }] } })
    expect(byExt.find('.eb-chat-artifact__icon svg').exists()).toBe(true)
  })

  it('查看抛 open；复制写剪贴板并抛 copy 后显示回执', async () => {
    const w = mount(ChatArtifact, { props: { artifacts: ARTIFACTS } })
    await w.findAll('.eb-chat-artifact__act')[0].trigger('click')
    expect(w.emitted('open')[0][0].id).toBe('a1')

    const desc = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    try {
      await w.findAll('.eb-chat-artifact__act')[1].trigger('click')
      await new Promise((r) => setTimeout(r, 0))
      expect(writeText).toHaveBeenCalledWith('# 报告\n内容')
      expect(w.emitted('copy')[0][0].id).toBe('a1')
      expect(w.findAll('.eb-chat-artifact__act')[1].attributes('aria-label')).toBe(chatLabels.artifact.copied)
    } finally {
      if (desc) Object.defineProperty(navigator, 'clipboard', desc)
      else delete navigator.clipboard
    }
  })

  it('只有 url 的产物给下载链接，且带 download 文件名', () => {
    const w = mount(ChatArtifact, { props: { artifacts: [ARTIFACTS[1]] } })
    const link = w.find('a.eb-chat-artifact__act')
    expect(link.attributes('href')).toBe('https://example.com/data.csv')
    expect(link.attributes('download')).toBe('data.csv')
    // 无 content 的条目不出现复制钮
    expect(w.findAll('button.eb-chat-artifact__act')).toHaveLength(1)
  })

  it('空列表不渲染容器；#artifact 插槽整条接管', () => {
    expect(mount(ChatArtifact, { props: { artifacts: [] } }).find('.eb-chat-artifacts').exists()).toBe(false)
    const w = mount(ChatArtifact, {
      props: { artifacts: ARTIFACTS },
      slots: { artifact: (p) => h('div', { class: 'my-artifact' }, p.artifact.title) },
    })
    expect(w.findAll('.my-artifact')).toHaveLength(3)
    expect(w.findAll('.eb-chat-artifact')).toHaveLength(0)
  })
})

describe('useChatEngine agent 方法', () => {
  function seeded() {
    const eng = useChatEngine({})
    const m = eng.createAssistantMessage()
    return { eng, m }
  }

  it('计划：设置、逐步推进、完成时算耗时、失败与跳过', async () => {
    const { eng, m } = seeded()
    eng.setPlan(m.id, { title: 'T', steps: [{ id: 'a', label: '第一步' }, { id: 'b', label: '第二步' }] })
    expect(eng.messages.value[0].plan.steps).toHaveLength(2)
    expect(eng.messages.value[0].plan.steps[0].status).toBeUndefined()

    eng.startPlanStep(m.id, 'a')
    expect(eng.messages.value[0].plan.steps[0].status).toBe('running')
    await new Promise((r) => setTimeout(r, 12))
    eng.completePlanStep(m.id, 'a', '拉到了 2 张表')
    const done = eng.messages.value[0].plan.steps[0]
    expect(done).toMatchObject({ status: 'done', detail: '拉到了 2 张表' })
    expect(done.duration).toBeGreaterThan(0)

    eng.failPlanStep(m.id, 'b', new Error('接口 500'))
    expect(eng.messages.value[0].plan.steps[1]).toMatchObject({ status: 'error', detail: '接口 500' })
    eng.skipPlanStep(m.id, 'b')
    expect(eng.messages.value[0].plan.steps[1].status).toBe('skipped')
  })

  it('计划：找不到消息或未设计划时不抛', () => {
    const { eng, m } = seeded()
    eng.startPlanStep(m.id, 'a')
    eng.setPlan('nope', { steps: [] })
    expect(eng.messages.value[0].plan).toBeUndefined()
  })

  it('确认门：按动作声明的 status 记账', () => {
    const { eng, m } = seeded()
    eng.setConfirmation(m.id, {
      id: 'c1',
      actions: [{ key: 'ok', label: '批准', status: 'approved' }, { key: 'no', label: '拒绝', status: 'rejected' }],
      status: 'pending',
    })
    eng.respondConfirmation(m.id, 'no')
    expect(eng.messages.value[0].confirmation).toMatchObject({ status: 'rejected', responseKey: 'no' })
    expect(eng.messages.value[0].confirmation.respondedAt).toBeGreaterThan(0)
  })

  it('确认门：动作未声明 status 时按 type 兜底，danger 不会被记成批准', () => {
    const { eng, m } = seeded()
    eng.setConfirmation(m.id, {
      id: 'c2',
      actions: [{ key: 'ok', label: '继续', type: 'primary' }, { key: 'del', label: '删除', type: 'danger' }],
      status: 'pending',
    })
    eng.respondConfirmation(m.id, 'del')
    expect(eng.messages.value[0].confirmation.status).toBe('rejected')
    eng.setConfirmation(m.id, { id: 'c3', actions: [{ key: 'go', label: '继续', type: 'primary' }], status: 'pending' })
    eng.respondConfirmation(m.id, 'go')
    expect(eng.messages.value[0].confirmation.status).toBe('approved')
  })

  it('确认门：已响应不再改、未知动作键忽略、无确认门时忽略', () => {
    const { eng, m } = seeded()
    eng.respondConfirmation(m.id, 'whatever')
    expect(eng.messages.value[0].confirmation).toBeUndefined()

    eng.setConfirmation(m.id, { id: 'c4', actions: [{ key: 'a', label: 'A' }], status: 'pending' })
    eng.respondConfirmation(m.id, 'missing')
    expect(eng.messages.value[0].confirmation.status).toBe('pending')

    eng.respondConfirmation(m.id, 'a')
    const first = eng.messages.value[0].confirmation.respondedAt
    eng.respondConfirmation(m.id, 'a')
    expect(eng.messages.value[0].confirmation.respondedAt).toBe(first)
  })

  it('产物：增改删', () => {
    const { eng, m } = seeded()
    const a = eng.addArtifact(m.id, { title: 'r.md', content: 'x' })
    expect(a.id).toBeTruthy()
    expect(eng.messages.value[0].artifacts).toHaveLength(1)
    eng.updateArtifact(m.id, a.id, { title: 'renamed.md' })
    expect(eng.messages.value[0].artifacts[0].title).toBe('renamed.md')
    eng.removeArtifact(m.id, a.id)
    expect(eng.messages.value[0].artifacts).toHaveLength(0)
    expect(eng.addArtifact('nope', {})).toBeNull()
  })
})

describe('ChatMessage agent 接线', () => {
  const rich = {
    id: 'a1',
    role: 'assistant',
    status: 'done',
    content: '执行完毕',
    plan: PLAN,
    confirmation: { id: 'c1', title: '确认执行', actions: [{ key: 'ok', label: '批准' }], status: 'pending' },
    artifacts: [{ id: 'f1', title: 'out.md', type: 'markdown', content: 'x' }],
    citations: [{ id: 'ref1', title: '来源甲' }],
    toolCalls: [{ id: 't1', name: 'search', status: 'done', result: 'ok' }],
  }

  it('三块都渲染，且顺序是 计划 → 确认门 → 工具卡 → 正文 → 来源 → 产物', () => {
    const w = mount(ChatMessage, { props: { message: rich } })
    const kids = [...w.find('.eb-chat-message__content').element.children]
    const cls = kids.map((el) => [...el.classList].find((c) => c.startsWith('eb-chat-') && c !== 'eb-chat-message') || el.className)
    const idx = (needle) => cls.findIndex((c) => String(c).includes(needle))
    expect(idx('eb-chat-plan')).toBeGreaterThanOrEqual(0)
    expect(idx('eb-chat-plan')).toBeLessThan(idx('eb-chat-confirmation'))
    expect(idx('eb-chat-confirmation')).toBeLessThan(idx('eb-chat-plan') + 99)
    expect(w.find('.eb-chat-plan').element.nextElementSibling.className).toContain('eb-chat-confirmation')
    // 工具卡在确认门之后，正文又在工具卡之后
    const html = w.find('.eb-chat-message__content').html()
    expect(html.indexOf('eb-chat-confirmation')).toBeLessThan(html.indexOf('eb-chat-tool-call'))
    expect(html.indexOf('eb-chat-tool-call')).toBeLessThan(html.indexOf('eb-chat-message__bubble'))
    expect(html.indexOf('eb-chat-message__bubble')).toBeLessThan(html.indexOf('eb-chat-sources'))
    expect(html.indexOf('eb-chat-sources')).toBeLessThan(html.indexOf('eb-chat-artifacts'))
  })

  it('事件带 message 一起上抛', async () => {
    const w = mount(ChatMessage, { props: { message: rich } })
    await w.find('.eb-chat-plan__trigger').trigger('click')
    expect(w.emitted('plan-step-click')[0][2].id).toBe('a1')
    await w.find('.eb-chat-confirmation__btn').trigger('click')
    expect(w.emitted('confirm-respond')[0][1]).toBe('ok')
    expect(w.emitted('confirm-respond')[0][2].id).toBe('a1')
    await w.findAll('.eb-chat-artifact__act')[0].trigger('click')
    expect(w.emitted('artifact-open')[0][1].id).toBe('a1')
  })

  it('没有这些字段时不渲染任何一块（回归钉）', () => {
    const w = mount(ChatMessage, { props: { message: { id: 'x', role: 'assistant', content: 'hi', status: 'done' } } })
    expect(w.find('.eb-chat-plan').exists()).toBe(false)
    expect(w.find('.eb-chat-confirmation').exists()).toBe(false)
    expect(w.find('.eb-chat-artifacts').exists()).toBe(false)
  })
})

describe('Chatbot agent 事件转发', () => {
  it('确认门响应一路到根并保留 message', async () => {
    const w = mount(Chatbot, {
      props: {
        showTip: false,
        modelValue: [{
          id: 'a1', role: 'assistant', status: 'done', content: 'x',
          confirmation: { id: 'c1', title: '确认', actions: [{ key: 'ok', label: '批准' }], status: 'pending' },
        }],
      },
    })
    await nextTick()
    await w.find('.eb-chat-confirmation__btn').trigger('click')
    const evt = w.emitted('confirm-respond')
    expect(evt[0][1]).toBe('ok')
    expect(evt[0][2].id).toBe('a1')
  })
})
