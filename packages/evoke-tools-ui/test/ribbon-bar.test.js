import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EtRibbonBar from '../src/components/ribbon-bar/index.vue'
import { createCommandRegistry } from '../src/runtime/command/registry'

/**
 * EtRibbonBar 组件契约（tools-ui 计划 05 §四 L2 / 01 §3.1 验收要点）
 *
 * tab 条（常驻 + 上下文）、条目渲染（大钮/小钮/select/separator）、状态唯一来源
 * （registry.state）、真折叠（快捷键/双击/持久化）、peek 浮层、降档与溢出折叠、
 * 观察器与监听的生命周期。
 */

/** 演示命令表（id 与 examples/tools-workbench/src/commands.js 一致：加一个功能 = 加一行数据） */
function makeRegistry() {
  const registry = createCommandRegistry()
  registry.registerAll([
    {
      id: 'copy', title: '复制', desc: '复制选区到剪贴板', keys: 'mod+c', icon: 'copy',
      enabled: (ctx) => !!ctx.hasSelection, run: () => {},
    },
    { id: 'format-painter', title: '格式刷', desc: '复制格式并刷到目标', icon: 'brush', run: () => {} },
    {
      id: 'clear', title: '清除', icon: 'close',
      enabled: (ctx) => !!ctx.hasSelection, run: () => {},
    },
    {
      id: 'bold', title: '加粗', keys: 'mod+b', icon: 'bold',
      active: (ctx) => !!ctx.format?.bold, run: () => {},
    },
    {
      id: 'italic', title: '倾斜', keys: 'mod+i', icon: 'italic',
      active: (ctx) => !!ctx.format?.italic, run: () => {},
    },
    { id: 'underline', title: '下划线', keys: 'mod+u', icon: 'underline', run: () => {} },
    { id: 'font-size', title: '字号', desc: '设置选区字号', run: () => {} },
    { id: 'search', title: '查找', keys: 'mod+f', icon: 'search', run: () => {} },
    { id: 'filter', title: '筛选', icon: 'filter', run: () => {} },
    { id: 'insert-table', title: '插入表格', icon: 'table', run: () => {} },
    { id: 'zoom-in', title: '放大', keys: 'mod+plus', icon: 'zoom-in', run: () => {} },
    { id: 'more', title: '更多命令', icon: 'more', run: () => {} },
  ])
  return registry
}

/** tab → 组 → 条目（grid.rowSpan=2 大钮 / 1×1 小钮 / select 固定宽 / separator / spacer） */
const SCHEMA = [
  {
    key: 'home',
    type: 'tab',
    label: '开始',
    children: [
      {
        key: 'g-clipboard',
        type: 'group',
        label: '剪贴板',
        children: [
          { key: 'i-copy', type: 'item', command: 'copy', grid: { rowSpan: 2 } },
          { key: 'i-painter', type: 'item', command: 'format-painter', grid: { rowSpan: 2 } },
        ],
      },
      {
        key: 'g-font',
        type: 'group',
        label: '字体',
        children: [
          { key: 'i-bold', type: 'item', command: 'bold', grid: { rowSpan: 2 } },
          { key: 'i-italic', type: 'item', command: 'italic' },
          { key: 'sep', type: 'separator' },
          {
            key: 'i-size', type: 'select', command: 'font-size', width: 96,
            options: [{ label: '12', value: 12 }, { label: '14', value: 14 }],
          },
          { key: 'sp', type: 'spacer' },
        ],
      },
    ],
  },
  {
    key: 'insert',
    type: 'tab',
    label: '插入',
    children: [
      {
        key: 'g-table',
        type: 'group',
        label: '表格',
        children: [{ key: 'i-table', type: 'item', command: 'insert-table', grid: { rowSpan: 2 } }],
      },
    ],
  },
]

const CONTEXT_TABS = [
  { id: 'pic-format', label: '图片格式', when: (ctx) => ctx.selection === 'picture' },
  { id: 'table-design', label: '表设计', when: (ctx) => ctx.selection === 'table' },
]

