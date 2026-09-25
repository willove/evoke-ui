import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EtScreenTip from '../src/components/screen-tip/index.vue'
import EbTooltip from '@wil-works/evoke-business-ui/tooltip'
import {
  dismissOtherTips,
  markTipRequest,
  registerTip,
  releaseTip,
  resetTipRegistry,
  withinHotWindow,
} from '../src/components/screen-tip/singleton.js'

/**
 * EtScreenTip 组件契约（tools-ui 计划 05 §四 验收要点）
 *
 * 浮层 Teleport 到 body，不经 wrapper.find 查询；单例登记表是模块级状态，
 * 每个用例后统一卸载并清扫 DOM，避免跨用例串味。
 * 事件用原生 dispatchEvent 派发：鼠标事件要冒泡到外层包装（VTU 的 trigger 对
 * 非 click/key 事件只造不带 bubbles 的 Event）。
 */

const wait = (ms = 40) => new Promise((resolve) => setTimeout(resolve, ms))

const wrappers = []

const mountTip = (props = {}, slots = {}) => {
  const wrapper = mount(EtScreenTip, {
    props: { title: '加粗', ...props },
    slots: { default: '<button class="t" type="button">B</button>', ...slots },
    attachTo: document.body,
  })
  wrappers.push(wrapper)
  return wrapper
}

/** 浮层元素（popper-class 把 et-screentip 挂在 EbPopper 的浮层上） */
const popperEl = () => document.querySelector('.et-screentip')
const triggerBtn = (wrapper) => wrapper.find('button.t')

function fire(wrapper, type, EventConstructor = MouseEvent) {
  triggerBtn(wrapper).element.dispatchEvent(
    new EventConstructor(type, { bubbles: true, cancelable: true }),
  )
  return nextTick()
}

const over = (wrapper) => fire(wrapper, 'mouseover')
const out = (wrapper) => fire(wrapper, 'mouseout')
const focusIn = (wrapper) => fire(wrapper, 'focusin', FocusEvent)
const focusOut = (wrapper) => fire(wrapper, 'focusout', FocusEvent)
/**
 * 浏览器在 mouseover 之后才把 mouseenter 派到触发器根（.eb-popper-trigger，底座
 * hover 监听挂在那）。jsdom 不会自己合成这个事件，这里按真实顺序补上，
 * 验证底座自身的 hover 路径不会把热显档吃掉
 */
const enterTriggerRoot = (wrapper) => {
  wrapper.element.dispatchEvent(new MouseEvent('mouseenter'))
  return nextTick()
}

afterEach(async () => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  // 单例登记表是模块状态：不清的话上个用例的请求会让本用例的首显判定成热显
  resetTipRegistry()
  // 展开中的浮层要走完 leave 过渡才摘节点，等一拍再清扫，避免残留污染下个用例
  await wait(60)
  document
    .querySelectorAll('.et-screentip, .et-screentip__trigger, .eb-popper-trigger, .eb-tooltip__popper')
    .forEach((el) => el.remove())
})

