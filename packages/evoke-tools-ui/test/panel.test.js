import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EtPanel from '../src/components/panel/index.vue'
import EtPanelGroup from '../src/components/panel/group.vue'
import EtTabStrip from '../src/components/tab-strip/index.vue'

/**
 * EtPanel / EtPanelGroup 组件契约（tools-ui 计划 05 §四 L3 / M2）
 *
 * 覆盖：标题栏（标题 + tools 槽 + 三个 aria-label 钮）、closable、折叠态只露
 * 标题栏（内容 v-if）、maximized 变还原钮、五个 emit；EtPanelGroup 的 tab 渲染、
 * 切 tab emit select、最大化 id 透传、折叠/隐藏不进 tab 条。
 */

const PANEL = {
  id: 'files',
  title: '文件',
  size: 280,
  min: 200,
  max: 480,
  collapsed: false,
  hidden: false,
  closable: true,
}

const mountPanel = (props = {}, slots = {}) =>
  mount(EtPanel, { props: { panel: PANEL, ...props }, slots, attachTo: document.body })

describe('EtPanel', () => {
  it('标题栏：标题 + tools 槽 + 三个带 aria-label 的图标钮', () => {
    const wrapper = mountPanel(
      {},
      { tools: '<span class="probe-tools">工具位</span>', default: '<div class="probe-body">内容</div>' },
    )
    expect(wrapper.find('.et-panel__title').text()).toBe('文件')
    expect(wrapper.find('.probe-tools').exists()).toBe(true)
    expect(wrapper.find('.probe-body').text()).toBe('内容')

    const buttons = wrapper.findAll('.et-panel__btn')
    expect(buttons).toHaveLength(3)
    expect(buttons.map((b) => b.attributes('aria-label'))).toEqual([
      '折叠面板',
      '最大化面板',
      '关闭面板',
    ])
    // 无 tools 槽时不渲染工具位容器（不吃标题栏的弹性空间）
    expect(mountPanel().find('.et-panel__tools').exists()).toBe(false)
  })

  it('closable=false 不渲染关闭钮（其余两钮仍在）', () => {
    const wrapper = mountPanel({ panel: { ...PANEL, closable: false } })
    expect(wrapper.findAll('.et-panel__btn')).toHaveLength(2)
    expect(wrapper.find('[aria-label="关闭面板"]').exists()).toBe(false)
    expect(wrapper.find('[aria-label="折叠面板"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="最大化面板"]').exists()).toBe(true)
  })

  it('折叠态只露标题栏：内容 v-if 不渲染', () => {
    const wrapper = mountPanel(
      { panel: { ...PANEL, collapsed: true } },
      { default: '<div class="probe-body">内容</div>' },
    )
    expect(wrapper.find('.et-panel').classes()).toContain('is-collapsed')
    expect(wrapper.find('.et-panel__header').exists()).toBe(true)
    expect(wrapper.find('.et-panel__body').exists()).toBe(false)
    expect(wrapper.find('.probe-body').exists()).toBe(false)
    // 折叠态折叠钮变展开钮
    expect(wrapper.find('[aria-label="展开面板"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="折叠面板"]').exists()).toBe(false)
  })

  it('maximized：最大化钮变还原钮 + is-maximized 类', () => {
    const wrapper = mountPanel({ maximized: true })
    expect(wrapper.find('[aria-label="还原面板"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="最大化面板"]').exists()).toBe(false)
    expect(wrapper.find('.et-panel').classes()).toContain('is-maximized')
  })

  it('bodyScroll 默认开（内容区滚动类），关掉后内容自溢出由消费方管', () => {
    expect(mountPanel().find('.et-panel__body').classes()).toContain('is-scroll')
    expect(mountPanel({ bodyScroll: false }).find('.et-panel__body').classes()).not.toContain('is-scroll')
  })

  it('状态只由 props：折叠/关闭/最大化/还原 emit 面板 id，restore 无参', async () => {
    const wrapper = mountPanel()
    await wrapper.find('[aria-label="折叠面板"]').trigger('click')
    expect(wrapper.emitted('collapse')).toEqual([['files']])
    await wrapper.find('[aria-label="关闭面板"]').trigger('click')
    expect(wrapper.emitted('close')).toEqual([['files']])
    await wrapper.find('[aria-label="最大化面板"]').trigger('click')
    expect(wrapper.emitted('maximize')).toEqual([['files']])
    // 同一面板件不存本地态：props 不变，按钮形态不变
    expect(wrapper.find('[aria-label="展开面板"]').exists()).toBe(false)

    const maximized = mountPanel({ maximized: true })
    await maximized.find('[aria-label="还原面板"]').trigger('click')
    expect(maximized.emitted('restore')).toEqual([[]])

    const collapsed = mountPanel({ panel: { ...PANEL, collapsed: true } })
    await collapsed.find('[aria-label="展开面板"]').trigger('click')
    expect(collapsed.emitted('expand')).toEqual([['files']])
  })
})