/** 抓 fake ResizeObserver 实例：拿 observe / disconnect 与回调用 */
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

/** 挂载登记表：断言失败也不把 document 监听漏给下一个用例 */
const mounted = []

let store = null

function mockStorage() {
  store = new Map()
  vi.stubGlobal('localStorage', {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  })
}

beforeEach(() => {
  roInstances.splice(0)
  mounted.splice(0)
  mockStorage()
  vi.stubGlobal('ResizeObserver', FakeResizeObserver)
})

afterEach(() => {
  mounted.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.unstubAllGlobals()
})

const mountRibbon = async (props = {}) => {
  const wrapper = mount(EtRibbonBar, {
    props: { schema: SCHEMA, registry: makeRegistry(), modelValue: 'home', ...props },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  await nextTick()
  return wrapper
}

const tabItems = (wrapper) => wrapper.findAll('.et-tabstrip__item')

const toolButtons = (wrapper) => wrapper.findAll('.et-toolbtn')

/** document 级派发（快捷键在 document 上，不在任何元素上） */
function pressCombo(key, mods = {}) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...mods }))
}

/** 组字期事件（jsdom 的 isComposing 初始值不可靠，直接钉死） */
function pressComposing(key, mods = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...mods })
  Object.defineProperty(event, 'isComposing', { value: true })
  document.dispatchEvent(event)
}

/**
 * RibbonBar 自己的观察器实例（EtTabStrip 也建了一个：按被观察元素认领，
 * 不靠创建顺序猜）
 */
const ribbonObserver = (wrapper) =>
  roInstances.find((observer) => observer.observe.mock.calls.some(([el]) => el === wrapper.element))

/**
 * 窄容器打桩 + 手动触发一次观察器回调（jsdom 无布局）：
 * 首过时所有组都以 FULL 档在 DOM 里（实测宽 = 自然宽），打桩后重新规划
 */
async function stubNarrow(wrapper, { clientWidth, groupWidths, moreWidth }) {
  Object.defineProperty(wrapper.find('.et-ribbonbar__body').element, 'clientWidth', {
    value: clientWidth,
    configurable: true,
  })
  wrapper.findAll('.et-toolgroup').forEach((group, index) => {
    Object.defineProperty(group.element, 'offsetWidth', {
      value: groupWidths[index] ?? 0,
      configurable: true,
    })
  })
  Object.defineProperty(wrapper.find('.et-ribbonbar__more').element, 'offsetWidth', {
    value: moreWidth,
    configurable: true,
  })
  ribbonObserver(wrapper).callback()
  await nextTick()
}

describe('EtRibbonBar 渲染与 ARIA', () => {
  it('根为 role=toolbar + aria-label；tab 条渲染 schema 常驻 tab', async () => {
    const wrapper = await mountRibbon()
    const root = wrapper.find('[role="toolbar"]')
    expect(root.exists()).toBe(true)
    expect(root.attributes('aria-label')).toBe('工具区')
    expect(tabItems(wrapper).map((tab) => tab.text())).toEqual(['开始', '插入'])
  })

  it('条目按 schema 声明渲染：大钮 / 小钮 / select / separator / spacer', async () => {
    const wrapper = await mountRibbon()
    // 计数限定在组内：行尾「更多」入口小钮常驻 DOM（无溢出时退出文档流但保留可测宽度）
    // grid.rowSpan=2 → 大钮（copy / format-painter / bold）；否则小钮（italic）
    expect(wrapper.findAll('.et-toolgroup .et-toolbtn--large')).toHaveLength(3)
    expect(wrapper.findAll('.et-toolgroup .et-toolbtn--small')).toHaveLength(1)
    expect(wrapper.find('.et-ribbonbar__select').exists()).toBe(true)
    expect(wrapper.find('.et-toolspacer').exists()).toBe(true)
    // separator 节点 + 组间分隔线（都是 EtDivider）
    expect(wrapper.findAll('.et-divider')).toHaveLength(2)
    expect(wrapper.findAll('.et-toolgroup__label').map((el) => el.text())).toEqual(['剪贴板', '字体'])
  })

  it('未注册的命令不渲染（悬空引用兜底，不抛）', async () => {
    const wrapper = await mountRibbon({ registry: null })
    expect(wrapper.findAll('.et-toolgroup .et-toolbtn')).toHaveLength(0)
    expect(tabItems(wrapper)).toHaveLength(2)
  })

  it('小钮带富提示（name + desc + combo；large 无提示不抢行）', async () => {
    const wrapper = await mountRibbon()
    const small = wrapper.find('.et-toolbtn--small')
    // tip 由 EtToolButton 包 EtScreenTip：触发器包裹小钮
    expect(wrapper.find('.et-screentip__trigger .et-toolbtn--small').exists()).toBe(true)
    expect(small.attributes('aria-label')).toBe('倾斜')
  })
})

