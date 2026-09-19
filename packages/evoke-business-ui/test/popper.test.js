import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EbPopper from '../src/components/popper/index.vue'

/**
 * EbPopper 浮层基座直测 —— Tooltip/Popover/Dropdown/Select 共用同一套
 * 触发/延时/外部关闭/清理逻辑，此前只被消费方间接经过，本文件锁定基座自身契约。
 */

const wait = (ms = 30) => new Promise((r) => setTimeout(r, ms))

let wrapper
const hosts = []

/** 外部虚拟参考元素（虚拟触发模式消费真实 DOM 元素，非 Vue ref），随用例卸载清理 */
function makeHost(cls = 'virtual-host') {
  const el = document.createElement('div')
  el.className = cls
  document.body.appendChild(el)
  hosts.push(el)
  return el
}

function mountPopper(props = {}, slots = {}) {
  wrapper = mount(EbPopper, {
    props,
    slots: {
      trigger: '<button class="t">触发</button>',
      default: '<div class="c">浮层内容</div>',
      ...slots,
    },
    attachTo: document.body,
  })
  return wrapper
}

/** 触发器元素（真实 DOM，供事件派发与 offsetWidth 打桩） */
function triggerEl() {
  return document.querySelector('.eb-popper-trigger')
}

/** 浮层元素：Teleport 至 body，不经 wrapper.find 查询 */
function popperEl() {
  return document.querySelector('.eb-popper')
}

function fire(el, type, init = {}) {
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, ...init }))
}

async function openByHover() {
  fire(triggerEl(), 'mouseenter')
  await wait()
}

async function leaveAndSettle() {
  fire(triggerEl(), 'mouseleave')
  await wait(260)
}

afterEach(async () => {
  wrapper?.unmount()
  wrapper = null
  await wait(10)
  document.querySelectorAll('.eb-popper, .eb-popper-trigger').forEach((el) => el.remove())
  hosts.splice(0).forEach((el) => el.remove())
})

describe('EbPopper 渲染骨架', () => {
  it('初始仅渲染触发器，浮层不进入 DOM', () => {
    mountPopper()
    expect(triggerEl()).toBeTruthy()
    expect(triggerEl().getAttribute('style')).toContain('inline-flex')
    expect(popperEl()).toBeNull()
  })

  it('class/style 只透传到触发器，浮层不吃触发器属性', async () => {
    wrapper = mount(EbPopper, {
      attrs: { class: 'ext-cls', style: 'color: rgb(1, 2, 3)' },
      slots: { trigger: '<b>t</b>', default: '<div>c</div>' },
      attachTo: document.body,
    })
    await wait()
    await openByHover()
    expect(triggerEl().classList.contains('ext-cls')).toBe(true)
    expect(popperEl().classList.contains('ext-cls')).toBe(false)
    expect(popperEl().getAttribute('style')).not.toContain('rgb(1, 2, 3)')
  })

  it('浮层带 role=tooltip、z-index 抬到浮层区间，popperClass 附加其上', async () => {
    mountPopper({ popperClass: 'my-popper' })
    await openByHover()
    const el = popperEl()
    expect(el.getAttribute('role')).toBe('tooltip')
    expect(el.classList.contains('my-popper')).toBe(true)
    expect(Number(el.style.zIndex)).toBeGreaterThanOrEqual(2000)
    expect(el.textContent).toContain('浮层内容')
  })

  it('箭头默认不渲染，show-arrow 开启', async () => {
    mountPopper()
    await openByHover()
    expect(popperEl().querySelector('.eb-popper__arrow')).toBeNull()
    wrapper.unmount()
    mountPopper({ showArrow: true })
    await openByHover()
    expect(popperEl().querySelector('.eb-popper__arrow')).toBeTruthy()
  })
})

