import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'

/**
 * EtWorkbench 组件契约（tools-ui 计划 05 §四 L3 验收要点 / 07 M2 出口条件）
 *
 * EtDock 由并行批次落地（src/components/dock/）：本测试按它的 props/emit 契约
 * stub 隔离（dock + maximized 进；update:dock / panel-collapse / panel-expand /
 * panel-close / panel-maximize / panel-restore / dock-toggle 出）。Workbench
 * 是布局树唯一的写处——EtDock 的每个 emit 都要经 tree.js 纯函数变成新树。
 */

// stub 在 import 之前注册（vi.mock 提升）；EtDock 真实件落地后本 stub 可删
vi.mock('../src/components/dock/index.vue', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    default: defineComponent({
      name: 'EtDock',
      props: {
        dock: { type: Object, default: null },
        maximized: { type: String, default: null },
      },
      setup(props, { slots }) {
        return () =>
          h('div', {
            class: 'et-dock-stub',
            'data-dock-id': props.dock?.id ?? '',
            'data-dock-side': props.dock?.side ?? '',
            'data-maximized': props.maximized ?? '',
          }, [
            // #panel 槽内容（面板内容透传链路的观测点）
            slots.panel?.({ panel: props.dock?.panels?.[0] ?? null, dock: props.dock }) ?? [],
          ])
      },
    }),
  }
})

import EtWorkbench from '../src/components/workbench/index.vue'
import EtDock from '../src/components/dock/index.vue'
import {
  findPanel,
  maximizePanel,
  serializeLayout,
  togglePanelCollapsed,
} from '../src/runtime/layout/tree'

const makeDefault = () => ({
  docks: [
    {
      id: 'left',
      side: 'left',
      panels: [
        { id: 'files', title: '文件', size: 280, min: 200, max: 480, closable: false },
        { id: 'search', title: '搜索', size: 240 },
      ],
    },
    { id: 'right', side: 'right', panels: [{ id: 'props', title: '属性', size: 300 }] },
    { id: 'bottom', side: 'bottom', panels: [{ id: 'log', title: '日志', size: 200 }] },
  ],
  maximized: null,
})

/** mock localStorage（loadLayout/saveLayout 只依赖 get/setItem 两面） */
function stubStorage(initial = {}) {
  const store = new Map(Object.entries(initial))
  const getItem = vi.fn((key) => (store.has(key) ? store.get(key) : null))
  const setItem = vi.fn((key, value) => store.set(key, String(value)))
  const removeItem = vi.fn((key) => store.delete(key))
  vi.stubGlobal('localStorage', { getItem, setItem, removeItem })
  return { getItem, setItem, removeItem, store }
}

const mountWorkbench = async (props = {}, slots = {}) => {
  const wrapper = mount(EtWorkbench, {
    props: { layout: makeDefault(), defaultLayout: makeDefault(), ...props },
    slots,
    attachTo: document.body,
  })
  await nextTick()
  return wrapper
}

const lastUpdate = (wrapper) => {
  const record = wrapper.emitted('update:layout')
  return record?.[record.length - 1]?.[0]
}

/** 抓 fake ResizeObserver：本组件不挂观察器（挂了才必须 disconnect） */
const roInstances = []
class FakeResizeObserver {
  constructor(callback) {
    this.callback = callback
    this.observe = vi.fn()
    this.disconnect = vi.fn()
    this.unobserve = vi.fn()
    roInstances.push(this)
  }
}

