import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EtThemeBridge from '../src/components/theme-bridge/index.vue'
import { CANVAS_PALETTE } from '../src/runtime/theme/palette'

/**
 * EtThemeBridge 组件契约（tools-ui 计划 05 §四 L4 验收要点 / 07 M3 出口条件一：
 * 画布调色板随主题联动、无硬编码色值）。
 *
 * 落值观测面 = target 元素行内样式上的画布侧自定义属性（本测试用拼接受理生成
 * 属性名——G1 红线：源码里禁出现完整 --ot-* 字面量，与 src/ 同纪律）。
 */

/** 主题样式 stub：只实现 getPropertyValue（resolveCanvasPalette 只用这一面） */
const stubStyle = (values) => ({ getPropertyValue: (name) => values[name] ?? '' })

/** 画布侧属性名拼接受理（--ot-<角色>） */
const ot = (role) => `--ot-${role}`

/** MutationObserver 回调走微任务：等一个宏任务确保派发完 */
const flush = () => new Promise((resolve) => { setTimeout(resolve, 0) })

const htmlEl = () => document.documentElement

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  htmlEl().removeAttribute('style')
  htmlEl().removeAttribute('data-theme')
  htmlEl().classList.remove('dark')
})

describe('EtThemeBridge 桥接落值', () => {
  it('挂载后把调色板写进 html 行内样式（canvas-bg 等角色落值）', () => {
    vi.stubGlobal('getComputedStyle', () =>
      stubStyle({ '--eb-bg-color': '#ffffff', '--eb-color-primary': '#2f6bff' }),
    )
    const wrapper = mount(EtThemeBridge)
    expect(htmlEl().style.getPropertyValue(ot('canvas-bg'))).toBe('#ffffff')
    expect(htmlEl().style.getPropertyValue(ot('canvas-selection-border'))).toBe('#2f6bff')
    expect(htmlEl().style.getPropertyValue(ot('canvas-active-cell-border'))).toBe('#2f6bff')
    // 主题侧缺令牌的角色不写（不注入空串色，让画布侧自己兜底）
    expect(htmlEl().style.getPropertyValue(ot('canvas-grid-line'))).toBe('')
    wrapper.unmount()
  })

  it('不渲染任何 DOM（桥接是纯副作用：不吃布局不吃事件）', () => {
    const wrapper = mount(EtThemeBridge, { attachTo: document.body })
    // render 返回 null：挂载点里没有任何元素节点（只剩注释占位）
    const host = wrapper.element.parentElement
    expect(host.querySelectorAll('*')).toHaveLength(0)
    wrapper.unmount()
  })

  it('target 支持 Element 与选择器（写入该元素而非 html）', () => {
    vi.stubGlobal('getComputedStyle', () => stubStyle({ '--eb-bg-color': '#ffffff' }))
    const host = document.createElement('div')
    host.className = 'canvas-host'
    document.body.appendChild(host)

    const bySelector = mount(EtThemeBridge, { props: { target: '.canvas-host' } })
    expect(host.style.getPropertyValue(ot('canvas-bg'))).toBe('#ffffff')
    bySelector.unmount()

    host.style.removeProperty(ot('canvas-bg'))
    const byElement = mount(EtThemeBridge, { props: { target: host } })
    expect(host.style.getPropertyValue(ot('canvas-bg'))).toBe('#ffffff')
    byElement.unmount()

    host.remove()
  })

  it('target 解析不到时静默不桥接（不抛、不写）', () => {
    expect(() => mount(EtThemeBridge, { props: { target: '#not-exist' } })).not.toThrow()
    expect(htmlEl().style.getPropertyValue(ot('canvas-bg'))).toBe('')
  })
})

describe('EtThemeBridge 主题联动', () => {
  it('主题 class 变化触发重写（html.dark 暗色联动）', async () => {
    let dark = false
    vi.stubGlobal('getComputedStyle', () =>
      stubStyle(dark ? { '--eb-bg-color': '#111827' } : { '--eb-bg-color': '#ffffff' }),
    )
    const wrapper = mount(EtThemeBridge)
    expect(htmlEl().style.getPropertyValue(ot('canvas-bg'))).toBe('#ffffff')

    dark = true
    htmlEl().classList.add('dark') // business-ui 暗色切换的真实信号
    await flush()
    expect(htmlEl().style.getPropertyValue(ot('canvas-bg'))).toBe('#111827')
    wrapper.unmount()
  })

  it('值没变的属性变化（密度切换）：签名去重，不重复落值', async () => {
    vi.stubGlobal('getComputedStyle', () => stubStyle({ '--eb-bg-color': '#111827' }))
    const wrapper = mount(EtThemeBridge)
    const setPropertySpy = vi.spyOn(htmlEl().style, 'setProperty')

    htmlEl().setAttribute('data-density', 'compact') // 属性在监听名单里，但值签名不变
    await flush()
    expect(setPropertySpy).not.toHaveBeenCalled()
    expect(htmlEl().style.getPropertyValue(ot('canvas-bg'))).toBe('#111827')
    wrapper.unmount()
  })

  it('palette prop 可扩展（产品追加画布角色）', () => {
    vi.stubGlobal('getComputedStyle', () => stubStyle({ '--eb-fill-color-light': '#f9fafb' }))
    const wrapper = mount(EtThemeBridge, {
      props: { palette: { ...CANVAS_PALETTE, 'canvas-brand-band': '--eb-fill-color-light' } },
    })
    expect(htmlEl().style.getPropertyValue(ot('canvas-brand-band'))).toBe('#f9fafb')
    // 默认登记表未被污染（扩展 = 在默认表上追加）
    expect(CANVAS_PALETTE['canvas-bg']).toBe('--eb-bg-color')
    wrapper.unmount()
  })

  it('写值自身也触发订阅，但签名去重不产生自激循环', async () => {
    vi.stubGlobal('getComputedStyle', () => stubStyle({ '--eb-bg-color': '#ffffff' }))
    const wrapper = mount(EtThemeBridge)
    const setPropertySpy = vi.spyOn(htmlEl().style, 'setProperty')
    await flush()
    // 首轮落值已改过 style 属性（订阅源）；再等一拍没有新增写入
    expect(setPropertySpy).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})

describe('EtThemeBridge 退订纪律', () => {
  it('卸载时退订（MutationObserver disconnect 被调，禁观察器泄漏）', () => {
    const instances = []
    class FakeMutationObserver {
      constructor(cb) {
        this.cb = cb
        this.observe = vi.fn()
        this.disconnect = vi.fn()
        instances.push(this)
      }
    }
    vi.stubGlobal('MutationObserver', FakeMutationObserver)

    const wrapper = mount(EtThemeBridge)
    expect(instances).toHaveLength(1)
    expect(instances[0].observe).toHaveBeenCalledTimes(1)

    wrapper.unmount()
    expect(instances[0].disconnect).toHaveBeenCalledTimes(1)
  })
})
