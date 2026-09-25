import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import EtIcon from '../src/icons/icon.vue'
import {
  registerDomainIcons,
  clearDomainIcons,
  getDomainAlias,
  listDomainAliases,
  resolveIconName,
  findDanglingIconNames,
  FALLBACK_ICON_NAME,
  isCustomIconName,
  isDanglingIconName,
} from '../src/icons/index.js'

describe('领域别名层（图标三层命名的第 ③ 层）', () => {
  afterEach(() => clearDomainIcons())

  it('登记后 resolveIconName 把领域名折成组件语义名', () => {
    expect(resolveIconName('search')).toBe('search')
    registerDomainIcons({ 'cell-bold': 'bold', 'freeze-panes': 'fullscreen' })
    expect(getDomainAlias('cell-bold')).toBe('bold')
    expect(resolveIconName('cell-bold')).toBe('bold')
    expect(listDomainAliases()).toEqual({ 'cell-bold': 'bold', 'freeze-panes': 'fullscreen' })
  })

  it('重复登记后者覆盖（装配热更新）', () => {
    registerDomainIcons({ 'cell-bold': 'bold' })
    registerDomainIcons({ 'cell-bold': 'italic' })
    expect(resolveIconName('cell-bold')).toBe('italic')
  })

  it('非字符串入参即抛（形态包写错立刻炸）', () => {
    expect(() => registerDomainIcons({ a: 1 })).toThrow(TypeError)
    expect(() => registerDomainIcons(null)).toThrow(TypeError)
  })

  it('custom: 前缀直通，不参与别名与兜底', () => {
    expect(isCustomIconName('custom:my-brand')).toBe(true)
    expect(resolveIconName('custom:my-brand')).toBe('custom:my-brand')
  })
})

describe('悬空名判定（G2 门的基础函数）', () => {
  const registry = { hasName: (n) => ['bold', 'search'].includes(n) }

  it('未登记的语义名判悬空', () => {
    expect(isDanglingIconName('bold', registry)).toBe(false)
    expect(isDanglingIconName('not-a-real-icon', registry)).toBe(true)
  })

  it('findDanglingIconNames 去重收集', () => {
    expect(findDanglingIconNames(['bold', 'nope', 'nope', 'search'], registry)).toEqual(['nope'])
  })

  it('custom: 不判悬空（运行时注册，静态不可判）', () => {
    expect(isDanglingIconName('custom:x', registry)).toBe(false)
  })

  it('别名目标悬空 = 悬空（形态包把领域名指到不存在的语义名）', () => {
    registerDomainIcons({ 'cell-nope': 'not-real' })
    expect(findDanglingIconNames(['cell-nope'], registry)).toEqual(['cell-nope'])
    clearDomainIcons()
  })
})

describe('EtIcon — 解析与兜底（04 §四 硬要求）', () => {
  afterEach(() => clearDomainIcons())

  it('已注册语义名渲染内联 SVG', () => {
    const wrapper = mount(EtIcon, { props: { name: 'search' } })
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.classes()).toContain('et-icon')
  })

  it('领域别名渲染到目标图标', () => {
    registerDomainIcons({ 'cell-bold': 'bold' })
    const wrapper = mount(EtIcon, { props: { name: 'cell-bold' } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('悬空名异步自愈失败后回落显式兜底图标（不渲染空白）', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = mount(EtIcon, { props: { name: 'definitely-not-an-icon-name' } })
    await flushPromises()
    const html = wrapper.html()
    expect(html.length).toBeGreaterThan(0)
    expect(wrapper.find('svg').exists()).toBe(true)
    warn.mockRestore()
  })

  it('兜底名是显式问号（question-circle 在 business-ui 内置集内）', () => {
    expect(FALLBACK_ICON_NAME).toBe('question-circle')
  })

  it('size/超宽属性透传', () => {
    const wrapper = mount(EtIcon, { props: { name: 'search', size: 20 } })
    expect(wrapper.attributes('style')).toContain('font-size')
  })
})
