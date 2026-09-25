import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import EtContextMenu from '../src/components/context-menu/index.vue'
import EtToolButton from '../src/components/tool-button/index.vue'
import EbContextMenu from '../../evoke-business-ui/src/components/context-menu/index.vue'
import { createCommandRegistry } from '../src/runtime/command/registry'

const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

afterEach(() => {
  document.body.innerHTML = ''
})

function makeRegistry() {
  const r = createCommandRegistry()
  const spies = { copy: 0, bold: 0, insert: 0 }
  r.registerAll([
    { id: 'copy', title: '复制', icon: 'copy', run: () => spies.copy++ },
    { id: 'bold', title: '加粗', icon: 'bold', active: (ctx) => !!ctx.bold, run: () => spies.bold++ },
    { id: 'clear', title: '清除', icon: 'close', enabled: (ctx) => !!ctx.canClear, run: () => {} },
    { id: 'insert', title: '插入', icon: 'plus', run: () => spies.insert++ },
  ])
  r.spies = spies
  return r
}

// 分区（separator）+ 子菜单（submenu）+ 一条条件禁用命令（clear）
const SCHEMA = [
  { key: 'c-copy', type: 'item', command: 'copy' },
  { key: 'c-bold', type: 'item', command: 'bold' },
  { key: 'c-sep', type: 'separator' },
  { key: 'c-clear', type: 'item', command: 'clear' },
  { key: 'c-more', type: 'submenu', label: '更多', children: [{ key: 's-insert', type: 'item', command: 'insert' }] },
]

function baseItems(wrapper) {
  return wrapper.findComponent(EbContextMenu).props('items')
}