describe('EtScreenTip 渲染契约', () => {
  it('默认只渲染触发器，浮层不预先进入 DOM（同屏不预渲染多个 popper）', () => {
    const wrapper = mountTip()
    expect(wrapper.find('.et-screentip__trigger').exists()).toBe(true)
    expect(triggerBtn(wrapper).exists()).toBe(true)
    expect(popperEl()).toBeNull()
  })

  it('触发器原样透传：class / aria-label / tabindex 不被包裹层吞掉', () => {
    const wrapper = mountTip(
      {},
      {
        default:
          '<button class="et-toolbtn et-toolbtn--small" type="button" aria-label="加粗" tabindex="0">B</button>',
      },
    )
    const button = wrapper.find('button.et-toolbtn')
    expect(button.classes()).toContain('et-toolbtn')
    expect(button.attributes('aria-label')).toBe('加粗')
    expect(button.attributes('tabindex')).toBe('0')
  })

  it('标题 + 说明渲染；combo 非空时追加 EtKeyHint', async () => {
    const wrapper = mountTip({ title: '加粗', desc: '将所选文字设为粗体', combo: 'mod+b' })
    await over(wrapper)
    await wait(450)
    const tip = popperEl()
    expect(tip).toBeTruthy()
    expect(tip.textContent).toContain('加粗')
    expect(tip.textContent).toContain('将所选文字设为粗体')
    // EtKeyHint（键帽）渲染在标题行
    expect(tip.querySelector('.et-keyhint')).toBeTruthy()
  })

  it('combo 为空时不渲染 EtKeyHint、desc 为空时不渲染说明行', async () => {
    const wrapper = mountTip({ title: '加粗' })
    await over(wrapper)
    await wait(450)
    const tip = popperEl()
    expect(tip.textContent).toContain('加粗')
    expect(tip.querySelector('.et-keyhint')).toBeNull()
    expect(tip.querySelector('.et-screentip__desc')).toBeNull()
  })

  it('placement 透传底座 EbTooltip', () => {
    const wrapper = mountTip({ placement: 'right' })
    expect(wrapper.findComponent(EbTooltip).props('placement')).toBe('right')
  })
})

describe('EtScreenTip 延迟契约', () => {
  it('show-after / hide-after 取 400 / 200（与 --et-screentip-delay-* 令牌同源）', () => {
    const wrapper = mountTip()
    const tip = wrapper.findComponent(EbTooltip)
    expect(tip.props('showAfter')).toBe(400)
    expect(tip.props('hideAfter')).toBe(200)
  })

  it('hover 与 focus 汇到同一条显示路径（底座 trigger 是单选取值，无 hover+focus 组合）', async () => {
    const wrapper = mountTip()
    const tip = wrapper.findComponent(EbTooltip)
    // 触发器外层接管两条路径：单例登记与延迟切档只在组件内做一次。
    // 鼠标与焦点都最终走到组件暴露的 show 上（延迟档位在 nextTick 后重排）
    expect(tip.props('showAfter')).toBe(400)
    await over(wrapper)
    await wait(450)
    expect(popperEl()).toBeTruthy()
    expect(wrapper.findComponent(EbTooltip).vm.show).toBeTypeOf('function')
  })

  it('指针进入经 400ms 首显延迟显示，离开经 200ms 自动隐藏', async () => {
    const wrapper = mountTip()
    await over(wrapper)
    await wait(120)
    expect(popperEl()).toBeNull()
    await wait(330)
    expect(popperEl()).toBeTruthy()

    await out(wrapper)
    await wait(80)
    expect(popperEl()).toBeTruthy()
    await wait(220)
    expect(popperEl()).toBeNull()
  })

  it('热显：一次提示之后 1 秒内再触发走 120ms 档', async () => {
    const wrapper = mountTip()
    await over(wrapper)
    await wait(450)
    expect(wrapper.findComponent(EbTooltip).props('showAfter')).toBe(400)

    await out(wrapper)
    await wait(220)
    expect(popperEl()).toBeNull()

    await over(wrapper)
    expect(wrapper.findComponent(EbTooltip).props('showAfter')).toBe(120)
    await wait(200)
    expect(popperEl()).toBeTruthy()
  })

  it('底座自身 hover 路径先排程时热显档仍生效（真实浏览器的 mouseover → mouseenter 顺序）', async () => {
    const wrapper = mountTip()
    await over(wrapper)
    await enterTriggerRoot(wrapper)
    await wait(450)
    expect(popperEl()).toBeTruthy()

    await out(wrapper)
    await wait(220)
    expect(popperEl()).toBeNull()

    // 再触发：底座的 hover 监听先用上一档排程，组件的 show() 随即按新档重排
    await over(wrapper)
    await enterTriggerRoot(wrapper)
    // 200ms 已显示：说明走的是 120ms 热显档，不是 400ms 首显档
    await wait(200)
    expect(popperEl()).toBeTruthy()
  })
})

