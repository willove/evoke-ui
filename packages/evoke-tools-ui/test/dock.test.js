import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EtDock from '../src/components/dock/index.vue'
import EtPanel from '../src/components/panel/index.vue'
import EtPanelGroup from '../src/components/panel/group.vue'
import EbSplitter from '@wil-works/evoke-business-ui/splitter'

/**
 * EtDock 组件契约（tools-ui 计划 05 §四 L3 / M2；TD-4：EbSplitter 基元上的面板树）
 *
 * 默认档 = 并列（每面板一位、同屏分摊）；tabs 档 = dock.presentation === 'tabs'
 * 时走 EtPanelGroup。覆盖：side 定 layout、单/多面板两条路径、tabs 开关、
 * dock.collapsed 把手与 dock-toggle、resize 回写（按位次给对应面板、过 min/max）、
 * 折叠位合成尺寸不回写、观察器断开（M2 出口：无观察器泄漏）。
 */

const panelNode = (overrides = {}) => ({
  id: 'files',
  title: '文件',
  size: 280,
  min: 200,
  max: 480,
  collapsed: false,
  hidden: false,
  closable: true,
  ...overrides,
})

const dockNode = (overrides = {}) => ({
  id: 'left',
  side: 'left',
  collapsed: false,
  panels: [panelNode()],
  ...overrides,
})

const searchNode = (overrides = {}) => panelNode({ id: 'search', title: '搜索', size: 240, ...overrides })
const plainPanels = () => [panelNode({ min: undefined, max: undefined }), searchNode()]

const mountDock = async (props) => {
  const wrapper = mount(EtDock, { props, attachTo: document.body })
  await nextTick()
  return wrapper
}

/** 带 #panel 作用域槽的挂载（scoped slot 断言走包装组件，不用字符串简写） */
const mountWithPanelSlot = async (dock, slotTemplate) => {
  const wrapper = mount(
    {
      components: { EtDock },
      template: `<EtDock :dock="dock">${slotTemplate}</EtDock>`,
      setup() {
        return { dock }
      },
    },
    { attachTo: document.body },
  )
  await nextTick()
  return wrapper
}

