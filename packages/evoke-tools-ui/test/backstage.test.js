import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EtBackstage from '../src/components/backstage/index.vue'

/**
 * EtBackstage 组件契约（tools-ui 计划 05 §四 L4 / 07 M3 交付物 3）
 *
 * M3 出口条件三「全屏页不产生布局跳动」在 jsdom 下的可判定形态：
 *   ① 覆盖层 Teleport 到 body（fixed + inset 0，不进文档流）；
 *   ② 挂载点只留 Teleport 锚点注释（零尺寸）——开/关 innerHTML 不变；
 *   ③ 锁滚动 class 计数式加减，最后一个实例卸载才摘（防中途回弹）。
 * 焦点契约与 EtDialog 同一套（focus-trap 纯函数）：Esc 收敛 + 焦点归还。
 */

const flush = (ms = 30) => new Promise((r) => setTimeout(r, ms))

const LOCK_CLASS = 'et-scroll-lock'
const overlay = () => document.querySelector('.et-backstage')

function mountBackstage(props = {}) {
  return mount(EtBackstage, {
    props: { title: '文件', ...props },
    slots: {
      nav: '<button class="probe-nav">导航一</button>',
      default: '<button class="probe-body">内容一</button>',
    },
    attachTo: document.body,
  })
}

function pressKey(el, key) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}

afterEach(() => {
  document.body.innerHTML = ''
  document.documentElement.classList.remove(LOCK_CLASS)
})

describe('EtBackstage（M3 交付物 3：全屏页骨架）', () => {
  it('打开/关闭不改变挂载点 DOM：覆盖层 Teleport 到 body，锚点零尺寸', async () => {
    const wrapper = mountBackstage({ modelValue: false })
    await flush()
    const mountPoint = wrapper.element.parentElement
    const before = mountPoint.innerHTML

    await wrapper.setProps({ modelValue: true })
    await flush()
    expect(overlay()).toBeTruthy()
    // 挂载点只有 Teleport 锚点注释：开 / 关都不占位（画布尺寸不跳的前提）
    expect(mountPoint.innerHTML).toBe(before)
    expect(mountPoint.firstChild.nodeType).toBe(8) // Comment = 零尺寸锚点
    // 覆盖层在 body 下，不在文档流里
    expect(document.body.contains(overlay())).toBe(true)
    expect(mountPoint.contains(overlay())).toBe(false)

    await wrapper.setProps({ modelValue: false })
    await flush()
    expect(overlay()).toBeNull()
    expect(mountPoint.innerHTML).toBe(before)
    wrapper.unmount()
  })

  it('navWidth prop 内联覆盖导航宽；缺省走令牌默认档', async () => {
    const withWidth = mountBackstage({ modelValue: true, navWidth: 300 })
    await flush()
    expect(overlay().querySelector('.et-backstage__nav').style.width).toBe('300px')
    withWidth.unmount()

    const defaulted = mountBackstage({ modelValue: true })
    await flush()
    // 缺省不写内联宽：走 CSS 的 --eb-sidebar-width 令牌默认档
    expect(overlay().querySelector('.et-backstage__nav').style.width).toBe('')
    defaulted.unmount()
  })

  it('锁滚动 class 计数式加减：多实例重叠时最后一个关闭才摘', async () => {
    const a = mountBackstage({ modelValue: true })
    await flush()
    expect(document.documentElement.classList.contains(LOCK_CLASS)).toBe(true)

    const b = mountBackstage({ modelValue: true })
    await flush()
    expect(document.documentElement.classList.contains(LOCK_CLASS)).toBe(true)

    await a.setProps({ modelValue: false })
    await flush()
    expect(document.documentElement.classList.contains(LOCK_CLASS)).toBe(true)

    await b.setProps({ modelValue: false })
    await flush()
    expect(document.documentElement.classList.contains(LOCK_CLASS)).toBe(false)
    a.unmount()
    b.unmount()
  })

  it('打开中直接卸载也摘锁滚动 class（不留全局泄漏）', async () => {
    const wrapper = mountBackstage({ modelValue: true })
    await flush()
    expect(document.documentElement.classList.contains(LOCK_CLASS)).toBe(true)
    wrapper.unmount()
    expect(document.documentElement.classList.contains(LOCK_CLASS)).toBe(false)
  })

  it('Esc 收敛：emit update:modelValue 且覆盖层卸载', async () => {
    const wrapper = mountBackstage({ modelValue: true })
    await flush()
    // 打开落点 = 容器内第一个可聚焦元素（左导航第一项）
    expect(document.activeElement).toBe(document.querySelector('.probe-nav'))

    pressKey(document.activeElement, 'Escape')
    await flush()

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    await wrapper.setProps({ modelValue: false })
    await flush()
    expect(overlay()).toBeNull()
    wrapper.unmount()
  })

  it('焦点归还：返回钮关闭后焦点还给打开前的触发器', async () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    const wrapper = mountBackstage({ modelValue: true })
    await flush()
    expect(document.activeElement).toBe(document.querySelector('.probe-nav'))

    // 返回钮（aria-label 可访问名，G4）
    const backBtn = document.querySelector('.et-backstage__close')
    expect(backBtn.getAttribute('aria-label')).toBe('返回')
    backBtn.click()
    await flush()

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    await wrapper.setProps({ modelValue: false })
    await flush()
    expect(overlay()).toBeNull()
    expect(document.activeElement).toBe(trigger)
    trigger.remove()
    wrapper.unmount()
  })
})