beforeEach(() => {
  roInstances.splice(0)
  vi.stubGlobal('ResizeObserver', FakeResizeObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('EtWorkbench 区域槽', () => {
  it('titlebar / documents / toolbar / canvas / statusbar 各归其位', async () => {
    const wrapper = await mountWorkbench(
      {},
      {
        titlebar: '<div class="t-title">产品名</div>',
        documents: '<div class="t-docs">文档标签</div>',
        toolbar: '<div class="t-tool">工具区</div>',
        statusbar: '<div class="t-status">就绪</div>',
        default: '<div class="t-canvas">画布</div>',
      },
    )
    expect(wrapper.find('.et-workbench__band--titlebar .t-title').exists()).toBe(true)
    expect(wrapper.find('.et-workbench__band--documents .t-docs').exists()).toBe(true)
    expect(wrapper.find('.et-workbench__band--toolbar .t-tool').exists()).toBe(true)
    expect(wrapper.find('.et-workbench__canvas .t-canvas').exists()).toBe(true)
    expect(wrapper.find('.et-workbench__band--statusbar .t-status').exists()).toBe(true)

    // 顺序：标题栏 → 文档标签位 → 工具栏 → 主体行 → 状态栏
    const html = wrapper.html()
    const at = (sel) => html.indexOf(sel)
    expect(at('band--titlebar')).toBeLessThan(at('band--documents'))
    expect(at('band--documents')).toBeLessThan(at('band--toolbar'))
    expect(at('band--toolbar')).toBeLessThan(at('workbench__body'))
    expect(at('workbench__body')).toBeLessThan(at('band--statusbar'))
    wrapper.unmount()
  })

  it('空槽不渲染横带（不占 chrome 高度）', async () => {
    const wrapper = await mountWorkbench()
    expect(wrapper.find('.et-workbench__band--titlebar').exists()).toBe(false)
    expect(wrapper.find('.et-workbench__band--documents').exists()).toBe(false)
    expect(wrapper.find('.et-workbench__band--toolbar').exists()).toBe(false)
    expect(wrapper.find('.et-workbench__band--statusbar').exists()).toBe(false)
    expect(wrapper.find('.et-workbench__canvas').exists()).toBe(true)
    wrapper.unmount()
  })
})

describe('EtWorkbench 停靠位', () => {
  it('left / right / bottom 按 side 找到对应 EtDock 并收到树里的 dock', async () => {
    const wrapper = await mountWorkbench()
    const docks = wrapper.findAllComponents(EtDock)
    expect(docks).toHaveLength(3)
    // DOM 顺序 = 左 → 右 → 底
    expect(docks.map((d) => d.props('dock').id)).toEqual(['left', 'right', 'bottom'])
    expect(docks.map((d) => d.props('dock').side)).toEqual(['left', 'right', 'bottom'])
    // EtDock 收到完整 dock（面板从 layout.docks 按 side 取）
    expect(docks[0].props('dock').panels.map((p) => p.id)).toEqual(['files', 'search'])
    expect(docks[1].props('dock').panels.map((p) => p.id)).toEqual(['props'])
    expect(docks[2].props('dock').panels.map((p) => p.id)).toEqual(['log'])
    // maximized 透传（null = 无全屏面板）
    expect(docks.map((d) => d.props('maximized'))).toEqual([null, null, null])
    wrapper.unmount()
  })

  it('主体行：左停靠 | 画布 | 右停靠，底停靠通栏', async () => {
    const wrapper = await mountWorkbench()
    expect(wrapper.find('.et-workbench__rail--left .et-dock-stub').exists()).toBe(true)
    expect(wrapper.find('.et-workbench__canvas').exists()).toBe(true)
    expect(wrapper.find('.et-workbench__rail--right .et-dock-stub').exists()).toBe(true)
    expect(wrapper.find('.et-workbench__rail--bottom .et-dock-stub').exists()).toBe(true)
    const html = wrapper.html()
    expect(html.indexOf('rail--left')).toBeLessThan(html.indexOf('workbench__canvas'))
    expect(html.indexOf('workbench__canvas')).toBeLessThan(html.indexOf('rail--right'))
    wrapper.unmount()
  })

  it('panel 内容槽透传到每个 EtDock（作用域带 panel 与 dock）', async () => {
    const wrapper = await mountWorkbench(
      {},
      {
        panel: '<template #default="{ panel, dock }"><div class="p-content">{{ panel.id }}@{{ dock.side }}</div></template>',
      },
    )
    const contents = wrapper.findAll('.p-content')
    expect(contents).toHaveLength(3)
    // 每个 dock 的激活面板（面板序第一个）拿到自己的 id 与所属 side
    expect(contents.map((c) => c.text())).toEqual(['files@left', 'props@right', 'log@bottom'])
    wrapper.unmount()
  })

  it('树里没有某 side 的 dock 时不渲染该停靠列', async () => {
    const wrapper = await mountWorkbench({ layout: makeDefault() })
    expect(wrapper.findAllComponents(EtDock)).toHaveLength(3)
    await wrapper.setProps({
      layout: {
        docks: [{ id: 'left', side: 'left', panels: [{ id: 'files', title: '文件' }] }],
        maximized: null,
      },
    })
    await nextTick()
    expect(wrapper.findAllComponents(EtDock)).toHaveLength(1)
    expect(wrapper.find('.et-workbench__rail--right').exists()).toBe(false)
    expect(wrapper.find('.et-workbench__rail--bottom').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('EtWorkbench 布局持久化', () => {
  it('无变更不写盘；变更才写一次（layoutEquals 比对路径）', async () => {
    const storage = stubStorage()
    const wrapper = await mountWorkbench({ persistKey: 'wb-key' })
    // 空存储 + 初始布局即默认：挂载不等于变更，一次都不写
    expect(storage.setItem).not.toHaveBeenCalled()

    const collapsed = togglePanelCollapsed(makeDefault(), 'search')
    await wrapper.setProps({ layout: collapsed })
    await nextTick()
    expect(storage.setItem).toHaveBeenCalledTimes(1)
    const stored = JSON.parse(storage.setItem.mock.calls[0][1])
    expect(findPanel(stored, 'search').panel.collapsed).toBe(true)

    // 结构等价的新引用（深 watch 会响，但 layoutEquals 应该拦住写盘）
    await wrapper.setProps({ layout: JSON.parse(JSON.stringify(collapsed)) })
    await nextTick()
    expect(storage.setItem).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('坏 JSON → emit layout-corrupted + dev 留痕 + 降级渲染默认布局', async () => {
    const storage = stubStorage({ 'wb-key': '{oops' })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // 消费方手里的树是自定义树：损坏时必须看到默认布局，不是白屏也不是自定义树
    const custom = {
      docks: [{ id: 'main', side: 'left', panels: [{ id: 'p1', title: 'P1' }] }],
      maximized: null,
    }
    const wrapper = await mountWorkbench({
      layout: custom,
      defaultLayout: makeDefault(),
      persistKey: 'wb-key',
    })
    const corruption = wrapper.emitted('layout-corrupted')
    expect(corruption).toBeTruthy()
    expect(corruption[0][0].join(' ')).toMatch(/JSON 解析失败/)
    expect(warn).toHaveBeenCalled()
    // 渲染 defaultLayout：stub dock 收到默认树左侧 dock（files / search）
    const dock = wrapper.findComponent(EtDock)
    expect(dock.props('dock').id).toBe('left')
    expect(dock.props('dock').panels.map((p) => p.id)).toEqual(['files', 'search'])
    // v-model 自愈：写回默认树
    expect(findPanel(lastUpdate(wrapper), 'files')).toBeTruthy()
    wrapper.unmount()
  })

  it('有效持久化数据在挂载时恢复（刷新/重启场景）', async () => {
    const stored = togglePanelCollapsed(makeDefault(), 'files')
    const storage = stubStorage({ 'wb-key': serializeLayout(stored) })
    const wrapper = await mountWorkbench({ persistKey: 'wb-key' })
    // 读回的树覆盖初始布局（v-model 同步 + 渲染）
    const restored = lastUpdate(wrapper)
    expect(findPanel(restored, 'files').panel.collapsed).toBe(true)
    expect(wrapper.findComponent(EtDock).props('dock').panels[0].collapsed).toBe(true)
    // 读回即当前态：不重复写盘
    expect(storage.setItem).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})

describe('EtWorkbench 重置与暴露', () => {
  it('resetLayout() 还原默认布局，emit reset，并落盘', async () => {
    // 存储里存着"用户改过的树"：挂载恢复它 → reset 才是真变更（写回默认）
    const collapsed = togglePanelCollapsed(makeDefault(), 'search')
    const storage = stubStorage({ 'wb-key': serializeLayout(collapsed) })
    const wrapper = await mountWorkbench({
      layout: makeDefault(),
      defaultLayout: makeDefault(),
      persistKey: 'wb-key',
    })
    expect(findPanel(lastUpdate(wrapper), 'search').panel.collapsed).toBe(true)
    expect(storage.setItem).not.toHaveBeenCalled()

    wrapper.vm.resetLayout()
    await nextTick()
    const next = lastUpdate(wrapper)
    expect(findPanel(next, 'search').panel.collapsed).toBe(false)
    expect(next.maximized).toBe(null)
    expect(wrapper.emitted('reset')).toHaveLength(1)
    // 渲染同步回默认 + 落盘
    expect(wrapper.findComponent(EtDock).props('dock').panels[1].collapsed).toBe(false)
    expect(storage.setItem).toHaveBeenCalledTimes(1)
    const stored = JSON.parse(storage.setItem.mock.calls[0][1])
    expect(findPanel(stored, 'search').panel.collapsed).toBe(false)
    wrapper.unmount()
  })

  it('getLayout() 返回当前生效树；saveNow() 强制落盘', async () => {
    const storage = stubStorage()
    const wrapper = await mountWorkbench({ persistKey: 'wb-key' })
    expect(findPanel(wrapper.vm.getLayout(), 'files')).toBeTruthy()
    expect(storage.setItem).not.toHaveBeenCalled()
    expect(wrapper.vm.saveNow()).toBe(true)
    expect(storage.setItem).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})

describe('EtWorkbench 事件转发（EtDock emit → 布局树变更）', () => {
  it('panel-collapse → togglePanelCollapsed 后的新树', async () => {
    const wrapper = await mountWorkbench()
    const dock = wrapper.findAllComponents(EtDock)[0]
    await dock.vm.$emit('panel-collapse', 'search')
    await nextTick()
    expect(findPanel(lastUpdate(wrapper), 'search').panel.collapsed).toBe(true)
    wrapper.unmount()
  })

  it('panel-expand → 折叠/隐藏都被取消（隐藏是显式状态，展开即回布局）', async () => {
    const wrapper = await mountWorkbench()
    const dock = wrapper.findAllComponents(EtDock)[0]
    await dock.vm.$emit('panel-collapse', 'search')
    await dock.vm.$emit('panel-close', 'search')
    await nextTick()
    let tree = lastUpdate(wrapper)
    expect(findPanel(tree, 'search').panel.hidden).toBe(true)
    await dock.vm.$emit('panel-expand', 'search')
    await nextTick()
    tree = lastUpdate(wrapper)
    expect(findPanel(tree, 'search').panel.hidden).toBe(false)
    expect(findPanel(tree, 'search').panel.collapsed).toBe(false)
    wrapper.unmount()
  })

  it('panel-close → hidePanel（隐藏 ≠ 不可达，重置可恢复）', async () => {
    const wrapper = await mountWorkbench()
    const dock = wrapper.findAllComponents(EtDock)[0]
    await dock.vm.$emit('panel-close', 'files')
    await nextTick()
    expect(findPanel(lastUpdate(wrapper), 'files').panel.hidden).toBe(true)
    wrapper.unmount()
  })

  it('panel-maximize / panel-restore → 最大化态只一个，restore 清空', async () => {
    const wrapper = await mountWorkbench()
    await wrapper.findAllComponents(EtDock)[1].vm.$emit('panel-maximize', 'props')
    await nextTick()
    expect(lastUpdate(wrapper).maximized).toBe('props')
    await wrapper.findAllComponents(EtDock)[1].vm.$emit('panel-restore')
    await nextTick()
    expect(lastUpdate(wrapper).maximized).toBe(null)
    wrapper.unmount()
  })

  it('dock-toggle → toggleDockCollapsed（整列收起）', async () => {
    const wrapper = await mountWorkbench()
    await wrapper.findAllComponents(EtDock)[0].vm.$emit('dock-toggle', 'left')
    await nextTick()
    expect(lastUpdate(wrapper).docks[0].collapsed).toBe(true)
    wrapper.unmount()
  })

  it('update:dock → 替换树里对应 id 的 dock（尺寸/顺序由 EtDock 回写）', async () => {
    const wrapper = await mountWorkbench()
    const dock = wrapper.findAllComponents(EtDock)[0]
    await dock.vm.$emit('update:dock', {
      id: 'left',
      side: 'left',
      collapsed: false,
      panels: [{ id: 'search', title: '搜索', size: 240, collapsed: false, hidden: false, closable: true }],
    })
    await nextTick()
    const next = lastUpdate(wrapper)
    expect(next.docks[0].panels.map((p) => p.id)).toEqual(['search'])
    // 树仍是合法布局（commit 里过 normalizeLayout）
    expect(findPanel(next, 'search')).toBeTruthy()
    wrapper.unmount()
  })
})

describe('EtWorkbench 全屏面板', () => {
  it('maximized 非空：对应停靠整幅、其它区域让位、dock 收到 maximized id', async () => {
    const wrapper = await mountWorkbench({ layout: maximizePanel(makeDefault(), 'props') })
    expect(wrapper.find('.et-workbench__body').classes()).toContain('is-maximized')
    expect(wrapper.find('.et-workbench__rail--right').classes()).toContain('is-maximized')
    expect(wrapper.find('.et-workbench__rail--left').classes()).not.toContain('is-maximized')
    const docks = wrapper.findAllComponents(EtDock)
    // maximized 是全树 id，下发给每个 dock（由 dock 自己判断哪个面板全幅）
    expect(docks.map((d) => d.props('maximized'))).toEqual(['props', 'props', 'props'])
    wrapper.unmount()
  })

  it('maximized 指向不存在的面板时按无全屏渲染（不白屏）', async () => {
    const tree = { ...makeDefault(), maximized: 'ghost' }
    const wrapper = await mountWorkbench({ layout: tree })
    expect(wrapper.find('.et-workbench__body').classes()).not.toContain('is-maximized')
    wrapper.unmount()
  })
})

describe('EtWorkbench 损坏降级', () => {
  it('layout prop 本身不可用 → 降级默认布局 + layout-corrupted + 不白屏', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = await mountWorkbench({ layout: { docks: 'nope' } })
    expect(wrapper.emitted('layout-corrupted')).toBeTruthy()
    expect(wrapper.emitted('layout-corrupted')[0][0].join(' ')).toMatch(/docks 数组/)
    expect(warn).toHaveBeenCalled()
    // 渲染默认布局的 dock（白屏不存在：canvas 与 dock 都在）
    expect(wrapper.findComponent(EtDock).props('dock').id).toBe('left')
    expect(wrapper.find('.et-workbench__canvas').exists()).toBe(true)
    wrapper.unmount()
  })

  it('半坏 layout：可用 dock 保留、坏项进 errors、坏项被清出树', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = await mountWorkbench({
      layout: {
        docks: [
          { id: 'left', side: 'left', panels: [{ id: 'files', title: '文件' }] },
          { id: 'bad', side: 'top', panels: [] },
        ],
        maximized: null,
      },
    })
    expect(wrapper.emitted('layout-corrupted')).toBeTruthy()
    expect(wrapper.emitted('layout-corrupted')[0][0].join(' ')).toMatch(/side 必须是/)
    expect(wrapper.findAllComponents(EtDock)).toHaveLength(1)
    expect(lastUpdate(wrapper).docks.map((d) => d.id)).toEqual(['left'])
    wrapper.unmount()
  })

  it('defaultLayout 也坏 → 空树降级（只有画布，仍可交互）', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = await mountWorkbench({ layout: null, defaultLayout: { docks: 42 } })
    expect(wrapper.find('.et-workbench__canvas').exists()).toBe(true)
    expect(wrapper.findAllComponents(EtDock)).toHaveLength(0)
    // resetLayout 仍然可用（回到空默认树，不抛）
    expect(() => wrapper.vm.resetLayout()).not.toThrow()
    await nextTick()
    expect(wrapper.emitted('reset')).toHaveLength(1)
    wrapper.unmount()
  })
})

describe('EtWorkbench 观察器纪律', () => {
  it('本组件不挂 ResizeObserver（停靠尺寸由布局树驱动，无测量面）', async () => {
    const wrapper = await mountWorkbench(
      {},
      {
        titlebar: '<div>t</div>',
        documents: '<div>d</div>',
        toolbar: '<div>r</div>',
        statusbar: '<div>s</div>',
        default: '<div>c</div>',
      },
    )
    expect(roInstances).toHaveLength(0)
    wrapper.unmount()
  })
})

describe('EtWorkbench 损坏自愈落盘', () => {
  it('损坏档降级后把修好的树写回（不写 = 每次刷新都重复提示）', async () => {
    const storage = stubStorage({ 'demo-layout': '{"docks": "broken"}' })
    const wrapper = await mountWorkbench({ persistKey: 'demo-layout', layout: null })
    await flushPromises()
    expect(wrapper.emitted('layout-corrupted')).toBeTruthy()
    const written = JSON.parse(storage.store.get('demo-layout'))
    expect(Array.isArray(written.docks)).toBe(true)
    // 写回的是默认布局（makeDefault 的首个面板），不是那份坏档
    expect(written.docks[0].panels[0].id).toBe('files')
  })
})