describe('EtContextMenu（M1 交付物 5 / 底座 EbContextMenu 适配）', () => {
  it('schema → items：separator → divided、submenu → children、item 映射命令', () => {
    const registry = makeRegistry()
    const ctx = { canClear: false }
    const wrapper = mount(EtContextMenu, { props: { registry, schema: SCHEMA, ctx } })

    const items = baseItems(wrapper)
    const byCmd = (id) => items.find((i) => i.command === id)

    // item → command/label/icon
    expect(byCmd('copy')).toMatchObject({ command: 'copy', label: '复制', icon: 'copy', disabled: false })
    // separator 落在紧随其后的 clear 上 → divided 为真（底座 divided 语义：线画在该项上方）
    expect(byCmd('clear').divided).toBe(true)
    // 首两项不在分隔之后 → divided 假
    expect(byCmd('copy').divided).toBe(false)
    expect(byCmd('bold').divided).toBe(false)

    // submenu → 递归 children
    const more = items.find((i) => i.label === '更多')
    expect(Array.isArray(more.children)).toBe(true)
    expect(more.children[0]).toMatchObject({ command: 'insert', label: '插入' })

    wrapper.unmount()
  })

  it('前导 / 连续分隔折叠为无 divider 的项', () => {
    const registry = makeRegistry()
    const schema = [
      { key: 's1', type: 'separator' },
      { key: 'c-copy', type: 'item', command: 'copy' },
      { key: 's2', type: 'separator' },
      { key: 's3', type: 'separator' },
      { key: 'c-bold', type: 'item', command: 'bold' },
    ]
    const wrapper = mount(EtContextMenu, { props: { registry, schema } })
    const items = baseItems(wrapper)
    // 前导分隔不污染首项；连续分隔折叠为 bold 上方一条
    expect(items.find((i) => i.command === 'copy').divided).toBe(false)
    expect(items.find((i) => i.command === 'bold').divided).toBe(true)
    wrapper.unmount()
  })

  it('菜单与工具区对同一命令 enabled/active 断言一致（同走 registry.state）', () => {
    const registry = makeRegistry()
    const ctx = { canClear: false, bold: true }

    const menu = mount(EtContextMenu, { props: { registry, schema: SCHEMA, ctx } })
    const menuClear = baseItems(menu).find((i) => i.command === 'clear')
    const menuCopy = baseItems(menu).find((i) => i.command === 'copy')

    // 工具区（M0 EtToolButton）由消费方以**同一个** registry.state(id, ctx) 供给 :disabled / :active
    const stClear = registry.state('clear', ctx)
    const stCopy = registry.state('copy', ctx)
    const toolClear = mount(EtToolButton, {
      props: { icon: 'close', label: '清除', disabled: !stClear.enabled, active: stClear.active },
      attachTo: document.body,
    })
    const toolBold = mount(EtToolButton, {
      props: { icon: 'bold', label: '加粗', disabled: !registry.state('bold', ctx).enabled, active: registry.state('bold', ctx).active },
      attachTo: document.body,
    })

    // 禁用命令：菜单 disabled 与工具区按钮 disabled 属性同值（false enabled → true disabled）
    expect(menuClear.disabled).toBe(true)
    expect(toolClear.find('button').element.disabled).toBe(menuClear.disabled)
    // 可用命令：两端同为 false disabled
    expect(menuCopy.disabled).toBe(false)
    // active 判据同源：工具区 aria-pressed 与 registry.state.active 一致（菜单命令面板同取此值）
    expect(toolBold.attributes('aria-pressed')).toBe('true')

    menu.unmount()
    toolClear.unmount()
    toolBold.unmount()
  })

  it('打开后焦点接入浮层根（tabindex=-1 + focus）', async () => {
    const registry = makeRegistry()
    const wrapper = mount(EtContextMenu, {
      props: { registry, schema: SCHEMA },
      slots: { default: () => h('button', '区域') },
      attachTo: document.body,
    })
    wrapper.vm.open({ x: 5, y: 5 })
    await tick()

    const root = document.querySelector('.eb-context-menu__popper')
    expect(root).toBeTruthy()
    expect(root.getAttribute('tabindex')).toBe('-1')
    expect(document.activeElement).toBe(root)
    wrapper.unmount()
  })

  it('键盘漫游：ArrowDown 改变 active（跳过禁用）、Enter emit command、焦点归还触发器', async () => {
    const registry = makeRegistry()
    const ctx = { canClear: false }
    const wrapper = mount(EtContextMenu, {
      props: { registry, schema: SCHEMA, ctx },
      slots: { default: () => h('button', '区域') },
      attachTo: document.body,
    })
    const trigger = wrapper.find('button').element
    trigger.focus() // 记录归还目标
    wrapper.vm.open({ x: 5, y: 5 })
    await tick()

    const enabled = () => [...document.querySelectorAll('.eb-context-menu__item:not(.is-disabled)')]
    // clear 禁用 → 可漫游项 = 复制 / 加粗 / 更多
    expect(enabled()).toHaveLength(3)

    // ArrowDown：从浮层根落到第一个可漫游项（跳过禁用的清除）
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(document.activeElement.classList.contains('eb-context-menu__item')).toBe(true)
    expect(document.activeElement.textContent).toContain('复制')

    // ArrowDown：再到加粗
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(document.activeElement.textContent).toContain('加粗')

    // Enter：执行 active 项 → emit command(id) + 关闭 + 焦点归还触发器。
    // EtContextMenu 只上抛命令 id，不自行 run（执行体由消费方接到 @command 后调 registry.run，
    // 与工具区 EtToolButton 的 @click 同一套声明式约定）；故此处断言 emit 与焦点，不断言 run。
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    await tick()
    expect(wrapper.emitted('command')).toBeTruthy()
    expect(wrapper.emitted('command')[0]).toEqual(['bold'])
    expect(registry.spies.bold).toBe(0)
    expect(document.activeElement).toBe(trigger)
    wrapper.unmount()
  })

  it('Escape 触发关闭（底座负责）并焦点归还触发器', async () => {
    const registry = makeRegistry()
    const wrapper = mount(EtContextMenu, {
      props: { registry, schema: SCHEMA },
      slots: { default: () => h('button', '区域') },
      attachTo: document.body,
    })
    const trigger = wrapper.find('button').element
    trigger.focus()
    wrapper.vm.open({ x: 5, y: 5 })
    await tick()
    expect(wrapper.emitted('visible-change')).toContainEqual([true])

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await tick()
    expect(wrapper.emitted('visible-change')).toContainEqual([false])
    expect(document.querySelector('.eb-context-menu__popper')).toBeNull()
    expect(document.activeElement).toBe(trigger)
    wrapper.unmount()
  })
})