describe('EbPopper hover 触发', () => {
  it('mouseenter 打开并 emit show，mouseleave 经 hideAfter 默认 200ms 后关闭', async () => {
    mountPopper()
    await openByHover()
    expect(wrapper.emitted('show')).toHaveLength(1)
    expect(popperEl()).toBeTruthy()

    fire(triggerEl(), 'mouseleave')
    await wait(40)
    expect(popperEl()).toBeTruthy()
    await wait(240)
    expect(popperEl()).toBeNull()
    expect(wrapper.emitted('hide')).toHaveLength(1)
  })

  it('show-after 生效：延时窗口内不打开', async () => {
    mountPopper({ showAfter: 120 })
    fire(triggerEl(), 'mouseenter')
    await wait(40)
    expect(popperEl()).toBeNull()
    await wait(160)
    expect(popperEl()).toBeTruthy()
  })

  it('hide-after=0 时离开即关', async () => {
    mountPopper({ hideAfter: 0 })
    await openByHover()
    fire(triggerEl(), 'mouseleave')
    await wait(20)
    expect(popperEl()).toBeNull()
  })

  it('指针移入浮层本体取消关闭（保活），移出浮层才关', async () => {
    mountPopper()
    await openByHover()
    fire(triggerEl(), 'mouseleave')
    await wait(40)
    fire(popperEl(), 'mouseenter')
    await wait(300)
    expect(popperEl()).toBeTruthy()

    fire(popperEl(), 'mouseleave')
    await wait(260)
    expect(popperEl()).toBeNull()
  })

  it('disabled 拦截打开；打开期间转 disabled 立即收起并 emit hide', async () => {
    mountPopper({ disabled: true })
    await openByHover()
    expect(popperEl()).toBeNull()
    expect(wrapper.emitted('show')).toBeUndefined()

    wrapper.setProps({ disabled: false })
    await wait()
    await openByHover()
    expect(popperEl()).toBeTruthy()

    wrapper.setProps({ disabled: true })
    await wait()
    expect(popperEl()).toBeNull()
    expect(wrapper.emitted('hide')).toHaveLength(1)
  })
})

describe('EbPopper click / focus / contextmenu 触发', () => {
  it('click 点击开合，并阻止冒泡到祖先', async () => {
    mountPopper({ trigger: 'click' })
    const spy = vi.fn()
    document.body.addEventListener('click', spy)
    fire(triggerEl().querySelector('.t'), 'click')
    await wait()
    expect(popperEl()).toBeTruthy()
    expect(spy).not.toHaveBeenCalled()

    fire(triggerEl(), 'click')
    await wait(40)
    expect(popperEl()).toBeTruthy()
    await wait(240)
    expect(popperEl()).toBeNull()
    document.body.removeEventListener('click', spy)
  })

  it('click 模式：外部按下走 doClose 立即收起（不等 hideAfter）', async () => {
    mountPopper({ trigger: 'click' })
    fire(triggerEl(), 'click')
    await wait()
    expect(popperEl()).toBeTruthy()

    fire(popperEl().querySelector('.c'), 'pointerdown')
    await wait()
    expect(popperEl()).toBeTruthy()

    fire(document.body, 'pointerdown')
    await wait(20)
    expect(popperEl()).toBeNull()
  })

  it('focus 模式:focusin 打开、focusout 同样经 hideAfter 延时关闭', async () => {
    mountPopper({ trigger: 'focus' })
    triggerEl().querySelector('.t').dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await wait()
    expect(popperEl()).toBeTruthy()

    triggerEl().dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    await wait(40)
    expect(popperEl()).toBeTruthy()
    await wait(240)
    expect(popperEl()).toBeNull()
  })

  it('contextmenu 模式:阻止原生菜单并打开', async () => {
    mountPopper({ trigger: 'contextmenu' })
    const evt = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    triggerEl().dispatchEvent(evt)
    await wait()
    expect(evt.defaultPrevented).toBe(true)
    expect(popperEl()).toBeTruthy()
  })
})

describe('EbPopper manual / 键盘 / 定位选项', () => {
  it('manual 模式忽略指针事件，仅由 visible 驱动', async () => {
    mountPopper({ trigger: 'manual', visible: false })
    fire(triggerEl(), 'mouseenter')
    fire(triggerEl(), 'click')
    await wait()
    expect(popperEl()).toBeNull()

    await wrapper.setProps({ visible: true })
    await wait()
    expect(popperEl()).toBeTruthy()

    await wrapper.setProps({ visible: false })
    await wait()
    expect(popperEl()).toBeNull()
  })

  it('manual + 初始 visible=true 挂载即开（immediate 监听）', async () => {
    mountPopper({ trigger: 'manual', visible: true })
    await wait()
    expect(popperEl()).toBeTruthy()
  })

  it('ESC 收起打开中的浮层', async () => {
    mountPopper()
    await openByHover()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await wait()
    expect(popperEl()).toBeNull()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
    await wait()
    expect(popperEl()).toBeNull()
  })

  it('match-width 让浮层最小宽度跟随触发器宽度', async () => {
    mountPopper({ matchWidth: true })
    Object.defineProperty(triggerEl(), 'offsetWidth', { value: 240, configurable: true })
    await openByHover()
    expect(popperEl().style.minWidth).toBe('240px')
  })

  it('placement/offset 改变不阻断开关（定位参数透传 floating-ui）', async () => {
    mountPopper({ placement: 'top-start', offset: 20 })
    await openByHover()
    expect(popperEl()).toBeTruthy()
    expect(popperEl().style.position).toBe('fixed')
  })
})

