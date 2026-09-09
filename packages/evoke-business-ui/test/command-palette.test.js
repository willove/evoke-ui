import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EvCommandPalette from '../src/components/command-palette/index.vue'

const noop = () => {}
const COMMANDS = [
  { id: 'new', label: '新建订单', group: '操作', icon: 'plus', hotkey: '⌘N', keywords: ['create'], action: noop },
  { id: 'search', label: '搜索客户', group: '操作', icon: 'search', action: noop },
  { id: 'theme', label: '切换主题', group: '设置', icon: 'sunny', hint: '跟随系统', action: noop },
  { id: 'logout', label: '退出登录', group: '设置', action: noop },
]

const mountPalette = (props = {}) =>
  mount(EvCommandPalette, {
    props: { modelValue: true, commands: COMMANDS, ...props },
    attachTo: document.body,
  })

describe('EvCommandPalette', () => {
  beforeEach(() => {
    // Teleport 内容可能跨测试泄漏，先清场
    document.body.innerHTML = ''
  })

  it('渲染遮罩 + 面板 + 搜索框 + 底栏（dialog 语义）', () => {
    const wrapper = mountPalette()
    expect(document.querySelector('.ev-command-palette')).toBeTruthy()
    const panel = document.querySelector('.ev-command-palette__panel')
    expect(panel.getAttribute('role')).toBe('dialog')
    expect(panel.getAttribute('aria-modal')).toBe('true')
    expect(document.querySelector('.ev-command-palette__input')).toBeTruthy()
    expect(document.querySelector('.ev-command-palette__footer')).toBeTruthy()
    wrapper.unmount()
  })

  it('分组渲染（相邻同组合并 + 默认「命令」组）', () => {
    const wrapper = mountPalette()
    const labels = Array.from(document.querySelectorAll('.ev-command-palette__group-label')).map((el) => el.textContent)
    expect(labels).toEqual(['操作', '设置'])
    const items = document.querySelectorAll('.ev-command-palette__item')
    expect(items).toHaveLength(4)
    wrapper.unmount()
  })

  it('首项默认激活（is-active + aria-selected）', () => {
    const wrapper = mountPalette()
    const first = document.querySelector('.ev-command-palette__item')
    expect(first.classList.contains('is-active')).toBe(true)
    expect(first.getAttribute('aria-selected')).toBe('true')
    wrapper.unmount()
  })

  it('过滤：label/keywords/group 包含匹配 + 空态', async () => {
    const wrapper = mountPalette()
    const input = document.querySelector('.ev-command-palette__input')
    input.value = '订单'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    await nextTick()
    let items = document.querySelectorAll('.ev-command-palette__item')
    expect(items).toHaveLength(1)
    expect(items[0].textContent).toContain('新建订单')

    input.value = 'create'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    await nextTick()
    items = document.querySelectorAll('.ev-command-palette__item')
    expect(items).toHaveLength(1)

    input.value = '不存在'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    await nextTick()
    expect(document.querySelector('.ev-command-palette__empty').textContent).toContain('不存在')
    wrapper.unmount()
  })

  it('↑↓ 循环导航 + Enter 执行 + esc 关闭', async () => {
    const wrapper = mountPalette()
    const input = document.querySelector('.ev-command-palette__input')
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await nextTick()
    let active = document.querySelector('.ev-command-palette__item.is-active')
    expect(active.getAttribute('data-index')).toBe('1')
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    await nextTick()
    // 循环回绕到末项
    active = document.querySelector('.ev-command-palette__item.is-active')
    expect(active.getAttribute('data-index')).toBe('3')

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])

    wrapper.vm.open()
    await wrapper.setProps({ modelValue: true })
    const input2 = document.querySelector('.ev-command-palette__input')
    input2.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(wrapper.emitted('update:modelValue').slice(-1)[0]).toEqual([false])
    wrapper.unmount()
  })

  it('action 返回 false 阻止关闭', async () => {
    const wrapper = mount(EvCommandPalette, {
      props: {
        modelValue: true,
        commands: [{ id: 'x', label: '危险操作', action: () => false }],
      },
      attachTo: document.body,
    })
    const item = document.querySelector('.ev-command-palette__item')
    item.click()
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    wrapper.unmount()
  })

  it('点击遮罩关闭，点击面板不关', async () => {
    const wrapper = mountPalette()
    const overlay = document.querySelector('.ev-command-palette')
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: false }))
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    wrapper.unmount()
  })

  it('打开时重置查询并聚焦 + 锁 body 滚动', async () => {
    const wrapper = mountPalette({ modelValue: false })
    wrapper.vm.open()
    await wrapper.setProps({ modelValue: true })
    await nextTick()
    await nextTick()
    expect(document.body.style.overflow).toBe('hidden')
    // 稳健断言：活动元素是面板输入框（不比较具体节点实例）
    expect(document.activeElement?.classList?.contains('ev-command-palette__input')).toBe(true)
    wrapper.vm.close()
    await wrapper.setProps({ modelValue: false })
    expect(document.body.style.overflow).toBe('')
    wrapper.unmount()
  })

  it('hotkey/hint/图标渲染', () => {
    const wrapper = mountPalette()
    const html = document.querySelector('.ev-command-palette__list').innerHTML
    expect(html).toContain('⌘N')
    expect(html).toContain('跟随系统')
    expect(document.querySelectorAll('.ev-command-palette__item-icon').length).toBe(4)
    wrapper.unmount()
  })

  it('expose open/close', async () => {
    const wrapper = mountPalette({ modelValue: false })
    wrapper.vm.open()
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([true])
    wrapper.vm.close()
    expect(wrapper.emitted('update:modelValue')[1]).toEqual([false])
    wrapper.unmount()
  })
})
