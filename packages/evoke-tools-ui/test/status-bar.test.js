import { describe, it, expect, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mount } from '@vue/test-utils'
import EtStatusBar from '../src/components/status-bar/index.vue'

/**
 * EtStatusBar 组件契约（tools-ui 计划 05 §四 L4 验收要点：高度固定走 chrome
 * 预算、条目可键盘聚焦、左/中/右槽、右槽优先于内置工具位）。
 */

const ITEMS = [
  { key: 'count', label: '计数', value: 42 },
  { key: 'sum', label: '求和', value: '1,024' },
  { key: 'avg', label: '平均', value: 256 },
  { key: 'hidden', label: '隐藏项', value: 'x', visible: false },
]

const STYLE_CSS = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/components/status-bar/style.css'),
  'utf8',
)
const TOKENS_CSS = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/styles/variables.css'),
  'utf8',
)

/** 令牌 + 组件样式注入 jsdom：验证规则命中与"声明即令牌引用"（G7） */
beforeAll(() => {
  const style = document.createElement('style')
  style.textContent = `${TOKENS_CSS}\n${STYLE_CSS}`
  document.head.appendChild(style)
})

afterAll(() => {
  document.head.querySelectorAll('style').forEach((el) => el.remove())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('EtStatusBar 可配置项', () => {
  it('items 渲染 label + value；visible=false 跳过', () => {
    const wrapper = mount(EtStatusBar, { props: { items: ITEMS } })
    const items = wrapper.findAll('.et-statusbar__item')
    expect(items).toHaveLength(3)
    expect(items[0].text()).toBe('计数42')
    // 可访问名 = label + value 组合（G4：图标化条目也读得出内容）
    expect(items.map((i) => i.attributes('aria-label'))).toEqual(['计数 42', '求和 1,024', '平均 256'])
  })

  it('条目是原生 button：键盘可达、可点击、带 aria-label', () => {
    const wrapper = mount(EtStatusBar, { props: { items: ITEMS } })
    const first = wrapper.find('.et-statusbar__item')
    expect(first.element.tagName).toBe('BUTTON')
    expect(first.attributes('type')).toBe('button')
    expect(first.attributes('aria-label')).toBeTruthy()
    // 默认可聚焦：没有人为摘掉 tabindex / disabled
    expect(first.attributes('tabindex')).toBeUndefined()
    expect(first.attributes('disabled')).toBeUndefined()
  })

  it('条目点击发 item-click(key)', async () => {
    const wrapper = mount(EtStatusBar, { props: { items: ITEMS } })
    await wrapper.findAll('.et-statusbar__item')[1].trigger('click')
    expect(wrapper.emitted('item-click')).toEqual([['sum']])
  })

  it('数据面 onClick 同场回调（与事件面两种接法等价）', async () => {
    const onClick = vi.fn()
    const wrapper = mount(EtStatusBar, { props: { items: [{ key: 'ready', label: '就绪', onClick }] } })
    await wrapper.find('.et-statusbar__item').trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0][0]).toMatchObject({ key: 'ready' })
  })

  it('坏数据不渲染也不抛（非数组 / 非对象条目跳过）', () => {
    const wrapper = mount(EtStatusBar, {
      props: { items: [null, 42, 'x', { key: 'ok', label: '就绪' }] },
    })
    expect(wrapper.findAll('.et-statusbar__item')).toHaveLength(1)
  })
})

describe('EtStatusBar 内置工具位与槽位', () => {
  it('zoom 空不渲染；有值渲染（数字原样，字符串自定形态）', () => {
    expect(mount(EtStatusBar).find('.et-statusbar__zoom').exists()).toBe(false)
    expect(mount(EtStatusBar, { props: { zoom: '100%' } }).find('.et-statusbar__zoom').text()).toBe('100%')
    expect(mount(EtStatusBar, { props: { zoom: 80 } }).find('.et-statusbar__zoom').text()).toBe('80')
  })

  it('left / center / right 三槽各自归位', () => {
    const wrapper = mount(EtStatusBar, {
      slots: {
        left: '<span class="s-left">就绪</span>',
        center: '<span class="s-center">第 1 页</span>',
        right: '<span class="s-right">布局</span>',
      },
    })
    expect(wrapper.find('.et-statusbar__side--left .s-left').exists()).toBe(true)
    expect(wrapper.find('.et-statusbar__side--center .s-center').exists()).toBe(true)
    expect(wrapper.find('.et-statusbar__side--right .s-right').exists()).toBe(true)
  })

  it('left 槽与内置 items 共存（槽在前）', () => {
    const wrapper = mount(EtStatusBar, {
      props: { items: ITEMS },
      slots: { left: '<span class="s-left">就绪</span>' },
    })
    const left = wrapper.find('.et-statusbar__side--left')
    expect(left.find('.s-left').exists()).toBe(true)
    expect(left.findAll('.et-statusbar__item')).toHaveLength(3)
    expect(left.element.children[0].className).toContain('s-left')
  })

  it('right 槽优先于内置工具位（有槽不渲染 zoom）', () => {
    const wrapper = mount(EtStatusBar, {
      props: { zoom: '100%' },
      slots: { right: '<span class="s-right">工具</span>' },
    })
    expect(wrapper.find('.et-statusbar__side--right .s-right').exists()).toBe(true)
    expect(wrapper.find('.et-statusbar__zoom').exists()).toBe(false)
  })

  it('无中槽时不渲染中区（不占位）', () => {
    expect(mount(EtStatusBar).find('.et-statusbar__side--center').exists()).toBe(false)
  })
})

describe('EtStatusBar chrome 纪律', () => {
  it('高度走 chrome 令牌（--et-chrome-statusbar-height），条目禁换行', () => {
    expect(mount(EtStatusBar).classes()).toContain('et-statusbar')
    expect(STYLE_CSS).toMatch(/height:\s*var\(--et-chrome-statusbar-height\)/)
    expect(STYLE_CSS).toMatch(/overflow:\s*hidden/)
    expect(STYLE_CSS).not.toMatch(/flex-wrap:\s*wrap/)
    expect(STYLE_CSS).not.toMatch(/(?:height|width|padding|margin|gap|inset)[^:]*:\s*[^;]*\d+px/)
  })

  it('规则实际命中：根高度声明即令牌引用，溢出隐藏兜底', () => {
    const wrapper = mount(EtStatusBar, { attachTo: document.body })
    const cs = getComputedStyle(wrapper.element)
    // jsdom 不解析 var()：原样返回 token 引用 = 声明是令牌而非字面量（真浏览器求值 24px）
    expect(['24px', 'var(--et-chrome-statusbar-height)']).toContain(cs.height)
    expect(cs.overflow).toBe('hidden')
    expect(cs.display).toBe('flex')
    wrapper.unmount()
  })
})
