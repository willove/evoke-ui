import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref, nextTick } from 'vue'
import EbTour from '../src/components/tour/index.vue'
import EbMention from '../src/components/mention/index.vue'
import EbAuth from '../src/components/auth/index.vue'
import EbComment from '../src/components/comment/index.vue'
import { setPermissions } from '../src/composables/usePermission'

const wait = (ms = 30) => new Promise((r) => setTimeout(r, ms))

// ─── EbAuth 权限容器 ───

describe('EbAuth', () => {
  afterEach(() => setPermissions([]))

  it('has 命中渲染默认插槽，未命中渲染 fallback', () => {
    setPermissions(['sys:user:delete'])
    const ok = mount(EbAuth, {
      props: { has: 'sys:user:delete' },
      slots: { default: '<span>敏感操作</span>', fallback: '<span>无权限</span>' },
    })
    expect(ok.text()).toContain('敏感操作')
    expect(ok.text()).not.toContain('无权限')
    ok.unmount()
    const denied = mount(EbAuth, {
      props: { has: 'sys:user:remove' },
      slots: { default: '<span>敏感操作</span>', fallback: '<span>无权限</span>' },
    })
    expect(denied.text()).toContain('无权限')
    expect(denied.text()).not.toContain('敏感操作')
    denied.unmount()
  })

  it('数组任一满足即放行；函数式自定义判定', () => {
    setPermissions(['a', 'b'])
    const anyOf = mount(EbAuth, {
      props: { has: ['x', 'b'] },
      slots: { default: '内容' },
    })
    expect(anyOf.text()).toContain('内容')
    anyOf.unmount()
    const fn = mount(EbAuth, {
      props: { has: (perms) => perms.length > 5 },
      slots: { default: '内容', fallback: '不足' },
    })
    expect(fn.text()).toContain('不足')
    fn.unmount()
  })
})

// ─── EbComment 评论 ───

describe('EbComment', () => {
  it('author/datetime + 内容/操作/嵌套回复插槽', () => {
    const wrapper = mount(EbComment, {
      props: { author: '张三', datetime: '昨天 14:00' },
      slots: {
        default: '<p>同意该方案</p>',
        actions: '<button type="button">采纳</button>',
        replies: '<div class="nested-reply">回复内容</div>',
      },
    })
    expect(wrapper.find('.eb-comment__author').text()).toBe('张三')
    expect(wrapper.find('.eb-comment__datetime').text()).toBe('昨天 14:00')
    expect(wrapper.find('.eb-comment__content').text()).toContain('同意该方案')
    expect(wrapper.find('.eb-comment__actions button').exists()).toBe(true)
    expect(wrapper.find('.eb-comment__replies .nested-reply').exists()).toBe(true)
  })

  it('无 author/avatar 时对应区块不渲染', () => {
    const wrapper = mount(EbComment, { slots: { default: '内容' } })
    expect(wrapper.find('.eb-comment__avatar').exists()).toBe(false)
    expect(wrapper.find('.eb-comment__author').exists()).toBe(false)
    expect(wrapper.find('.eb-comment__actions button').exists()).toBe(false)
    expect(wrapper.find('.eb-comment__replies .nested-reply').exists()).toBe(false)
  })
})

// ─── EbMention @提及 ───

const MentionHarness = defineComponent({
  setup() {
    const val = ref('')
    return () =>
      h(EbMention, {
        modelValue: val.value,
        'onUpdate:modelValue': (v) => (val.value = v),
        options: ['alice', 'bob'],
      })
  },
})

