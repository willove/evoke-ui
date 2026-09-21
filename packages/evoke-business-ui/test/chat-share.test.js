import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ChatShare from '../src/components/chatbot/ChatShare.vue'
import { chatLabels } from '../src/components/chatbot/labels'

/**
 * 批 H：会话分享弹层
 *
 * 组件不发请求：收集范围与有效期 → 抛 create → 宿主产出链接回灌。
 * 链接为空是配置态，非空是已创建态。
 */

const open = (props = {}) =>
  mount(ChatShare, { props: { modelValue: true, appendToBody: false, ...props }, attachTo: document.body })

describe('ChatShare 配置态', () => {
  it('无链接时给范围与有效期，主按钮是「创建链接」', async () => {
    const w = open({ title: '报表口径' })
    await nextTick()
    expect(w.find('.eb-chat-share__lead').text()).toBe(chatLabels.share.intro)
    expect(w.findAll('.eb-chat-share__option')).toHaveLength(3)
    expect(w.findAll('.eb-chat-share__chip')).toHaveLength(3)
    expect(w.find('.eb-chat-share__btn.is-primary').text()).toBe(chatLabels.share.create)
    expect(w.find('.eb-chat-share__input').exists()).toBe(false)
    // 范围默认选中第一项
    expect(w.find('.eb-chat-share__option.is-active').text()).toContain(chatLabels.share.scopeAnyone)
  })

  it('默认范围三项文案成对（标签与说明都在）', async () => {
    const w = open()
    await nextTick()
    const labels = w.findAll('.eb-chat-share__option-label').map((n) => n.text())
    const descs = w.findAll('.eb-chat-share__option-desc').map((n) => n.text())
    expect(labels).toEqual([chatLabels.share.scopeAnyone, chatLabels.share.scopeOrg, chatLabels.share.scopeInvited])
    expect(descs).toHaveLength(3)
  })

  it('切范围与有效期各自抛 update', async () => {
    const w = open()
    await nextTick()
    await w.findAll('.eb-chat-share__option input')[1].setValue()
    expect(w.emitted('update:scope')[0]).toEqual(['org'])
    await w.findAll('.eb-chat-share__chip')[2].trigger('click')
    expect(w.emitted('update:expiry')[0]).toEqual(['never'])
  })

  it('create / cancel / 关闭各自抛出；creating 时主按钮禁用且改文案', async () => {
    const w = open({ creating: true })
    await nextTick()
    const primary = w.find('.eb-chat-share__btn.is-primary')
    expect(primary.text()).toBe(chatLabels.share.creating)
    expect(primary.attributes('disabled')).toBeDefined()
    await primary.trigger('click')
    expect(w.emitted('create')).toBeUndefined()
    w.unmount()

    const w2 = open()
    await nextTick()
    await w2.find('.eb-chat-share__btn.is-primary').trigger('click')
    expect(w2.emitted('create')).toHaveLength(1)
    await w2.findAll('.eb-chat-share__btn')[0].trigger('click')
    expect(w2.emitted('update:modelValue').at(-1)).toEqual([false])
    w2.unmount()
  })

  it('自定义 scopes / expiries 覆盖内置项', async () => {
    const w = open({
      scopes: [{ key: 'team', label: '仅团队' }],
      expiries: [{ key: '1d', label: '1 天' }],
      scope: 'team',
      expiry: '1d',
    })
    await nextTick()
    expect(w.findAll('.eb-chat-share__option')).toHaveLength(1)
    expect(w.findAll('.eb-chat-share__chip')).toHaveLength(1)
    expect(w.find('.eb-chat-share__option.is-active').text()).toContain('仅团队')
  })
})

describe('ChatShare 已创建态', () => {
  const LINK = 'https://example.com/s/abc123'

  it('显示链接、范围与有效期；主按钮换成撤销', async () => {
    const w = open({ link: LINK, title: '报表口径', scope: 'org', expiry: '30d' })
    await nextTick()
    expect(w.find('.eb-chat-share__input').element.value).toBe(LINK)
    expect(w.text()).toContain(chatLabels.share.scopeOrg)
    expect(w.text()).toContain(chatLabels.share.expiry30)
    expect(w.find('.eb-chat-share__btn.is-danger').text()).toBe(chatLabels.share.revoke)
    expect(w.find('.eb-chat-share__option').exists()).toBe(false)
  })

  it('标题拼进弹层标题；无标题时用默认标题', async () => {
    const w = open({ link: LINK, title: '报表口径' })
    await nextTick()
    expect(document.body.textContent).toContain('报表口径')
    w.unmount()
    const w2 = open({ link: LINK })
    await nextTick()
    expect(document.body.textContent).toContain(chatLabels.share.title)
    w2.unmount()
  })

  it('复制链接写入剪贴板并抛 copy，按钮转「已复制」', async () => {
    const w = open({ link: LINK })
    await nextTick()
    const desc = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    try {
      await w.find('.eb-chat-share__copy').trigger('click')
      await new Promise((r) => setTimeout(r, 0))
      expect(writeText).toHaveBeenCalledWith(LINK)
      expect(w.emitted('copy')[0][0]).toBe(LINK)
      expect(w.find('.eb-chat-share__copy').text()).toContain(chatLabels.share.copied)
    } finally {
      if (desc) Object.defineProperty(navigator, 'clipboard', desc)
      else delete navigator.clipboard
    }
  })

  it('撤销抛 revoke', async () => {
    const w = open({ link: LINK })
    await nextTick()
    await w.find('.eb-chat-share__btn.is-danger').trigger('click')
    expect(w.emitted('revoke')).toHaveLength(1)
  })

  it('聚焦链接框即全选（省掉三击）', async () => {
    const w = open({ link: LINK })
    await nextTick()
    const input = w.find('.eb-chat-share__input').element
    const select = vi.fn()
    input.select = select
    await w.find('.eb-chat-share__input').trigger('focus')
    expect(select).toHaveBeenCalled()
  })
})