describe('EtRibbonBar 选中与命令', () => {
  it('切换 tab emit update:modelValue + change', async () => {
    const wrapper = await mountRibbon()
    await tabItems(wrapper)[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['insert']])
    expect(wrapper.emitted('change')).toEqual([['insert']])
  })

  it('点击条目 emit command（组件不直接 run）', async () => {
    const wrapper = await mountRibbon()
    const painter = toolButtons(wrapper).find((btn) => btn.attributes('aria-label') === '格式刷')
    await painter.trigger('click')
    expect(wrapper.emitted('command')).toEqual([['format-painter']])
  })

  it('entry 状态唯一来自 registry.state：active → aria-pressed，disabled → disabled', async () => {
    const wrapper = await mountRibbon({ ctx: { format: { bold: true } } })
    const bold = toolButtons(wrapper).find((btn) => btn.attributes('aria-label') === '加粗')
    expect(bold.attributes('aria-pressed')).toBe('true')
    // copy 的 enabled=ctx.hasSelection：该上下文下为禁用态
    const copy = toolButtons(wrapper).find((btn) => btn.attributes('aria-label') === '复制')
    expect(copy.element.disabled).toBe(true)
    const italic = toolButtons(wrapper).find((btn) => btn.attributes('aria-label') === '倾斜')
    expect(italic.element.disabled).toBe(false)
  })
})

describe('EtRibbonBar 真折叠', () => {
  it('Ctrl+F1 toggle：emit update:collapsed + 工具区主体退场、tab 条仍在', async () => {
    const wrapper = await mountRibbon()
    pressCombo('F1', { ctrlKey: true })
    await nextTick()
    expect(wrapper.emitted('update:collapsed')).toEqual([[true]])
    expect(wrapper.find('.et-ribbonbar__body').exists()).toBe(false)
    expect(wrapper.find('.et-tabstrip').exists()).toBe(true)

    pressCombo('F1', { ctrlKey: true })
    await nextTick()
    expect(wrapper.emitted('update:collapsed')).toEqual([[true], [false]])
  })

  it('⌥⌘R（Win: Ctrl+Alt+R）同样 toggle', async () => {
    const wrapper = await mountRibbon()
    pressCombo('r', { ctrlKey: true, altKey: true })
    await nextTick()
    expect(wrapper.emitted('update:collapsed')).toEqual([[true]])
  })

  it('双击 tab 条空白 toggle 折叠', async () => {
    const wrapper = await mountRibbon()
    await wrapper.find('.et-ribbonbar__tabs').trigger('dblclick')
    expect(wrapper.emitted('update:collapsed')).toEqual([[true]])
  })

  it('组字期快捷键放过（G5：候选词上屏不是应用命令）', async () => {
    const wrapper = await mountRibbon()
    pressComposing('F1', { ctrlKey: true })
    await nextTick()
    expect(wrapper.emitted('update:collapsed')).toBeUndefined()
  })

  it('persistKey：挂载读回 localStorage 作初值并 emit', async () => {
    store.set('et-ribbon-demo', '1')
    const wrapper = await mountRibbon({ persistKey: 'et-ribbon-demo' })
    expect(wrapper.emitted('update:collapsed')).toEqual([[true]])
    expect(wrapper.find('.et-ribbonbar__body').exists()).toBe(false)
  })

  it('persistKey：toggle 后写回 localStorage', async () => {
    const wrapper = await mountRibbon({ persistKey: 'et-ribbon-demo' })
    pressCombo('F1', { ctrlKey: true })
    await nextTick()
    expect(store.get('et-ribbon-demo')).toBe('1')
    pressCombo('F1', { ctrlKey: true })
    await nextTick()
    expect(store.get('et-ribbon-demo')).toBe('0')
  })

  it('persistKey 为空不碰 localStorage', async () => {
    const wrapper = await mountRibbon()
    pressCombo('F1', { ctrlKey: true })
    await nextTick()
    expect(store.size).toBe(0)
  })
})