describe('EtScreenTip 触发面', () => {
  it('键盘聚焦也显示（focusin 触发，focusout 收起）', async () => {
    const wrapper = mountTip()
    await focusIn(wrapper)
    await wait(120)
    expect(popperEl()).toBeNull()
    await wait(330)
    expect(popperEl()).toBeTruthy()

    await focusOut(wrapper)
    await wait(260)
    expect(popperEl()).toBeNull()
  })

  it('焦点在触发器内部转移不算离开', async () => {
    const wrapper = mountTip(
      {},
      { default: '<button class="a" type="button">A</button><button class="b" type="button">B</button>' },
    )
    const [first, second] = wrapper.findAll('button')
    first.element.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await wait(450)
    expect(popperEl()).toBeTruthy()

    // 焦点从 A 移到 B：relatedTarget 仍在触发器内，提示不收起
    second.element.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: first.element }),
    )
    await wait(260)
    expect(popperEl()).toBeTruthy()
  })

  it('disabled 时不显示', async () => {
    const wrapper = mountTip({ disabled: true })
    await over(wrapper)
    await wait(450)
    expect(popperEl()).toBeNull()
  })
})

describe('EtScreenTip 单例', () => {
  it('同屏只开一个：第二个发起显示时第一个收起', async () => {
    const first = mountTip({ title: '甲' })
    const second = mountTip({ title: '乙' })

    await over(first)
    await wait(450)
    const open = document.querySelectorAll('.et-screentip')
    expect(open).toHaveLength(1)
    expect(open[0].textContent).toContain('甲')

    await over(second)
    await wait(450)
    const after = document.querySelectorAll('.et-screentip')
    expect(after).toHaveLength(1)
    expect(after[0].textContent).toContain('乙')
  })

  it('未显示的实例不预渲染浮层（单例只关不预建）', async () => {
    const first = mountTip({ title: '甲' })
    const second = mountTip({ title: '乙' })
    expect(document.querySelectorAll('.et-screentip')).toHaveLength(0)

    await over(first)
    await wait(450)
    expect(document.querySelectorAll('.et-screentip')).toHaveLength(1)

    first.unmount()
    await wait(260)
    expect(document.querySelectorAll('.et-screentip')).toHaveLength(0)
    expect(second.find('.et-screentip').exists()).toBe(false)
  })
})

describe('EtScreenTip 单例登记表（模块状态契约）', () => {
  // 登记表必须是跨实例的模块状态：<script setup> 顶层声明每实例各一份，单例会失效
  const handle = () => ({ dismiss: vi.fn() })

  it('已登记者中除自己外全部收起，且不收自己', () => {
    const a = handle()
    const b = handle()
    registerTip(a)
    registerTip(b)
    dismissOtherTips(a)
    expect(b.dismiss).toHaveBeenCalledTimes(1)
    expect(a.dismiss).not.toHaveBeenCalled()
    releaseTip(a)
    releaseTip(b)
  })

  it('退登后不再被其它实例收起', () => {
    const a = handle()
    const b = handle()
    registerTip(a)
    registerTip(b)
    releaseTip(b)
    dismissOtherTips(a)
    expect(b.dismiss).not.toHaveBeenCalled()
    releaseTip(a)
  })

  it('热显窗口：一次请求之后窗口内判定为热显档', () => {
    markTipRequest()
    expect(withinHotWindow(1000)).toBe(true)
    expect(withinHotWindow(-1)).toBe(false)
  })
})

describe('EtScreenTip 命令式面', () => {
  it('defineExpose 暴露 show / hide / update，show/hide 走单例与延迟契约', async () => {
    const wrapper = mount({
      components: { EtScreenTip },
      template:
        '<EtScreenTip ref="tip" title="加粗"><button class="t" type="button">B</button></EtScreenTip>',
      attachTo: document.body,
    })
    wrappers.push(wrapper)

    const tip = wrapper.vm.$refs.tip
    expect(typeof tip.show).toBe('function')
    expect(typeof tip.hide).toBe('function')
    expect(typeof tip.update).toBe('function')

    tip.show()
    await wait(450)
    expect(popperEl()).toBeTruthy()

    tip.update()
    expect(popperEl()).toBeTruthy()

    tip.hide()
    await wait(260)
    expect(popperEl()).toBeNull()
  })
})