describe('EbPopper 虚拟触发与实例接口', () => {
  it('virtual-triggering 不自渲染触发器，由外部元素驱动', async () => {
    const host = makeHost()
    mountPopper({ trigger: 'hover', virtualTriggering: true, virtualRef: host })
    expect(document.querySelector('.eb-popper-trigger')).toBeNull()

    fire(host, 'mouseenter')
    await wait()
    expect(popperEl()).toBeTruthy()

    fire(document.body, 'pointerdown')
    await wait()
    expect(popperEl()).toBeNull()
  })

  it('defineExpose 暴露 open/close/show/update 供外部命令式控制', async () => {
    mountPopper({ trigger: 'manual' })
    wrapper.vm.open()
    await wait()
    expect(wrapper.vm.show).toBe(true)
    expect(popperEl()).toBeTruthy()
    expect(typeof wrapper.vm.update).toBe('function')

    wrapper.vm.close()
    await wait(40)
    expect(wrapper.vm.show).toBe(true)
    await wait(240)
    expect(wrapper.vm.show).toBe(false)
    expect(popperEl()).toBeNull()
  })
})

describe('EbPopper 参考元素/触发方式动态重绑', () => {
  it('虚拟触发换 virtual-ref：旧元素解绑、新元素接管', async () => {
    const before = makeHost('vh-a')
    const after = makeHost('vh-b')
    mountPopper({ trigger: 'hover', virtualTriggering: true, virtualRef: before })

    await wrapper.setProps({ virtualRef: after })
    await wait()

    fire(before, 'mouseenter')
    await wait()
    expect(popperEl()).toBeNull()

    fire(after, 'mouseenter')
    await wait()
    expect(popperEl()).toBeTruthy()
  })

  it('虚拟触发挂载后补 virtual-ref（异步拿到目标）即刻可驱动', async () => {
    mountPopper({ trigger: 'hover', virtualTriggering: true, virtualRef: null })
    await wait()
    expect(popperEl()).toBeNull()

    const host = makeHost()
    await wrapper.setProps({ virtualRef: host })
    await wait()
    fire(host, 'mouseenter')
    await wait()
    expect(popperEl()).toBeTruthy()
  })

  it('虚拟触发换 trigger：旧事件形态失效，新事件形态生效', async () => {
    const host = makeHost()
    mountPopper({ trigger: 'hover', virtualTriggering: true, virtualRef: host })

    await wrapper.setProps({ trigger: 'click' })
    await wait()
    fire(host, 'mouseenter')
    await wait()
    expect(popperEl()).toBeNull()

    fire(host, 'click')
    await wait()
    expect(popperEl()).toBeTruthy()
  })

  it('常规触发器换 trigger 同样重绑（click → hover）', async () => {
    mountPopper({ trigger: 'click' })
    await wrapper.setProps({ trigger: 'hover' })
    await wait()

    fire(triggerEl(), 'click')
    await wait()
    expect(popperEl()).toBeNull()

    fire(triggerEl(), 'mouseenter')
    await wait()
    expect(popperEl()).toBeTruthy()
  })
})

describe('EbPopper 卸载清理', () => {
  it('卸载后浮层节点移出 DOM，全局监听解绑不再触发关闭逻辑', async () => {
    mountPopper()
    await openByHover()
    expect(popperEl()).toBeTruthy()

    wrapper.unmount()
    await wait(20)
    expect(popperEl()).toBeNull()
    wrapper = null

    expect(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      fire(document.body, 'pointerdown')
    }).not.toThrow()
    await wait()
    expect(popperEl()).toBeNull()
  })

  it('关闭计时器在卸载时清空：卸载后不会再 emit hide', async () => {
    mountPopper()
    await openByHover()
    fire(triggerEl(), 'mouseleave')
    await wait(20)
    wrapper.unmount()
    await wait(260)
    expect(wrapper.emitted('hide')).toBeUndefined()
  })
})
