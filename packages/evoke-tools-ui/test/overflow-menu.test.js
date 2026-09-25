import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EtOverflowMenu from '../src/components/ribbon-bar/overflow.vue'
import { createCommandRegistry } from '../src/runtime/command/registry'

/**
 * EtOverflowMenu 组件契约（tools-ui 计划 05 §四 L2，内部件）
 *
 * 入口计数角标、按组分区渲染、条目点击 emit command、禁用态来自 registry.state、
 * 未注册命令不进菜单。
 */

function makeRegistry() {
  const registry = createCommandRegistry()
  registry.registerAll([
    { id: 'copy', title: '复制', keys: 'mod+c', icon: 'copy', enabled: (ctx) => !!ctx.hasSelection, run: () => {} },
    { id: 'format-painter', title: '格式刷', icon: 'brush', run: () => {} },
    { id: 'bold', title: '加粗', keys: 'mod+b', icon: 'bold', run: () => {} },
    { id: 'italic', title: '倾斜', keys: 'mod+i', icon: 'italic', run: () => {} },
  ])
  return registry
}

/** 被收进的组节点（children 已按档位处理过；菜单只取 item/select） */
const GROUPS = [
  {
    key: 'g-clipboard',
    type: 'group',
    label: '剪贴板',
    children: [
      { key: 'i-copy', type: 'item', command: 'copy' },
      { key: 'i-painter', type: 'item', command: 'format-painter' },
      { key: 'sep', type: 'separator' },
    ],
  },
  {
    key: 'g-font',
    type: 'group',
    label: '字体',
    children: [
      { key: 'i-bold', type: 'item', command: 'bold' },
      { key: 'i-italic', type: 'item', command: 'italic' },
    ],
  },
]

const mounted = []

beforeEach(() => {
  mounted.splice(0)
})

afterEach(() => {
  mounted.splice(0).forEach((wrapper) => wrapper.unmount())
})

const mountMenu = async (props = {}) => {
  const wrapper = mount(EtOverflowMenu, {
    props: { groups: GROUPS, registry: makeRegistry(), ...props },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  await nextTick()
  return wrapper
}

/** 浮层内容经 Teleport 到 body：查询走 document */
const fire = (el, type, EventConstructor = MouseEvent) =>
  el.dispatchEvent(new EventConstructor(type, { bubbles: true, cancelable: true }))

describe('EtOverflowMenu 入口', () => {
  it('入口 = 小钮（icon=more + label）+ 计数角标（收起的条目数）', async () => {
    const wrapper = await mountMenu({ label: '更多' })
    const button = wrapper.find('.et-overflow__entry .et-toolbtn')
    expect(button.exists()).toBe(true)
    expect(button.attributes('aria-label')).toBe('更多')
    const badge = wrapper.find('.et-overflow__badge')
    // copy / format-painter / bold / italic（separator 不计）
    expect(badge.text()).toBe('4')
    expect(badge.attributes('aria-hidden')).toBe('true')
  })

  it('入口 label 可配；无收起条目时角标不渲染', async () => {
    const wrapper = await mountMenu({ label: '其他命令', groups: [] })
    expect(wrapper.find('.et-overflow__entry .et-toolbtn').attributes('aria-label')).toBe('其他命令')
    expect(wrapper.find('.et-overflow__badge').exists()).toBe(false)
  })
})

describe('EtOverflowMenu 菜单', () => {
  it('点击开下拉：按组分区（组名标题），条目带名称与快捷键', async () => {
    const wrapper = await mountMenu()
    await wrapper.find('.et-overflow__entry .et-toolbtn').trigger('click')
    await nextTick()

    const items = document.querySelectorAll('.eb-dropdown-menu__item')
    expect(items).toHaveLength(4)
    const titles = [...document.querySelectorAll('.et-overflow__title')].map((el) => el.textContent)
    expect(titles).toEqual(['剪贴板', '字体'])
    expect(items[0].textContent).toContain('复制')
    expect(items[0].querySelector('.et-keyhint')).toBeTruthy()
    wrapper.unmount()
  })

  it('条目点击 emit command', async () => {
    const wrapper = await mountMenu()
    await wrapper.find('.et-overflow__entry .et-toolbtn').trigger('click')
    await nextTick()

    const items = document.querySelectorAll('.eb-dropdown-menu__item')
    fire(items[1], 'click')
    await nextTick()
    expect(wrapper.emitted('command')).toEqual([['format-painter']])
  })

  it('禁用态来自 registry.state：禁用项不 emit command', async () => {
    const wrapper = await mountMenu({ registry: makeRegistry() })
    await wrapper.find('.et-overflow__entry .et-toolbtn').trigger('click')
    await nextTick()

    const items = document.querySelectorAll('.eb-dropdown-menu__item')
    // copy 的 enabled = ctx.hasSelection：无选区时为禁用态
    expect(items[0].classList.contains('is-disabled')).toBe(true)
    expect(items[1].classList.contains('is-disabled')).toBe(false)
    fire(items[0], 'click')
    await nextTick()
    expect(wrapper.emitted('command')).toBeUndefined()
  })

  it('未注册的命令不进菜单（与展开态一致）', async () => {
    const registry = createCommandRegistry()
    registry.registerAll([
      { id: 'bold', title: '加粗', run: () => {} },
      { id: 'italic', title: '倾斜', run: () => {} },
    ])
    const wrapper = await mountMenu({ registry })
    expect(wrapper.find('.et-overflow__badge').text()).toBe('2')
    await wrapper.find('.et-overflow__entry .et-toolbtn').trigger('click')
    await nextTick()
    const items = document.querySelectorAll('.eb-dropdown-menu__item')
    expect(items).toHaveLength(2)
    expect([...items].map((el) => el.textContent)[0]).toContain('加粗')
  })
})