describe('EbMention', () => {
  it('前缀触发候选面板并按关键词过滤', async () => {
    const wrapper = mount(MentionHarness, { attachTo: document.body })
    const ta = wrapper.find('.eb-mention__inner')
    await ta.setValue('你好 @al')
    await nextTick()
    const opts = wrapper.findAll('.eb-mention__option')
    expect(opts.length).toBe(1)
    expect(opts[0].text()).toBe('alice')
    expect(opts[0].attributes('role')).toBe('option')
    wrapper.unmount()
  })

  it('↑↓ 移动高亮，Enter 选中回填并关闭面板', async () => {
    const wrapper = mount(MentionHarness, { attachTo: document.body })
    const ta = wrapper.find('.eb-mention__inner')
    await ta.setValue('@')
    await nextTick()
    expect(wrapper.findAll('.eb-mention__option').length).toBe(2)
    await ta.trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    // 高亮落到第二项（aria-selected 同步）
    expect(wrapper.findAll('.eb-mention__option')[1].attributes('aria-selected')).toBe('true')
    await ta.trigger('keydown', { key: 'Enter' })
    await nextTick()
    const host = wrapper.findComponent(EbMention)
    const ups = host.emitted('update:modelValue')
    expect(ups[ups.length - 1]).toEqual(['@bob '])
    expect(host.emitted('select')[0]).toEqual(['bob'])
    expect(wrapper.find('.eb-mention__panel').exists()).toBe(false)
    wrapper.unmount()
  })

  it('Esc 关闭面板', async () => {
    const wrapper = mount(MentionHarness, { attachTo: document.body })
    const ta = wrapper.find('.eb-mention__inner')
    await ta.setValue('@')
    await nextTick()
    expect(wrapper.find('.eb-mention__panel').exists()).toBe(true)
    await ta.trigger('keydown', { key: 'Escape' })
    await nextTick()
    expect(wrapper.find('.eb-mention__panel').exists()).toBe(false)
    wrapper.unmount()
  })
})

// ─── EbTour 新手引导 ───

const TOUR_STEPS = [
  { target: '#tour-target', title: '第一步', description: '这里可以创建订单' },
  { target: '#tour-target', title: '第二步', description: '这里导出报表' },
]

// current 是纯 computed(modelValue)，步进/跳过必须走真实 v-model 才会驱动内部状态
const TourHarness = defineComponent({
  setup() {
    const step = ref(0)
    return () =>
      h(EbTour, {
        modelValue: step.value,
        'onUpdate:modelValue': (v) => (step.value = v),
        steps: TOUR_STEPS,
      })
  },
})

describe('EbTour', () => {
  afterEach(() => {
    // Teleport 内容可能跨测试泄漏（同 command-palette 测试的清场防御）
    document.querySelectorAll('.eb-tour__card, .eb-tour__mask').forEach((el) => el.remove())
    document.getElementById('tour-target')?.remove()
  })

  it('卡片 dialog 语义 + 进度指示 + 下一步步进', async () => {
    const target = document.createElement('div')
    target.id = 'tour-target'
    document.body.appendChild(target)
    const wrapper = mount(TourHarness, { attachTo: document.body })
    await wait()
    const card = document.querySelector('.eb-tour__card')
    expect(card).toBeTruthy()
    expect(card.getAttribute('role')).toBe('dialog')
    expect(card.getAttribute('aria-modal')).toBe('true')
    expect(card.textContent).toContain('第一步')
    expect(document.querySelector('.eb-tour__indicator').textContent.trim()).toBe('1 / 2')
    // 上一步不渲染（第一步）
    const btnText = () => [...document.querySelectorAll('.eb-tour__actions button')].map((b) => b.textContent.trim())
    expect(btnText().some((t) => t.includes('上一步'))).toBe(false)
    const nextBtn = [...document.querySelectorAll('.eb-tour__actions button')].find((b) => b.textContent.includes('下一步'))
    nextBtn.click()
    await wait()
    expect(document.querySelector('.eb-tour__indicator').textContent.trim()).toBe('2 / 2')
    expect(wrapper.findComponent(EbTour).emitted('update:modelValue')[0]).toEqual([1])
    // 末步：下一步换「完成」
    expect(btnText().some((t) => t.includes('完成'))).toBe(true)
    wrapper.unmount()
  })

  it('Esc 跳过（keyboard 默认开），emit skip + v-model -1 并收起卡片', async () => {
    const target = document.createElement('div')
    target.id = 'tour-target'
    document.body.appendChild(target)
    const wrapper = mount(TourHarness, { attachTo: document.body })
    await wait()
    expect(document.querySelector('.eb-tour__card')).toBeTruthy()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wait()
    const host = wrapper.findComponent(EbTour)
    expect(host.emitted('skip')).toBeTruthy()
    const updates = host.emitted('update:modelValue')
    expect(updates[updates.length - 1]).toEqual([-1])
    expect(document.querySelector('.eb-tour__card')).toBeNull()
    wrapper.unmount()
  })

  it('未开启（-1）不渲染任何浮层', async () => {
    const wrapper = mount(EbTour, {
      props: { modelValue: -1, steps: TOUR_STEPS },
      attachTo: document.body,
    })
    await wait()
    expect(document.querySelector('.eb-tour__card')).toBeNull()
    expect(document.querySelector('.eb-tour__mask')).toBeNull()
    wrapper.unmount()
  })
})