describe('EtRibbonBar peek 浮层', () => {
  it('折叠态 hover tab 条唤浮层，内容与展开态同一渲染路径；不改持久态', async () => {
    const wrapper = await mountRibbon({ collapsed: true })
    expect(wrapper.find('.et-ribbonbar__body').exists()).toBe(false)

    // hover 区在整个功能区根（peek 浮层渲染在根内：指针从 tab 条移进浮层不算离开）；
    // mouseenter 不冒泡，故直接在根上触发
    await wrapper.find('.et-ribbonbar').trigger('mouseenter')
    await nextTick()
    const peek = wrapper.find('.et-ribbonbar__peek')
    expect(peek.exists()).toBe(true)
    expect(peek.findAll('.et-toolbtn--large')).toHaveLength(3)
    // peek 不改持久态
    expect(wrapper.emitted('update:collapsed')).toBeUndefined()

    await wrapper.find('.et-ribbonbar').trigger('mouseleave')
    await nextTick()
    expect(wrapper.find('.et-ribbonbar__peek').exists()).toBe(false)
  })

  it('键盘聚焦也唤浮层；焦点在根内转移不收起', async () => {
    const wrapper = await mountRibbon({ collapsed: true })
    const tabs = wrapper.find('.et-ribbonbar__tabs')
    await tabs.trigger('focusin')
    await nextTick()
    expect(wrapper.find('.et-ribbonbar__peek').exists()).toBe(true)

    // relatedTarget 在根内（tab → peek 里的钮）：不收起
    await tabs.trigger('focusout', { relatedTarget: wrapper.element })
    await nextTick()
    expect(wrapper.find('.et-ribbonbar__peek').exists()).toBe(true)

    await tabs.trigger('focusout', { relatedTarget: document.body })
    await nextTick()
    expect(wrapper.find('.et-ribbonbar__peek').exists()).toBe(false)
  })

  it('peek=false 时折叠态不渲染浮层', async () => {
    const wrapper = await mountRibbon({ collapsed: true, peek: false })
    // hover 区在整个功能区根（peek 浮层渲染在根内：指针从 tab 条移进浮层不算离开）；
    // mouseenter 不冒泡，故直接在根上触发
    await wrapper.find('.et-ribbonbar').trigger('mouseenter')
    await nextTick()
    expect(wrapper.find('.et-ribbonbar__peek').exists()).toBe(false)
  })
})

