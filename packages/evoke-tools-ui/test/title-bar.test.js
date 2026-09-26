import { describe, it, expect, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mount } from '@vue/test-utils'
import EtTitleBar from '../src/components/title-bar/index.vue'
import { WINDOW_CONTROLS } from '../src/runtime/window/host'

/**
 * EtTitleBar 组件契约（tools-ui 计划 05 §四 L4 验收要点 / 07 M3 出口条件二：
 * Web 与桌面壳两种宿主下均正确，窗口控制位降级）。
 *
 * 宿主探测注入口 = documentElement 的 data-host（宿主自证 + 测试注入同路径）；
 * 平台注入口 = navigator.userAgentData（Win 新 UA 策略）与 UA 正则。
 */

const mountBar = (props = {}, slots = {}) => mount(EtTitleBar, { props, slots })

function setDataHost(value) {
  if (value) document.documentElement.setAttribute('data-host', value)
  else document.documentElement.removeAttribute('data-host')
}

/** 平台 stub：UAHP platform 优先（Win 冻结 UA 后唯一的平台信号） */
function stubNavigator({ platform, ua = 'Mozilla/5.0' }) {
  vi.stubGlobal('navigator', { userAgent: ua, userAgentData: platform ? { platform } : undefined })
}

const STYLE_CSS = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/components/title-bar/style.css'),
  'utf8',
)
const TOKENS_CSS = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/styles/variables.css'),
  'utf8',
)

/** 把令牌与组件样式注入 jsdom：getComputedStyle 能拿到规则匹配后的声明值
 *  （jsdom 无布局引擎，var() 原样返回——恰好证明"值是令牌引用而非字面量"） */
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
  setDataHost(null)
})

describe('EtTitleBar 双宿主适配', () => {
  it('Web 宿主一律不渲染窗口控制位（浏览器自己的 chrome 管窗口）', () => {
    stubNavigator({ platform: 'Windows' })
    setDataHost(null) // 无 data-host：UA 无壳标记 → web
    const wrapper = mountBar({ title: '产品' })
    expect(wrapper.find('.et-titlebar__controls').exists()).toBe(false)
    expect(wrapper.findAll('button')).toHaveLength(0)
  })

  it('data-host=web 覆盖优先：Tauri UA 也不渲染控制位', () => {
    stubNavigator({ ua: 'Mozilla Tauri/1.0 Mac' })
    setDataHost('web')
    const wrapper = mountBar()
    expect(wrapper.find('.et-titlebar__controls').exists()).toBe(false)
  })

  it('host=auto：UA 含 Electron / Tauri 即桌面壳（控制位出现）', () => {
    stubNavigator({ ua: 'Mozilla/5.0 Electron/30 Macintosh' })
    setDataHost(null)
    const wrapper = mountBar()
    expect(wrapper.find('.et-titlebar__controls').exists()).toBe(true)
  })

  it('host prop 可钉死宿主（desktop 强开 / web 强关）', () => {
    stubNavigator({ platform: 'macOS' })
    setDataHost(null)
    expect(mountBar({ host: 'desktop' }).find('.et-titlebar__controls').exists()).toBe(true)
    expect(mountBar({ host: 'web' }).find('.et-titlebar__controls').exists()).toBe(false)
  })

  it('windowControls=false：桌面壳也不渲染控制位', () => {
    stubNavigator({ platform: 'macOS' })
    setDataHost('desktop')
    const wrapper = mountBar({ windowControls: false })
    expect(wrapper.find('.et-titlebar__controls').exists()).toBe(false)
  })
})

describe('EtTitleBar 控制位布局矩阵', () => {
  it('桌面壳 macOS：左置，traffic lights 序（close 先），三钮各有可访问名', () => {
    stubNavigator({ platform: 'macOS' })
    setDataHost('desktop')
    const wrapper = mountBar({ title: '产品' })
    expect(wrapper.find('.et-titlebar__controls--left').exists()).toBe(true)
    expect(wrapper.find('.et-titlebar__controls--right').exists()).toBe(false)
    const buttons = wrapper.findAll('.et-titlebar__controls--left button')
    expect(buttons).toHaveLength(3)
    expect(buttons.map((b) => b.attributes('aria-label'))).toEqual(
      WINDOW_CONTROLS.mac.map((n) => ({ close: '关闭', minimize: '最小化', maximize: '最大化' })[n]),
    )
    // 16 档图标（库内已注册名走 EtIcon 解析）
    expect(buttons[0].find('.et-icon').exists()).toBe(true)
  })

  it('桌面壳 Windows：右置，序 minimize 先', () => {
    stubNavigator({ platform: 'Windows' })
    setDataHost('desktop')
    const wrapper = mountBar({ title: '产品' })
    expect(wrapper.find('.et-titlebar__controls--left').exists()).toBe(false)
    const buttons = wrapper.findAll('.et-titlebar__controls--right button')
    expect(buttons).toHaveLength(3)
    expect(buttons.map((b) => b.attributes('aria-label'))).toEqual(['最小化', '最大化', '关闭'])
  })

  it('桌面壳 Linux：右置（未知平台保险值同右侧序）', () => {
    stubNavigator({ platform: 'Linux' })
    setDataHost('desktop')
    const wrapper = mountBar({ title: '产品' })
    expect(wrapper.find('.et-titlebar__controls--right').exists()).toBe(true)
  })

  it('DOM 序与视觉序一致（mac 控制位在首、Win 在尾）', () => {
    stubNavigator({ platform: 'macOS' })
    setDataHost('desktop')
    const mac = mountBar({ title: '产品', docTitle: '文档' }).html()
    expect(mac.indexOf('controls--left')).toBeLessThan(mac.indexOf('et-titlebar__brand'))
    expect(mac.indexOf('et-titlebar__brand')).toBeLessThan(mac.indexOf('et-titlebar__doc'))

    stubNavigator({ platform: 'Windows' })
    const win = mountBar({ title: '产品', docTitle: '文档' }).html()
    expect(win.indexOf('et-titlebar__doc')).toBeLessThan(win.indexOf('controls--right'))
  })
})

