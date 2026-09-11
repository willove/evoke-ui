import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EbIcon from '../src/components/icon/index.vue'
import {
  getIconByNameSync,
  getIconByName,
  registerIcons,
  getIconNames,
  remixSvgPaths,
} from '../src/components/icon/iconRegistry'

describe('EbIcon 渲染契约', () => {
  it('根节点挂 eb-icon/eb-icon 双 class（消费方 .eb-icon 覆盖兼容）', () => {
    const wrapper = mount(EbIcon, { props: { name: 'search' } })
    expect(wrapper.classes()).toContain('eb-icon')
    expect(wrapper.classes()).toContain('eb-icon')
  })

  it('aria-hidden 无障碍基线', () => {
    const wrapper = mount(EbIcon, { props: { name: 'search' } })
    expect(wrapper.attributes('aria-hidden')).toBe('true')
  })

  it('size 数字转 px 字号', () => {
    const wrapper = mount(EbIcon, { props: { name: 'search', size: 20 } })
    expect(wrapper.element.style.fontSize).toBe('20px')
  })

  it('color 透传颜色', () => {
    const wrapper = mount(EbIcon, { props: { name: 'search', color: '#ff0000' } })
    expect(wrapper.element.style.color).toBe('rgb(255, 0, 0)')
  })

  it('内置 SVG 图标渲染内联 SVG（零第三方运行时依赖，iconfont 重名优先级见下条）', () => {
    // caret-right 仅存在于内置 SVG 层（Remix 形状；iconfont 56 个重名图标走字体渲染）
    const wrapper = mount(EbIcon, { props: { name: 'caret-right' } })
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.find('svg path').exists()).toBe(true)
    expect(wrapper.find('svg').attributes('viewBox')).toBe('0 0 24 24')
  })

  it('search 渲染内置 SVG（Remix 静态图标集）', () => {
    const wrapper = mount(EbIcon, { props: { name: 'search' } })
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.find('svg path').exists()).toBe(true)
  })

  it('platform 为单色内置 SVG 别名（品牌彩色图标族已退役）', () => {
    const wrapper = mount(EbIcon, { props: { name: 'platform' } })
    expect(wrapper.find('svg').exists()).toBe(true)
    // 单色图标全部 currentColor，无固定填充色
    expect(wrapper.find('svg path[fill]:not([fill="currentColor"])').exists()).toBe(false)
  })

  it('文件类型图标多别名指向同一资源（xlsx / xls / excel / file-excel）', () => {
    const wrapper = mount(EbIcon, { props: { name: 'xlsx' } })
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(remixSvgPaths['xls']).toStrictEqual(remixSvgPaths['file-excel'])
    expect(remixSvgPaths['excel']).toStrictEqual(remixSvgPaths['file-excel'])
    expect(remixSvgPaths['docx']).toStrictEqual(remixSvgPaths['file-word'])
    expect(remixSvgPaths['pptx']).toStrictEqual(remixSvgPaths['file-ppt'])
    expect(getIconByNameSync('xls')).toBeDefined()
    expect(getIconByNameSync('docx')).toBeDefined()
  })
})

describe('iconRegistry API（基础兼容）', () => {
  it('getIconByNameSync 三层解析', async () => {
    expect(await getIconByName('search')).toBeDefined()
    expect(getIconByNameSync('platform')).toBeDefined()
    expect(getIconByNameSync('not-exist-icon-xyz')).toBeUndefined()
  })

  it('PascalCase 名称容错（CircleCheckFilled → circle-check-filled）', () => {
    expect(getIconByNameSync('CircleCheckFilled')).toBeDefined()
    expect(getIconByNameSync('Search')).toBeDefined()
  })

  it('registerIcons 注册自定义图标（最高优先级，可覆盖同名）', () => {
    const fake = { render: () => null }
    registerIcons({ 'my-custom': fake, search: fake })
    expect(getIconByNameSync('my-custom')).toBe(fake)
    // 覆盖同名默认图标
    expect(getIconByNameSync('search')).toBe(fake)
    expect(getIconByNameSync('custom:my-custom')).toBe(fake)
  })

  it('getIconNames 支持库过滤', () => {
    expect(getIconNames('remix')).toContain('arrow-right')
    // 隔离铁律：第三方历史别名已移除，未知库名回落到 'all' 分支
    expect(getIconNames('unknown-legacy-lib')).toEqual(getIconNames('all'))
    // iconfont 字体图标族已退役，恒返回 []
    expect(getIconNames('iconfont')).toEqual([])
    const all = getIconNames('all')
    expect(all.length).toBeGreaterThan(100)
  })
})
