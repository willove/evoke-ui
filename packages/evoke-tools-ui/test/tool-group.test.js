import { describe, it, expect } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import EtToolGroup from '../src/components/tool-group/index.vue'
import EtToolButton from '../src/components/tool-button/index.vue'

describe('EtToolGroup 渲染契约', () => {
  it('挂 et-toolgroup 双 class 与 role=group + aria-label', () => {
    const wrapper = mount(EtToolGroup, {
      props: { label: '字体' },
      slots: { default: '<span class="et-toolgroup__item">A</span>' },
    })
    expect(wrapper.classes()).toContain('et-toolgroup')
    // 双 class 特异性（classList 会去重，故查原始属性串）
    const cls = wrapper.element.getAttribute('class') || ''
    expect(cls.split(/\s+/).filter((t) => t === 'et-toolgroup')).toHaveLength(2)
    expect(wrapper.attributes('role')).toBe('group')
    expect(wrapper.attributes('aria-label')).toBe('字体')
  })

  it('组标题行存在且渲染 label 文本', () => {
    const wrapper = mount(EtToolGroup, {
      props: { label: '字体' },
      slots: { default: '<span>A</span>' },
    })
    const label = wrapper.find('.et-toolgroup__label')
    expect(label.exists()).toBe(true)
    expect(label.text()).toBe('字体')
  })

  it('label 为空时不渲染标题行', () => {
    const wrapper = mount(EtToolGroup, {
      props: { label: '' },
      slots: { default: '<span>A</span>' },
    })
    expect(wrapper.find('.et-toolgroup__label').exists()).toBe(false)
    expect(wrapper.attributes('aria-label')).toBeUndefined()
  })

  it('slot 条目渲染在控件行内', () => {
    const wrapper = mount(EtToolGroup, {
      props: { label: '字体' },
      slots: {
        default: '<span class="et-toolgroup__item">A</span><span class="et-toolgroup__item">B</span>',
      },
    })
    const row = wrapper.find('.et-toolgroup__row')
    expect(row.exists()).toBe(true)
    expect(row.findAll('.et-toolgroup__item')).toHaveLength(2)
  })

  it('条目混排（ToolButton + 分隔 + 占位）全部落在控件行', () => {
    const wrapper = mount(EtToolGroup, {
      props: { label: '字体' },
      slots: {
        default: () => [
          h(EtToolButton, { icon: 'bold', label: '加粗' }),
          h('span', { class: 'et-toolgroup__item' }, 'B'),
        ],
      },
    })
    const row = wrapper.find('.et-toolgroup__row')
    expect(row.find('button.et-toolbtn').exists()).toBe(true)
    expect(row.find('.et-toolgroup__item').exists()).toBe(true)
  })
})