describe('EtRibbonBar 分量降级与溢出折叠', () => {
  it('窄容器：两组都退化为整组下拉（GROUP_DROPDOWN），无溢出', async () => {
    const wrapper = await mountRibbon()
    // 两组 FULL 都 300：最小档估算 96+96=192 ≤ 200 → 双双到最小档、fits
    await stubNarrow(wrapper, { clientWidth: 200, groupWidths: [300, 300], moreWidth: 40 })
    expect(wrapper.findAll('.et-ribbonbar__groupmenu')).toHaveLength(2)
    expect(wrapper.find('.et-ribbonbar__more').classes()).toContain('is-hidden')
  })

  it('更窄容器：放不下的组收进行尾「更多」，入口退场', async () => {
    const wrapper = await mountRibbon()
    // 最小档 192 + 入口 40 = 232 > 150 → 从最宽的组开始收
    await stubNarrow(wrapper, { clientWidth: 150, groupWidths: [300, 300], moreWidth: 40 })
    const more = wrapper.find('.et-ribbonbar__more')
    expect(more.classes()).not.toContain('is-hidden')
    expect(more.find('.et-overflow').exists()).toBe(true)
    // 收进的组不在控件行里，留下的组走最小档
    expect(wrapper.findAll('.et-ribbonbar__groupmenu')).toHaveLength(1)
  })

  it('宽度充足时全部 FULL 档，无降级无溢出', async () => {
    const wrapper = await mountRibbon()
    await stubNarrow(wrapper, { clientWidth: 1200, groupWidths: [300, 300], moreWidth: 40 })
    expect(wrapper.findAll('.et-ribbonbar__groupmenu')).toHaveLength(0)
    expect(wrapper.find('.et-ribbonbar__more').classes()).toContain('is-hidden')
    expect(wrapper.findAll('.et-toolgroup')).toHaveLength(2)
  })

  it('切 tab 后重新测量：新 tab 的组按 FULL 首过，不继承上个 tab 的降档', async () => {
    const wrapper = await mountRibbon()
    await stubNarrow(wrapper, { clientWidth: 150, groupWidths: [300, 300], moreWidth: 40 })
    expect(wrapper.find('.et-ribbonbar__more').classes()).not.toContain('is-hidden')

    // 受控 prop 变化 = 消费方 v-model 回写：换 tab → 重测（签名 watch → nextTick → measure）
    await wrapper.setProps({ modelValue: 'insert' })
    await nextTick()
    await nextTick()
    expect(wrapper.findAll('.et-toolgroup')).toHaveLength(1)
    expect(wrapper.find('.et-toolgroup__label').text()).toBe('表格')
    // 新 tab 未测得降档需求：溢出入口退场
    expect(wrapper.find('.et-ribbonbar__more').classes()).toContain('is-hidden')
  })
})

describe('EtRibbonBar 上下文 tab 与生命周期', () => {
  it('上下文 tab：条件满足才进条、可切换；条件消失即退场', async () => {
    const wrapper = await mountRibbon({ contextTabs: CONTEXT_TABS, ctx: { selection: 'picture' } })
    expect(tabItems(wrapper).map((tab) => tab.text())).toEqual(['开始', '插入', '图片格式'])
    await tabItems(wrapper)[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['pic-format']])

    await wrapper.setProps({ ctx: { selection: 'text' } })
    await nextTick()
    expect(tabItems(wrapper).map((tab) => tab.text())).toEqual(['开始', '插入'])
  })

  it('挂载时观察 bar 根、卸载时断开（06 §四 内存预算）', async () => {
    const wrapper = await mountRibbon()
    const observer = ribbonObserver(wrapper)
    expect(observer).toBeTruthy()
    expect(observer.observe).toHaveBeenCalledWith(wrapper.element)
    wrapper.unmount()
    expect(observer.disconnect).toHaveBeenCalled()
  })

  it('卸载摘除 document 级监听（快捷键 / 点击别处）', async () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const wrapper = await mountRibbon()
    wrapper.unmount()
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('click', expect.any(Function))
    removeSpy.mockRestore()
    // 监听摘除后快捷键不再触发
    pressCombo('F1', { ctrlKey: true })
    await nextTick()
    expect(wrapper.emitted('update:collapsed')).toBeUndefined()
  })

  it('无 ResizeObserver 的环境（jsdom / SSR）也能挂载', async () => {
    vi.unstubAllGlobals()
    const wrapper = await mountRibbon()
    expect(wrapper.find('[role="toolbar"]').exists()).toBe(true)
    expect(tabItems(wrapper)).toHaveLength(2)
  })
})