describe('EtDock 结构与 side', () => {
  beforeEach(() => {
    // jsdom 无布局：给停靠位 mock 主轴尺寸（= 并列两位声明宽之和 280 + 240）
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(520)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(200)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('side 定主轴：left / right → horizontal，bottom → vertical', async () => {
    for (const side of ['left', 'right']) {
      const wrapper = await mountDock({ dock: dockNode({ id: side, side }) })
      expect(wrapper.find('.eb-splitter').classes()).toContain('is-horizontal')
      wrapper.unmount()
    }
    const bottom = await mountDock({ dock: dockNode({ id: 'bottom', side: 'bottom' }) })
    expect(bottom.find('.eb-splitter').classes()).toContain('is-vertical')
    bottom.unmount()
  })

  it('单面板路径：直渲 EtPanel，不退回 tabs 档', async () => {
    const wrapper = await mountDock({ dock: dockNode() })
    expect(wrapper.findComponent(EtPanel).exists()).toBe(true)
    expect(wrapper.findComponent(EtPanelGroup).exists()).toBe(false)
    expect(wrapper.find('.et-tabstrip').exists()).toBe(false)
    expect(wrapper.findAll('.eb-splitter-panel')).toHaveLength(1)
    expect(wrapper.find('.eb-splitter__bar').exists()).toBe(false) // 单面板无分隔条
  })

  it('多面板默认并列：两个 splitter 位 + 两个 EtPanel 同屏，无 tab 条、有拖拽条', async () => {
    const wrapper = await mountDock({ dock: dockNode({ panels: plainPanels() }) })
    expect(wrapper.findAll('.eb-splitter-panel')).toHaveLength(2)
    expect(wrapper.findAllComponents(EtPanel)).toHaveLength(2)
    expect(wrapper.findAllComponents(EtPanelGroup)).toHaveLength(0)
    expect(wrapper.find('.et-tabstrip').exists()).toBe(false)
    expect(wrapper.find('.eb-splitter__bar').exists()).toBe(true) // 位间拖拽条（尺寸分摊）
    // 位尺寸取自面板节点（jsdom 无布局下样式由底座按 size 直算）
    const slots = wrapper.findAll('.eb-splitter-panel')
    expect(slots[0].attributes('style')).toContain('width: 280px')
    expect(slots[1].attributes('style')).toContain('width: 240px')
  })

  it('tabs 档（presentation === "tabs"）：单槽 + EtPanelGroup，切 tab 换激活项', async () => {
    const wrapper = await mountDock({ dock: dockNode({ panels: plainPanels(), presentation: 'tabs' }) })
    expect(wrapper.findComponent(EtPanelGroup).exists()).toBe(true)
    expect(wrapper.findAllComponents(EtPanel)).toHaveLength(1)
    expect(wrapper.findAll('.et-tabstrip__item')).toHaveLength(2)
    expect(wrapper.findAll('.eb-splitter-panel')).toHaveLength(1)

    await wrapper.findAll('.et-tabstrip__item')[1].trigger('click')
    expect(wrapper.emitted('update:dock')).toBeFalsy() // 切 tab 是视图态：不产树变更
    expect(wrapper.findComponent(EtPanelGroup).props('activeId')).toBe('search')
    expect(wrapper.findComponent(EtPanel).props('panel').id).toBe('search')
  })

  it('隐藏面板退出渲染（树里保留；产品层用 showPanel 拉回）', async () => {
    const wrapper = await mountDock({ dock: dockNode({ panels: [panelNode({ hidden: true })] }) })
    expect(wrapper.find('.et-panel').exists()).toBe(false)
    expect(wrapper.find('.eb-splitter').exists()).toBe(false)
  })

  it('maximized：只渲染全屏目标位（兄弟面板让位），透传给面板', async () => {
    const wrapper = await mountDock({ dock: dockNode({ panels: plainPanels() }), maximized: 'search' })
    const panels = wrapper.findAllComponents(EtPanel)
    expect(panels).toHaveLength(1)
    expect(panels[0].props('panel').id).toBe('search')
    expect(panels[0].props('maximized')).toBe(true)
    expect(wrapper.find('.et-dock').classes()).toContain('is-maximized')
  })

  it('面板事件转发成 panel-* emit', async () => {
    const wrapper = await mountDock({ dock: dockNode({ panels: plainPanels() }) })
    await wrapper.find('[aria-label="折叠面板"]').trigger('click')
    expect(wrapper.emitted('panel-collapse')).toEqual([['files']])
    await wrapper.find('[aria-label="最大化面板"]').trigger('click')
    expect(wrapper.emitted('panel-maximize')).toEqual([['files']])
    await wrapper.find('[aria-label="关闭面板"]').trigger('click')
    expect(wrapper.emitted('panel-close')).toEqual([['files']])
  })
})

describe('EtDock 折叠态', () => {
  it('dock.collapsed：整列收成把手条（无 splitter / 无面板），点击 emit dock-toggle', async () => {
    const wrapper = await mountDock({ dock: dockNode({ collapsed: true }) })
    const handle = wrapper.find('.et-dock__handle')
    expect(handle.exists()).toBe(true)
    expect(wrapper.find('.et-dock').classes()).toContain('is-collapsed')
    expect(wrapper.find('.eb-splitter').exists()).toBe(false)
    expect(wrapper.find('.et-panel').exists()).toBe(false)
    expect(handle.attributes('aria-label')).toBe('展开文件')
    await handle.trigger('click')
    expect(wrapper.emitted('dock-toggle')).toEqual([['left']])
  })
})

describe('EtDock resize 回写', () => {
  beforeEach(() => {
    // 落定等待（拖拽/过渡期间不回写）：推进假计时器触发 flush
    vi.useFakeTimers()
    // jsdom 无布局：给停靠位 mock 主轴尺寸（= 并列两位声明宽之和 280 + 240）
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(520)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(200)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('并列档：底座百分比按位次换算 px 回写给对应面板（不是激活面板）', async () => {
    const wrapper = await mountDock({ dock: dockNode({ panels: plainPanels() }) })
    // 挂载即各位声明比例（280/520、240/520）→ 与声明值一致，无变化不回写
    vi.advanceTimersByTime(200)
    await nextTick()
    expect(wrapper.emitted('update:dock')).toBeFalsy()

    wrapper.findComponent(EbSplitter).vm.$emit('resize', ['60.00%', '40.00%'])
    vi.advanceTimersByTime(200)
    await nextTick()
    const emitted = wrapper.emitted('update:dock')
    expect(emitted).toBeTruthy()
    const dock = emitted[0][0]
    expect(dock.id).toBe('left')
    expect(dock.panels[0].size).toBe(312) // round(520 * 0.6)
    expect(dock.panels[1].size).toBe(208) // round(520 * 0.4)
    wrapper.unmount()
  })

  it('单个面板（含 tabs 档激活位）：百分比回写该位面板', async () => {
    const wrapper = await mountDock({ dock: dockNode({ panels: [panelNode({ min: undefined, max: undefined })] }) })
    vi.advanceTimersByTime(200)
    wrapper.findComponent(EbSplitter).vm.$emit('resize', ['50.00%'])
    vi.advanceTimersByTime(200)
    await nextTick()
    // 单面板 mock 主轴 520 → 260
    expect(wrapper.emitted('update:dock')[0][0].panels[0].size).toBe(260)
    wrapper.unmount()
  })

  it('min/max 夹角：setPanelSize 夹住不越界', async () => {
    const wrapper = await mountDock({ dock: dockNode() }) // files min 200 max 480
    vi.advanceTimersByTime(200)
    wrapper.findComponent(EbSplitter).vm.$emit('resize', ['10.00%']) // 52 < min 200
    vi.advanceTimersByTime(200)
    const emitted = wrapper.emitted('update:dock')
    expect(emitted[emitted.length - 1][0].panels[0].size).toBe(200)
    wrapper.unmount()
  })

  it('并列档折叠位：只露标题栏、位宽收成标题条、不回写合成高度', async () => {
    const wrapper = await mountDock({
      dock: dockNode({ panels: [panelNode({ min: undefined, max: undefined }), searchNode({ collapsed: true })] }),
    })
    const slots = wrapper.findAll('.eb-splitter-panel')
    expect(slots[1].attributes('style')).toContain('width: 28px')
    const collapsedPanel = wrapper.findAllComponents(EtPanel)[1]
    expect(collapsedPanel.find('.et-panel__body').exists()).toBe(false)
    vi.advanceTimersByTime(200)
    await nextTick()
    expect(wrapper.emitted('update:dock')).toBeFalsy() // 28px 是合成值，不写回声明宽
    wrapper.unmount()
  })

  it('三类不回写：比例尺寸（父级管）/ dock 折叠中 / 全屏位', async () => {
    const percent = await mountDock({ dock: dockNode({ panels: [panelNode({ size: '50%' })] }) })
    vi.advanceTimersByTime(200)
    percent.findComponent(EbSplitter).vm.$emit('resize', ['80.00%'])
    vi.advanceTimersByTime(200)
    expect(percent.emitted('update:dock')).toBeFalsy()
    percent.unmount()

    // 折叠发生在落定之前：dock 已收成把手，不许把把手厚度写进面板 size
    const collapseMid = await mountDock({ dock: dockNode({ panels: plainPanels() }) })
    collapseMid.findComponent(EbSplitter).vm.$emit('resize', ['50.00%', '50.00%'])
    await collapseMid.setProps({ dock: dockNode({ panels: plainPanels(), collapsed: true }) })
    vi.advanceTimersByTime(200)
    expect(collapseMid.emitted('update:dock')).toBeFalsy()
    collapseMid.unmount()

    const maximized = await mountDock({ dock: dockNode({ panels: plainPanels() }), maximized: 'files' })
    vi.advanceTimersByTime(200)
    maximized.findComponent(EbSplitter).vm.$emit('resize', ['100.00%'])
    vi.advanceTimersByTime(200)
    expect(maximized.emitted('update:dock')).toBeFalsy()
    maximized.unmount()
  })
})

describe('EtDock 观察器生命周期（M2 出口：无泄漏）', () => {
  const instances = []

  class FakeResizeObserver {
    constructor(callback) {
      this.callback = callback
      this.observe = vi.fn()
      this.disconnect = vi.fn()
      this.unobserve = vi.fn()
      instances.push(this)
    }
  }

  beforeEach(() => {
    instances.length = 0
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('并列多面板：只有底座的观察器，卸载即 disconnect（本件不自建观察器）', async () => {
    const wrapper = await mountDock({ dock: dockNode({ panels: plainPanels() }) })
    // tab 条不在场（并列档）→ 只有 EbSplitter 建了一个
    expect(instances).toHaveLength(1)
    expect(instances[0].observe).toHaveBeenCalled()
    wrapper.unmount()
    expect(instances[0].disconnect).toHaveBeenCalled()
  })

  it('tabs 档：splitter 与 tab 条的观察器都随卸载断开', async () => {
    const wrapper = await mountDock({ dock: dockNode({ panels: plainPanels(), presentation: 'tabs' }) })
    expect(instances).toHaveLength(2)
    wrapper.unmount()
    for (const observer of instances) {
      expect(observer.disconnect).toHaveBeenCalled()
    }
  })
})

describe('EtDock 面板内容槽（#panel）', () => {
  it('并列档：每个面板同时收到自己的内容（逐面板透传）', async () => {
    const wrapper = await mountWithPanelSlot(
      dockNode({ panels: plainPanels() }),
      '<template #panel="{ panel, dock }"><span class="probe">{{ panel.id }}/{{ dock.side }}</span></template>',
    )
    const probes = wrapper.findAll('.et-panel__body .probe')
    expect(probes).toHaveLength(2)
    expect(probes.map((p) => p.text())).toEqual(['files/left', 'search/left'])
    wrapper.unmount()
  })

  it('tabs 档：槽按激活面板收内容，切 tab 后换成新激活项', async () => {
    const wrapper = await mountWithPanelSlot(
      dockNode({ panels: plainPanels(), presentation: 'tabs' }),
      '<template #panel="{ panel }"><span class="probe">{{ panel.id }}</span></template>',
    )
    expect(wrapper.find('.et-panel__body .probe').text()).toBe('files')
    await wrapper.findAll('.et-tabstrip__item')[1].trigger('click')
    expect(wrapper.find('.et-panel__body .probe').text()).toBe('search')
    wrapper.unmount()
  })

  it('不传槽：面板只有标题栏，不炸（空态合法）', async () => {
    const wrapper = await mountDock({ dock: dockNode() })
    expect(wrapper.find('.et-panel__header').exists()).toBe(true)
    expect(wrapper.find('.et-panel__body').text()).toBe('')
    wrapper.unmount()
  })
})
