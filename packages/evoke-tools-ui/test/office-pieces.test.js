import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EtFormulaBar from '../src/components/formula-bar/index.vue'
import EtSheetTabs from '../src/components/sheet-tabs/index.vue'
import EtSheetCanvasHost from '../src/components/sheet-canvas-host/index.vue'

/**
 * office 层三件（v1.4）：公式栏 / 工作表标签 / 画布宿主
 *
 * 契约焦点（对应各自组件的"一句话职责"）：
 *   · 公式栏：回车提交、Esc 收敛、组字期间不拦、槽优先
 *   · 表页签：roving 漫游只占一个 Tab 停靠点、右键钩子、加号请求
 *   · 画布宿主：尺寸/滚动事件、焦点进出、浮层位、暴露 scrollTo
 * 形态（高度钉死 chrome 预算）属视觉基线，由 visual/tools.spec.mjs 与文档页样板守。
 */

const stubs = { 'et-icon': true }

afterEach(() => {
  document.body.innerHTML = ''
})

describe('EtFormulaBar · 公式栏', () => {
  const mountBar = (props = {}, slots = {}) =>
    mount(EtFormulaBar, { props: { modelValue: '=SUM(A1:A3)', reference: 'B7', ...props }, slots, global: { stubs } })

  it('引用位与编辑区按 props 回显；动作位默认空', () => {
    const w = mountBar()
    expect(w.find('.et-formulabar__reference-text').text()).toBe('B7')
    expect(w.find('.et-formulabar__input').element.value).toBe('=SUM(A1:A3)')
    expect(w.find('.et-formulabar__actions').element.children.length).toBe(0)
  })

  it('输入 → update:modelValue；回车 → submit（带当前值）', async () => {
    const w = mountBar()
    await w.find('.et-formulabar__input').setValue('=A1+B1')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['=A1+B1'])
    await w.find('.et-formulabar__input').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('submit')?.at(-1)).toEqual(['=A1+B1'])
  })

  it('Shift+Enter 与组字期间的 Enter 一律放行（多行编辑器 / 输入法候选上屏）', async () => {
    const w = mountBar()
    await w.find('.et-formulabar__input').trigger('keydown', { key: 'Enter', shiftKey: true })
    await w.find('.et-formulabar__input').trigger('keydown', { key: 'Enter', isComposing: true })
    expect(w.emitted('submit')).toBeUndefined()
  })

  it('Esc → cancel，只读态不提交但照旧收敛', async () => {
    const w = mountBar()
    await w.find('.et-formulabar__input').trigger('keydown', { key: 'Escape' })
    expect(w.emitted('cancel')?.at(-1)).toEqual(['escape'])

    const ro = mountBar({ readonly: true })
    await ro.find('.et-formulabar__input').trigger('keydown', { key: 'Enter' })
    expect(ro.emitted('submit')).toBeUndefined()
    expect(ro.classes()).toContain('is-readonly')
  })

  it('三处槽覆盖内置件（产品可换成自己的控件）', () => {
    const w = mountBar({}, {
      reference: '<span class="my-name">名称框</span>',
      default: '<textarea class="my-editor" />',
      actions: '<button class="my-fx">fx</button>',
    })
    expect(w.find('.my-name').exists()).toBe(true)
    expect(w.find('.my-editor').exists()).toBe(true)
    expect(w.find('.my-fx').exists()).toBe(true)
    expect(w.find('.et-formulabar__input').exists()).toBe(false)
  })
})

