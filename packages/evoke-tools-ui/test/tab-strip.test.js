import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import EtTabStrip, { planOverflow } from '../src/components/tab-strip/index.vue'

/**
 * EtTabStrip 组件契约（tools-ui 计划 05 §四 验收要点）
 *
 * ARIA tablist / tab / aria-selected（无 pane 语义）、键盘漫游、上下文 tab、
 * 窄屏溢出列表、关闭钮、ResizeObserver 生命周期。
 */

const TABS = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Beta', closable: true },
  { id: 'c', label: 'Gamma' },
  { id: 'd', label: 'Delta' },
]

const TABS_WITH_DISABLED = [
  { id: 'a', label: 'Alpha' },
  { id: 'x', label: 'Disabled', disabled: true },
  { id: 'b', label: 'Beta' },
  { id: 'c', label: 'Gamma' },
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

beforeEach(() => {
  roInstances.splice(0)
  vi.stubGlobal('ResizeObserver', FakeResizeObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

/**
 * mount 后等一拍：onMounted 的溢出测量赋值会触发重渲染，同步查询看到的是测量前的 DOM
 * （浏览器首帧前这一拍就落定了，只有测试需要显式等）
 */
const mountStrip = async (props = {}) => {
  const wrapper = mount(EtTabStrip, {
    props: { tabs: TABS, modelValue: 'a', ...props },
    attachTo: document.body,
  })
  await nextTick()
  return wrapper
}

/**
 * 带回写的挂载：键盘漫游要靠父组件把 update:modelValue 回写才推得动激活项
 * （真实用法就是 v-model）。emit 断言走 findComponent(EtTabStrip)。
 */
const mountStateful = async (props = {}) => {
  const { tabs = TABS, modelValue = 'a', ...rest } = props
  const wrapper = mount(
    {
      components: { EtTabStrip },
      template: '<EtTabStrip :tabs="tabs" v-model="active" v-bind="rest" />',
      setup() {
        const active = ref(modelValue)
        return { tabs, active, rest }
      },
    },
    { attachTo: document.body },
  )
  await nextTick()
  return wrapper
}

const emittedOf = (wrapper, event) => wrapper.findComponent(EtTabStrip).emitted(event)

/** 取最后一次 emit 的参数（不能用 pop：VTU 的 emitted() 返回的是活数组，pop 会改记录） */
const lastEmit = (wrapper, event) => {
  const record = emittedOf(wrapper, event)
  return record?.[record.length - 1]
}

const items = (wrapper) => wrapper.findAll('.et-tabstrip__item')
/**
 * 漫游按键后再等一拍：父组件回写 modelValue → 子组件 prop 落定是另一次排程，
 * 连续按键时不拍就会读到上一档激活项（发出重复的 update:modelValue）
 */
const keydown = async (wrapper, index, key) => {
  await items(wrapper)[index].trigger('keydown', { key })
  await nextTick()
}

/** jsdom 无布局：把实测宽打桩到元素上，再手动触发一次观察器回调重新规划 */
function stubWidths(wrapper, { clientWidth, itemWidths, moreWidth = 0 }) {
  Object.defineProperty(wrapper.element, 'clientWidth', {
    value: clientWidth,
    configurable: true,
  })
  items(wrapper).forEach((item, index) => {
    Object.defineProperty(item.element, 'offsetWidth', {
      value: itemWidths[index] ?? 0,
      configurable: true,
    })
  })
  Object.defineProperty(wrapper.find('.et-tabstrip__more').element, 'offsetWidth', {
    value: moreWidth,
    configurable: true,
  })
  roInstances[0]?.callback()
  return nextTick()
}

const fire = (el, type, EventConstructor = MouseEvent) =>
  el.dispatchEvent(new EventConstructor(type, { bubbles: true, cancelable: true }))

describe('planOverflow（溢出规划纯函数）', () => {
  it('全放得下时无溢出', () => {
    const plan = planOverflow([80, 90, 100], 400, { gap: 4, moreWidth: 40 })
    expect(plan.visible).toEqual([0, 1, 2])
    expect(plan.overflow).toEqual([])
  })

  it('总宽超出时保留最长可见前缀，其余进溢出', () => {
    const plan = planOverflow([100, 100, 100, 100], 250, { gap: 0, moreWidth: 40 })
    expect(plan.visible).toEqual([0, 1])
    expect(plan.overflow).toEqual([2, 3])
  })

  it('条目间距与「更多」入口都计入行宽', () => {
    // 4 条目 = 240 + 3 个间距 10 = 270 > 230 → 溢出
    // 3 条目 + 更多 = 180 + 30 + 3 个间距 10 = 240 > 230 → 还放不下
    // 2 条目 + 更多 = 120 + 30 + 2 个间距 10 = 170 ≤ 230 → 就留两个
    const plan = planOverflow([60, 60, 60, 60], 230, { gap: 10, moreWidth: 30 })
    expect(plan.visible).toEqual([0, 1])
    expect(plan.overflow).toEqual([2, 3])
  })

  it('放不下任何条目时全部收进溢出', () => {
    const plan = planOverflow([120, 120], 40, { gap: 0, moreWidth: 30 })
    expect(plan.visible).toEqual([])
    expect(plan.overflow).toEqual([0, 1])
  })

  it('空表 / 异常输入不炸', () => {
    expect(planOverflow([], 100)).toEqual({ visible: [], overflow: [] })
    const plan = planOverflow([undefined, 50], 100)
    expect(plan.visible).toEqual([0, 1])
  })
})

describe('EtTabStrip 渲染与 ARIA', () => {
  it('root 为 tablist、条目为 tab + aria-selected，且无 pane 语义', async () => {
    const wrapper = await mountStrip({ modelValue: 'b' })
    expect(wrapper.find('[role="tablist"]').exists()).toBe(true)
    // 不同于 EbTabs：没有 tabpanel，激活态由消费方自己渲染
    expect(wrapper.find('[role="tabpanel"]').exists()).toBe(false)
    expect(wrapper.find('[aria-controls]').exists()).toBe(false)

    const tabs = items(wrapper)
    expect(tabs).toHaveLength(4)
    expect(tabs[1].attributes('role')).toBe('tab')
    expect(tabs[1].attributes('aria-selected')).toBe('true')
    expect(tabs[0].attributes('aria-selected')).toBe('false')
    expect(tabs[1].attributes('aria-label')).toBe('Beta')
    expect(tabs[1].classes()).toContain('is-active')
    wrapper.unmount()
  })

  it('文字标签原样渲染（M0 纯文字 tab 条）', async () => {
    const wrapper = await mountStrip()
    expect(items(wrapper).map((i) => i.text())).toEqual([
      'Alpha',
      'Beta',
      'Gamma',
      'Delta',
    ])
    wrapper.unmount()
  })

  it('roving tabindex：整组只有一个 tab 位（激活项 0，其余 -1）', async () => {
    const wrapper = await mountStrip({ modelValue: 'b' })
    expect(items(wrapper).map((i) => i.attributes('tabindex'))).toEqual(['-1', '0', '-1', '-1'])
    wrapper.unmount()
  })

  it('disabled 条目 aria-disabled、不可点击选中', async () => {
    const wrapper = await mountStrip({ modelValue: 'a', tabs: TABS_WITH_DISABLED })
    const disabled = items(wrapper)[1]
    expect(disabled.attributes('aria-disabled')).toBe('true')
    expect(disabled.classes()).toContain('is-disabled')
    await disabled.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('EtTabStrip 选中与关闭', () => {
  it('点击条目 emit update:modelValue + change', async () => {
    const wrapper = await mountStrip({ modelValue: 'a' })
    await items(wrapper)[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['c']])
    expect(wrapper.emitted('change')).toEqual([['c']])
    wrapper.unmount()
  })

  it('点已激活条目不重复 emit', async () => {
    const wrapper = await mountStrip({ modelValue: 'a' })
    await items(wrapper)[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('change')).toBeUndefined()
    wrapper.unmount()
  })

  it('关闭钮 emit close 且不触发选中', async () => {
    const wrapper = await mountStrip({ modelValue: 'a' })
    const close = items(wrapper)[1].find('.et-tabstrip__close')
    expect(close.attributes('aria-label')).toBe('关闭 Beta')
    await close.trigger('click')
    expect(wrapper.emitted('close')).toEqual([['b']])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('change')).toBeUndefined()
    wrapper.unmount()
  })

  it('Delete 键盘关闭当前可关闭条目', async () => {
    const wrapper = await mountStrip({ modelValue: 'b' })
    await keydown(wrapper, 1, 'Delete')
    expect(wrapper.emitted('close')).toEqual([['b']])
    wrapper.unmount()
  })

  it('右键 emit context（id + event）', async () => {
    const wrapper = await mountStrip({ modelValue: 'a' })
    await items(wrapper)[2].trigger('contextmenu')
    expect(wrapper.emitted('context')).toBeTruthy()
    expect(wrapper.emitted('context')[0][0]).toBe('c')
    expect(wrapper.emitted('context')[0][1]).toBeInstanceOf(MouseEvent)
    wrapper.unmount()
  })
})

describe('EtTabStrip 键盘漫游', () => {
  it('Right / Left / Home / End 移动激活项并把焦点落到对应 DOM', async () => {
    const wrapper = await mountStateful({ modelValue: 'a' })
    expect(document.activeElement).toBe(document.body)

    await keydown(wrapper, 0, 'ArrowRight')
    expect(lastEmit(wrapper, 'update:modelValue')).toEqual(['b'])
    expect(document.activeElement).toBe(items(wrapper)[1].element)

    await keydown(wrapper, 1, 'ArrowRight')
    expect(lastEmit(wrapper, 'update:modelValue')).toEqual(['c'])
    expect(document.activeElement).toBe(items(wrapper)[2].element)

    await keydown(wrapper, 2, 'ArrowLeft')
    expect(lastEmit(wrapper, 'update:modelValue')).toEqual(['b'])

    await keydown(wrapper, 1, 'End')
    expect(lastEmit(wrapper, 'update:modelValue')).toEqual(['d'])
    expect(document.activeElement).toBe(items(wrapper)[3].element)

    await keydown(wrapper, 3, 'Home')
    expect(lastEmit(wrapper, 'update:modelValue')).toEqual(['a'])
    expect(document.activeElement).toBe(items(wrapper)[0].element)
    wrapper.unmount()
  })

  it('边界不越界（首项按 Left、末项按 Right 不动）', async () => {
    const wrapper = await mountStateful({ modelValue: 'a' })
    await keydown(wrapper, 0, 'ArrowLeft')
    expect(emittedOf(wrapper, 'update:modelValue')).toBeUndefined()

    await keydown(wrapper, 0, 'ArrowRight')
    expect(lastEmit(wrapper, 'update:modelValue')).toEqual(['b'])
    await keydown(wrapper, 1, 'ArrowRight')
    await keydown(wrapper, 2, 'ArrowRight')
    expect(lastEmit(wrapper, 'update:modelValue')).toEqual(['d'])
    await keydown(wrapper, 3, 'ArrowRight')
    expect(lastEmit(wrapper, 'update:modelValue')).toEqual(['d'])
    wrapper.unmount()
  })

  it('漫游跳过禁用条目', async () => {
    const wrapper = await mountStateful({ modelValue: 'a', tabs: TABS_WITH_DISABLED })
    await keydown(wrapper, 0, 'ArrowRight')
    // 'x' 禁用：直接落到下一个可用条目，激活项也不会停在禁用项上
    expect(lastEmit(wrapper, 'update:modelValue')).toEqual(['b'])
    expect(document.activeElement).toBe(items(wrapper)[2].element)
    wrapper.unmount()
  })
})

describe('EtTabStrip 窄屏溢出', () => {
  it('宽度充足时无溢出，「更多」入口退场（不占宽）', async () => {
    const wrapper = await mountStrip()
    expect(items(wrapper).filter((i) => i.classes().includes('is-collapsed'))).toHaveLength(0)
    expect(wrapper.find('.et-tabstrip__more').classes()).toContain('is-hidden')
    wrapper.unmount()
  })

  it('容器宽度不足时尾部条目收进「更多」，入口带条目数角标', async () => {
    const wrapper = await mountStrip({ modelValue: 'a' })
    await stubWidths(wrapper, {
      clientWidth: 250,
      itemWidths: [100, 100, 100, 100],
      moreWidth: 40,
    })

    const list = items(wrapper)
    expect(list[0].classes()).not.toContain('is-collapsed')
    expect(list[1].classes()).not.toContain('is-collapsed')
    expect(list[2].classes()).toContain('is-collapsed')
    expect(list[3].classes()).toContain('is-collapsed')
    // 收起的条目从读屏树里摘掉（改由菜单代理）
    expect(list[2].attributes('aria-hidden')).toBe('true')

    const more = wrapper.find('.et-tabstrip__more')
    expect(more.classes()).not.toContain('is-hidden')
    expect(wrapper.find('.et-tabstrip__more-badge').text()).toBe('2')
    wrapper.unmount()
  })

  it('tabs 变化后重新规划（新增条目不漏量、按新容量重算）', async () => {
    // 原型级 offsetWidth：新增条目在量的时候就已经有宽可读（jsdom 无布局）
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      value: 100,
      configurable: true,
    })
    try {
      const wrapper = await mountStrip({
        modelValue: 'a',
        tabs: [
          { id: 'a', label: 'Alpha' },
          { id: 'b', label: 'Beta' },
        ],
      })
      Object.defineProperty(wrapper.element, 'clientWidth', { value: 250, configurable: true })
      Object.defineProperty(wrapper.find('.et-tabstrip__more').element, 'offsetWidth', {
        value: 40,
        configurable: true,
      })
      // 2 × 100 = 200 ≤ 250：无溢出
      roInstances[0].callback()
      await nextTick()
      expect(wrapper.findAll('.et-tabstrip__item.is-collapsed')).toHaveLength(0)

      await wrapper.setProps({ tabs: TABS })
      await nextTick()
      await nextTick()
      // 4 × 100 = 400 > 250，留 2 条 + 更多 = 240 ≤ 250
      expect(wrapper.findAll('.et-tabstrip__item.is-collapsed')).toHaveLength(2)
      wrapper.unmount()
    } finally {
      delete HTMLElement.prototype.offsetWidth
    }
  })

  it('「更多」下拉条目点击 = 切到该 tab', async () => {
    const wrapper = await mountStrip({ modelValue: 'a' })
    await stubWidths(wrapper, {
      clientWidth: 250,
      itemWidths: [100, 100, 100, 100],
      moreWidth: 40,
    })

    await wrapper.find('.et-tabstrip__more .eb-dropdown__trigger-inner').trigger('click')
    await nextTick()
    const menuItems = document.querySelectorAll('.eb-dropdown-menu__item')
    expect(menuItems).toHaveLength(2)
    expect(menuItems[0].textContent).toContain('Gamma')

    fire(menuItems[0], 'click')
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toEqual([['c']])
    expect(wrapper.emitted('change')).toEqual([['c']])
    wrapper.unmount()
  })
})

describe('EtTabStrip 观察器生命周期', () => {
  it('挂载时观察容器、卸载时断开（06 §四 内存预算）', async () => {
    const wrapper = await mountStrip()
    expect(roInstances).toHaveLength(1)
    expect(roInstances[0].observe).toHaveBeenCalledWith(wrapper.element)
    wrapper.unmount()
    expect(roInstances[0].disconnect).toHaveBeenCalled()
  })

  it('无 ResizeObserver 的环境（jsdom / SSR）也能挂载', async () => {
    vi.unstubAllGlobals()
    const wrapper = await mountStrip()
    expect(wrapper.find('[role="tablist"]').exists()).toBe(true)
    expect(items(wrapper)).toHaveLength(4)
    wrapper.unmount()
  })
})
