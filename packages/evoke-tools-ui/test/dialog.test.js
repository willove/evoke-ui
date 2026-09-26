import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EtDialog from '../src/components/dialog/index.vue'

/**
 * EtDialog 组件契约（tools-ui 计划 05 §三 / 07 M3 交付物 / L4）
 *
 * 焦点三条（打开落点 / Tab 陷阱循环 / Esc 收敛 + 归还）走 runtime/focus/trap
 * 纯函数契约（focus-trap.test.js 已单测判定逻辑；这里测组件侧装配）：
 *   ① 打开后焦点落面板内第一个可聚焦元素；
 *   ② Tab 末位循环回首位、Shift+Tab 首位回末位；
 *   ③ Esc 关 + 焦点归还触发器；触发器已卸载 → 容器内第一个；
 *   ④ confirm / cancel 都 emit 并关闭；closeOnEsc=false 不关；
 *   ⑤ 遮罩点击语义（closeOnClickMask）。
 */

const flush = (ms = 30) => new Promise((r) => setTimeout(r, ms))

const BODY_SLOT = '<button class="probe-first">第一步</button><button class="probe-last">第二步</button>'

function openDialog(props = {}) {
  return mount(EtDialog, {
    props: { modelValue: true, title: '删除确认', ...props },
    slots: { default: BODY_SLOT },
    attachTo: document.body,
  })
}

function pressKey(el, key, init = {}) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }))
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('EtDialog（M3 交付物：模态 + 焦点陷阱与 Esc 收敛）', () => {
  it('打开后焦点落在面板内第一个可聚焦元素', async () => {
    const wrapper = openDialog()
    await flush()
    expect(document.querySelector('.et-dialog__panel')).toBeTruthy()
    expect(document.activeElement).toBe(document.querySelector('.probe-first'))
    // width prop：默认 520px；Number 走 px，String 原样（calc 限界在 CSS）
    expect(document.querySelector('.et-dialog__panel').style.width).toBe('520px')
    wrapper.unmount()

    const numeric = openDialog({ width: 640 })
    await flush()
    expect(document.querySelector('.et-dialog__panel').style.width).toBe('640px')
    numeric.unmount()

    const stringy = openDialog({ width: '40vw' })
    await flush()
    expect(document.querySelector('.et-dialog__panel').style.width).toBe('40vw')
    stringy.unmount()
  })

  it('Tab / Shift+Tab 在陷阱内循环：末位回首位、首位回末位', async () => {
    const wrapper = openDialog()
    await flush()
    const first = document.querySelector('.probe-first')
    const last = document.querySelector('.probe-last')

    last.focus()
    pressKey(last, 'Tab')
    await flush()
    expect(document.activeElement).toBe(first)

    first.focus()
    pressKey(first, 'Tab', { shiftKey: true })
    await flush()
    expect(document.activeElement).toBe(last)
    wrapper.unmount()
  })

  it('Esc 关闭并归还焦点给打开前的触发器', async () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    const wrapper = openDialog()
    await flush()
    expect(document.activeElement).toBe(document.querySelector('.probe-first'))

    pressKey(document.activeElement, 'Escape')
    await flush()

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    // 消费方收起 prop 后（v-model 语义）面板卸载、焦点归还
    await wrapper.setProps({ modelValue: false })
    await flush()
    expect(document.querySelector('.et-dialog__panel')).toBeNull()
    expect(document.activeElement).toBe(trigger)
    trigger.remove()
    wrapper.unmount()
  })

  it('触发器已卸载时，归还目标退到容器内第一个可聚焦元素', async () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    const wrapper = openDialog()
    await flush()
    const first = document.querySelector('.probe-first')
    const focusSpy = vi.spyOn(first, 'focus')

    // 触发器整块被卸载（消费方把入口那行删了）
    trigger.remove()
    pressKey(document.activeElement, 'Escape')
    await flush()

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    await wrapper.setProps({ modelValue: false })
    await flush()
    // 焦点没丢到野元素上：归还逻辑选了容器内第一个
    expect(focusSpy).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('confirm / cancel 都 emit 并关闭', async () => {
    const wrapper = openDialog({ confirmText: '删除', cancelText: '取消' })
    await flush()

    const [cancelBtn, confirmBtn] = [...document.querySelectorAll('.et-dialog__btn')]
    expect(cancelBtn.textContent).toBe('取消')
    expect(confirmBtn.textContent).toBe('删除')

    confirmBtn.click()
    await flush()
    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    // v-model 语义：消费方收起 prop 后面板才卸载
    await wrapper.setProps({ modelValue: false })
    await flush()
    expect(document.querySelector('.et-dialog__panel')).toBeNull()

    await wrapper.setProps({ modelValue: true })
    await flush()
    const cancelAgain = document.querySelector('.et-dialog__btn:not(.et-dialog__btn--confirm)')
    cancelAgain.click()
    await flush()
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toEqual([[false], [false]])
    wrapper.unmount()
  })

  it('closeOnEsc=false 时 Esc 不收敛（陷阱仍生效）', async () => {
    const wrapper = openDialog({ closeOnEsc: false })
    await flush()
    pressKey(document.activeElement, 'Escape')
    await flush()
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    expect(document.querySelector('.et-dialog__panel')).toBeTruthy()
    wrapper.unmount()
  })

  it('点遮罩自身关闭；closeOnClickMask=false 时不关；点面板不关', async () => {
    const wrapper = openDialog()
    await flush()

    // 点面板：事件目标不是遮罩自身，不关
    document.querySelector('.et-dialog__panel').click()
    await flush()
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()

    document.querySelector('.et-dialog__mask').click()
    await flush()
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    await wrapper.setProps({ modelValue: false })
    await flush()
    expect(document.querySelector('.et-dialog__panel')).toBeNull()
    wrapper.unmount()

    const noMask = openDialog({ closeOnClickMask: false })
    await flush()
    document.querySelector('.et-dialog__mask').click()
    await flush()
    expect(noMask.emitted('update:modelValue')).toBeFalsy()
    expect(document.querySelector('.et-dialog__panel')).toBeTruthy()
    noMask.unmount()
  })
})