describe('EtSheetTabs · 工作表标签', () => {
  const TABS = [
    { id: 's1', label: '汇总' },
    { id: 's2', label: '明细' },
    { id: 's3', label: '草稿', disabled: true },
  ]
  const mountTabs = (props = {}, slots = {}) =>
    mount(EtSheetTabs, { props: { modelValue: 's1', tabs: TABS, ...props }, slots, global: { stubs } })

  it('role=tablist + 当前页 aria-selected；禁用项可见但不可选', async () => {
    const w = mountTabs()
    expect(w.attributes('role')).toBe('tablist')
    const tabs = w.findAll('.et-sheettabs__tab')
    expect(tabs.length).toBe(3)
    expect(tabs[0].attributes('aria-selected')).toBe('true')
    await tabs[2].trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(tabs[2].attributes('aria-disabled')).toBe('true')
  })

  it('roving：整组只有一个 Tab 停靠点，方向键切换并选中', async () => {
    const w = mountTabs()
    const tabs = w.findAll('.et-sheettabs__tab')
    expect(tabs.filter((t) => t.attributes('tabindex') === '0').length).toBe(1)
    await w.find('.et-sheettabs').trigger('keydown', { key: 'ArrowRight' })
    expect(w.emitted('change')?.at(-1)).toEqual(['s2'])
  })

  it('右键发出 context(tab, event)，不拦默认行为', async () => {
    const w = mountTabs()
    await w.findAll('.et-sheettabs__tab')[1].trigger('contextmenu')
    const payload = w.emitted('context')?.[0]
    expect(payload?.[0].id).toBe('s2')
    expect(payload?.[1]).toBeInstanceOf(Event)
  })

  it('hidden 的表整体不渲染；加号按钮请求 add（actions 槽可接管）', async () => {
    const w = mountTabs({ tabs: [...TABS, { id: 's4', label: '隐藏表', hidden: true }] })
    expect(w.findAll('.et-sheettabs__tab').length).toBe(3)
    await w.find('.et-sheettabs__add').trigger('click')
    expect(w.emitted('add')).toBeTruthy()

    const custom = mountTabs({}, { actions: '<button class="my-menu">全部表</button>' })
    expect(custom.find('.my-menu').exists()).toBe(true)
    expect(custom.find('.et-sheettabs__add').exists()).toBe(false)
  })

  it('#tab 槽可换整签渲染（拿到 tab / active / index）', () => {
    const w = mountTabs({}, { tab: '<template #tab="{ tab, active }"><i class="my-tab">{{ tab.label }}{{ active ? "*" : "" }}</i></template>' })
    expect(w.find('.my-tab').text()).toBe('汇总*')
  })
})

describe('EtSheetCanvasHost · 画布宿主', () => {
  const mountHost = (props = {}, slots = {}) =>
    mount(EtSheetCanvasHost, { props, slots, global: { stubs }, attachTo: document.body })

  it('视口可聚焦 + 可访问名；浮层位按需渲染', () => {
    const w = mountHost()
    const vp = w.find('.et-canvashost__viewport')
    expect(vp.attributes('tabindex')).toBe('0')
    expect(vp.attributes('aria-label')).toBe('表格画布')
    expect(w.find('.et-canvashost__overlay').exists()).toBe(false)
  })

  it('浮层槽 → 自动渲染浮层位（固定于视口，不吃空闲区事件）', () => {
    const w = mountHost({}, { overlay: '<div class="my-editor" />' })
    expect(w.find('.et-canvashost__overlay .my-editor').exists()).toBe(true)
  })

  it('滚动 → scroll 事件；内容尺寸板按传参撑开', async () => {
    const w = mountHost({ contentWidth: 900, contentHeight: 400 })
    const sizer = w.find('.et-canvashost__sizer')
    expect(sizer.attributes('style')).toContain('width: 900px')
    await w.find('.et-canvashost__viewport').trigger('scroll')
    expect(w.emitted('scroll')).toBeTruthy()
  })

  it('焦点进出发 viewport-focus / viewport-blur（产品据此切导航态与编辑态）', async () => {
    const w = mountHost()
    await w.find('.et-canvashost__viewport').trigger('focus')
    await w.find('.et-canvashost__viewport').trigger('blur')
    expect(w.emitted('viewport-focus')).toBeTruthy()
    expect(w.emitted('viewport-blur')).toBeTruthy()
  })

  it('scrollTo 暴露给产品（"滚动到选区"由产品算，宿主只执行）', async () => {
    const w = mountHost()
    let called = null
    w.find('.et-canvashost__viewport').element.scrollTo = (opts) => { called = opts }
    w.vm.scrollTo({ left: 120, top: 48 })
    expect(called).toEqual({ left: 120, top: 48 })
  })
})