describe('EtTitleBar 事件与槽位', () => {
  it('点击控制钮发 window-control(name)；close 带危险位类', async () => {
    stubNavigator({ platform: 'macOS' })
    setDataHost('desktop')
    const wrapper = mountBar()
    const buttons = wrapper.findAll('.et-titlebar__ctrl')
    await buttons[0].trigger('click')
    await buttons[2].trigger('click')
    expect(wrapper.emitted('window-control')).toEqual([['close'], ['maximize']])
    expect(buttons[0].classes()).toContain('is-danger')
    expect(buttons[1].classes()).not.toContain('is-danger')
  })

  it('docTitle 空不渲染文档名位；有值渲染；center 槽可替换', () => {
    stubNavigator({ platform: 'Windows' })
    setDataHost('desktop')
    expect(mountBar({ docTitle: '' }).find('.et-titlebar__doc').exists()).toBe(false)
    expect(mountBar({ docTitle: '预算表.xlsx' }).find('.et-titlebar__doc').text()).toBe('预算表.xlsx')
    const custom = mountBar({ docTitle: '预算表.xlsx' }, { center: '<span class="c-doc">自定义文档位</span>' })
    expect(custom.find('.et-titlebar__doc .c-doc').text()).toBe('自定义文档位')
  })

  it('brand 槽替换产品名位；quick 槽渲染快捷访问位', () => {
    const wrapper = mountBar(
      { title: '默认产品' },
      { brand: '<b class="b-brand">品牌</b>', quick: '<span class="b-quick">保存</span>' },
    )
    expect(wrapper.find('.et-titlebar__brand .b-brand').text()).toBe('品牌')
    expect(wrapper.find('.et-titlebar__quick .b-quick').exists()).toBe(true)
  })

  it('无 title 无槽时产品名位不渲染（不占位）', () => {
    const wrapper = mountBar()
    expect(wrapper.find('.et-titlebar__brand').exists()).toBe(false)
    expect(wrapper.find('.et-titlebar__group').exists()).toBe(false)
  })
})

describe('EtTitleBar chrome 纪律', () => {
  it('拖拽带是纯空白条带（不包任何按钮，与可点区零重叠）', () => {
    stubNavigator({ platform: 'macOS' })
    setDataHost('desktop')
    const wrapper = mountBar({ title: '产品', docTitle: '文档' }, { quick: '<span class="q">保存</span>' })
    const drags = wrapper.findAll('.et-titlebar__drag')
    expect(drags).toHaveLength(2)
    for (const band of drags) {
      expect(band.element.children).toHaveLength(0)
      expect(band.text()).toBe('')
    }
    // 控制位与快捷位在拖拽带之外（可点区不落在 drag 区里）
    expect(wrapper.findAll('.et-titlebar__drag .et-titlebar__ctrl')).toHaveLength(0)
    expect(wrapper.findAll('.et-titlebar__drag .q')).toHaveLength(0)
  })

  it('高度走 chrome 令牌（--et-chrome-titlebar-height），样式无 px 字面量', () => {
    expect(mountBar().classes()).toContain('et-titlebar')
    expect(STYLE_CSS).toMatch(/height:\s*var\(--et-chrome-titlebar-height\)/)
    expect(STYLE_CSS).not.toMatch(/(?:height|width|padding|margin|gap|inset)[^:]*:\s*[^;]*\d+px/)
  })

  it('close 危险位走 --et-state-danger-* 语义令牌（组件层只消费 --et-*，不跨层直喝底座）', () => {
    expect(STYLE_CSS).toMatch(/is-danger:hover[\s\S]*?var\(--et-state-danger-bg\)/)
    expect(STYLE_CSS).toMatch(/is-danger:hover[\s\S]*?var\(--et-state-danger-fg\)/)
    expect(STYLE_CSS).not.toMatch(/var\(--eb-color-danger[^)]*\)/)
  })

  it('规则实际命中：根高度声明即令牌引用（jsdom 无布局引擎，var() 原样返回）', () => {
    const wrapper = mountBar({ title: '产品' }, { attachTo: document.body })
    const cs = getComputedStyle(wrapper.element)
    // jsdom 不解析 var()：拿到字面量 var(--et-chrome-titlebar-height) 恰好证明
    // 匹配到的声明是令牌引用（真浏览器里求值为 32px），不是 px 字面量
    expect(['32px', 'var(--et-chrome-titlebar-height)']).toContain(cs.height)
    expect(cs.display).toBe('flex')
    expect(cs.userSelect).toBe('none')
    wrapper.unmount()
  })

  it('控制位钮：16 档见方 + 24px 命中区外扩（透明伪元素不吃行高）', () => {
    stubNavigator({ platform: 'macOS' })
    setDataHost('desktop')
    const wrapper = mountBar({ title: '产品' }, { attachTo: document.body })
    const ctrl = wrapper.find('.et-titlebar__ctrl').element
    const cs = getComputedStyle(ctrl)
    expect(['16px', 'var(--et-icon-sm)']).toContain(cs.width)
    expect(['16px', 'var(--et-icon-sm)']).toContain(cs.height)
    expect(STYLE_CSS).toMatch(/inset:\s*calc\(\(var\(--et-tabstrip-close-hit-area\)/)
    wrapper.unmount()
  })
})