describe('EtPanelGroup', () => {
  const PANELS = [
    { id: 'files', title: '文件', size: 280, collapsed: false, hidden: false, closable: true },
    { id: 'search', title: '搜索', size: 240, collapsed: false, hidden: false, closable: true },
  ]

  const mountGroup = (props = {}) =>
    mount(EtPanelGroup, {
      props: { panels: PANELS, activeId: 'files', maximizedPanel: null, ...props },
    })

  it('默认内容槽透传给激活面板（作用域 { panel }）', () => {
    const wrapper = mount(
      {
        components: { EtPanelGroup },
        template: `<EtPanelGroup :panels="panels" active-id="files">
          <template #default="{ panel }"><span class="probe">{{ panel.title }}</span></template>
        </EtPanelGroup>`,
        setup() {
          return { panels: PANELS }
        },
      },
    )
    expect(wrapper.find('.et-panel__body .probe').text()).toBe('文件')
  })

  it('tabs 渲染（复用 EtTabStrip）+ 激活面板的 EtPanel', () => {
    const wrapper = mountGroup()
    expect(wrapper.findComponent(EtTabStrip).exists()).toBe(true)
    const tabs = wrapper.findAll('.et-tabstrip__item')
    expect(tabs).toHaveLength(2)
    expect(tabs.map((t) => t.text())).toEqual(['文件', '搜索'])
    expect(wrapper.find('.et-tabstrip__item.is-active .et-tabstrip__label').text()).toBe('文件')
    expect(wrapper.findComponent(EtPanel).props('panel').id).toBe('files')
  })

  it('切 tab emit select（只走 change，不双发）', async () => {
    const wrapper = mountGroup()
    await wrapper.findAll('.et-tabstrip__item')[1].trigger('click')
    expect(wrapper.emitted('select')).toEqual([['search']])
  })

  it('最大化面板 id 透传给激活面板的 maximized', () => {
    expect(mountGroup({ maximizedPanel: 'search' }).findComponent(EtPanel).props('maximized')).toBe(false)
    const active = mountGroup({ activeId: 'search', maximizedPanel: 'search' })
    expect(active.findComponent(EtPanel).props('maximized')).toBe(true)
    expect(active.find('.et-panel').classes()).toContain('is-maximized')
  })

  it('被折叠/隐藏的面板不进 tab 条；单条目不渲染条', () => {
    const folded = mountGroup({ panels: [{ ...PANELS[0], collapsed: true }, PANELS[1]] })
    expect(folded.findComponent(EtTabStrip).exists()).toBe(false)
    // 折叠的仍是激活面板：它的标题栏就是内容区全部呈现（展开钮可还原）
    expect(folded.findComponent(EtPanel).props('panel').id).toBe('files')

    const hidden = mountGroup({ panels: [PANELS[0], { ...PANELS[1], hidden: true }] })
    expect(hidden.findComponent(EtTabStrip).exists()).toBe(false)
    expect(hidden.findComponent(EtPanel).props('panel').id).toBe('files')
  })

  it('面板事件（含折叠还原用的 expand）转发给消费方', async () => {
    const wrapper = mountGroup()
    await wrapper.find('[aria-label="折叠面板"]').trigger('click')
    expect(wrapper.emitted('collapse')).toEqual([['files']])
    await wrapper.find('[aria-label="关闭面板"]').trigger('click')
    expect(wrapper.emitted('close')).toEqual([['files']])
    await wrapper.find('[aria-label="最大化面板"]').trigger('click')
    expect(wrapper.emitted('maximize')).toEqual([['files']])
  })

  it('还原钮 emit restore（状态由 maximizedPanel prop 翻转，本件不存态）', async () => {
    const wrapper = mountGroup({ maximizedPanel: 'files' })
    expect(wrapper.find('[aria-label="还原面板"]').exists()).toBe(true)
    await wrapper.find('[aria-label="还原面板"]').trigger('click')
    expect(wrapper.emitted('restore')).toEqual([[]])
    expect(wrapper.emitted('maximize')).toBeFalsy()
  })

  it('激活面板折叠时的展开钮 emit expand（否则 tab 化 dock 里折叠面板回不来）', async () => {
    const wrapper = mountGroup({ panels: [{ ...PANELS[0], collapsed: true }, PANELS[1]] })
    await wrapper.find('[aria-label="展开面板"]').trigger('click')
    expect(wrapper.emitted('expand')).toEqual([['files']])
  })
})
