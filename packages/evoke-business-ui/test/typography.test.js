import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import EvTitle from '../src/components/typography/title.vue'
import EvParagraph from '../src/components/typography/paragraph.vue'
import EvText from '../src/components/text/index.vue'
import EvAnchor from '../src/components/anchor/index.vue'
import EvAnchorLink from '../src/components/anchor/link.vue'
import EvFloatButton from '../src/components/float-button/index.vue'
import EvFloatButtonGroup from '../src/components/float-button/group.vue'

/**
 * Typography 家族 / Anchor / FloatButton
 */

describe('EvTitle / EvParagraph', () => {
  it('Title：level 映射类与语义标签', () => {
    const h3 = mount(EvTitle, { props: { level: 3 }, slots: { default: '卡片标题' } })
    expect(h3.element.tagName).toBe('H3')
    expect(h3.classes()).toContain('ev-title--level-3')
    expect(h3.text()).toBe('卡片标题')
    h3.unmount()
    // tag 覆盖
    const div = mount(EvTitle, { props: { level: 1, tag: 'div' } })
    expect(div.element.tagName).toBe('DIV')
    div.unmount()
  })

  it('Paragraph：ellipsis 行数注入 line-clamp', () => {
    const p = mount(EvParagraph, { props: { ellipsis: { rows: 2 } }, slots: { default: '长文本' } })
    expect(p.classes()).toContain('is-ellipsis')
    expect(p.attributes('style')).toContain('-webkit-line-clamp: 2')
    p.unmount()
    const off = mount(EvParagraph, { slots: { default: 'x' } })
    expect(off.classes()).not.toContain('is-ellipsis')
    off.unmount()
  })

  it('Text：copyable 渲染复制按钮，copyText 生效', async () => {
    const t = mount(EvText, {
      props: { copyable: true, copyText: 'EV-1001' },
      slots: { default: '订单号' },
    })
    const btn = t.find('.ev-typography__copy')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    // jsdom execCommand 打桩
    const original = document.execCommand
    document.execCommand = () => true
    await btn.trigger('click')
    document.execCommand = original
    expect(t.emitted('copy').length).toBeGreaterThanOrEqual(1)
  })

  it('Text：行内语义标记', () => {
    const mark = mount(EvText, { props: { mark: true }, slots: { default: '标记' } })
    expect(mark.find('mark').exists()).toBe(true)
    mark.unmount()
    const code = mount(EvText, { props: { code: true }, slots: { default: 'const a = 1' } })
    expect(code.find('code').exists()).toBe(true)
    code.unmount()
  })
})

describe('EvAnchor', () => {
  function mountAnchor() {
    // 挂载目标区块
    for (const id of ['sec-a', 'sec-b']) {
      if (!document.getElementById(id)) {
        const el = document.createElement('div')
        el.id = id
        el.style.height = '100px'
        document.body.appendChild(el)
      }
    }
    return mount(
      defineComponent({
        components: { EvAnchor, EvAnchorLink },
        template: `
          <ev-anchor>
            <ev-anchor-link href="#sec-a" title="区块A" />
            <ev-anchor-link href="#sec-b" title="区块B" />
          </ev-anchor>
        `,
      }),
      { attachTo: document.body },
    )
  }

  it('渲染链接并注册到容器', async () => {
    const wrapper = mountAnchor()
    await nextTick()
    const links = wrapper.findAll('.ev-anchor-link')
    expect(links.length).toBe(2)
    expect(links[0].attributes('href')).toBe('#sec-a')
    wrapper.unmount()
    document.getElementById('sec-a')?.remove()
    document.getElementById('sec-b')?.remove()
  })

  it('点击链接触发 change 与 click', async () => {
    const wrapper = mountAnchor()
    await nextTick()
    await wrapper.findAll('.ev-anchor-link')[0].trigger('click')
    const clicks = wrapper.findComponent(EvAnchor).emitted('click')
    expect(clicks).toBeTruthy()
    wrapper.unmount()
    document.getElementById('sec-a')?.remove()
    document.getElementById('sec-b')?.remove()
  })
})

describe('FloatButton Group', () => {
  it('Group：trigger 模式点击展开/收起', async () => {
    const wrapper = mount(EvFloatButtonGroup, {
      props: { trigger: 'plus' },
      slots: { default: '<ev-float-button icon="edit" />' },
      global: { components: { EvFloatButton } },
    })
    // 未展开：列表不存在
    expect(wrapper.find('.ev-float-button-group__list').exists()).toBe(false)
    await wrapper.find('.ev-float-button-group__trigger .ev-button').trigger('click')
    expect(wrapper.find('.ev-float-button-group__list').exists()).toBe(true)
    expect(wrapper.classes()).toContain('is-open')
    await wrapper.find('.ev-float-button-group__trigger .ev-button').trigger('click')
    expect(wrapper.find('.ev-float-button-group__list').exists()).toBe(false)
    wrapper.unmount()
  })

  it('Group：position-type absolute 应用定位样式', () => {
    const wrapper = mount(EvFloatButtonGroup, {
      props: { position: { right: 24, bottom: 24 }, positionType: 'absolute' },
    })
    expect(wrapper.attributes('style')).toContain('position: absolute')
    expect(wrapper.attributes('style')).toContain('right: 24px')
    wrapper.unmount()
  })

  it('Button：badge 与 tooltip 渲染', () => {
    const btn = mount(EvFloatButton, { props: { icon: 'notification', badgeValue: 8, tooltip: '消息' } })
    expect(btn.find('.ev-badge').exists()).toBe(true)
    expect(btn.find('.ev-float-button__tooltip').text()).toBe('消息')
    btn.unmount()
  })
})
