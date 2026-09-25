import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import EtDocumentTabs from '../src/components/document-tabs/index.vue'
import EbPopconfirm from '@wil-works/evoke-business-ui/popconfirm'

/**
 * EtDocumentTabs 组件契约（tools-ui 计划 05 §四 L3 验收要点）
 *
 * 多文档标签条：documents → 条目、脏标记（圆点 + 未保存读屏名）、关闭 emit
 * （closable=false 不发）、关闭确认（confirmClose + confirmText 才弹）、
 * 溢出列表（planOverflow 复用 tab-strip 契约）、键盘漫游、观察器生命周期。
 */

const DOCS = [
  { id: 'a', title: 'Alpha' },
  { id: 'b', title: 'Beta', closable: true },
  { id: 'c', title: 'Gamma' },
  { id: 'd', title: 'Delta', dirty: true },
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

const mountTabs = async (props = {}) => {
  const wrapper = mount(EtDocumentTabs, {
    props: { documents: DOCS, modelValue: 'a', ...props },
    attachTo: document.body,
  })
  await nextTick()
  return wrapper
}

/**
 * 带回写的挂载：漫游要靠父组件把 update:modelValue 回写才推得动激活项
 * （真实用法就是 v-model）。emit 断言走 findComponent(EtDocumentTabs)。
 */
const mountStateful = async (props = {}) => {
  const { documents = DOCS, modelValue = 'a', ...rest } = props
  const wrapper = mount(
    {
      components: { EtDocumentTabs },
      template: '<EtDocumentTabs :documents="documents" v-model="active" v-bind="rest" />',
      setup() {
        const active = ref(modelValue)
        return { documents, active, rest }
      },
    },
    { attachTo: document.body },
  )
  await nextTick()
  return wrapper
}

const emittedOf = (wrapper, event) => wrapper.findComponent(EtDocumentTabs).emitted(event)
const lastEmit = (wrapper, event) => {
  const record = emittedOf(wrapper, event)
  return record?.[record.length - 1]
}

const items = (wrapper) => wrapper.findAll('.et-doctabs__item')

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
  Object.defineProperty(wrapper.find('.et-doctabs__more').element, 'offsetWidth', {
    value: moreWidth,
    configurable: true,
  })
  roInstances[0]?.callback()
  return nextTick()
}

describe('EtDocumentTabs 渲染与脏标记', () => {
  it('documents → 条目：tablist/tab/aria-selected，标题原样渲染', async () => {
    const wrapper = await mountTabs({ modelValue: 'b' })
    expect(wrapper.find('[role="tablist"]').exists()).toBe(true)
    const list = items(wrapper)
    expect(list).toHaveLength(4)
    expect(list.map((i) => i.text().replace(/\s+/g, ''))).toEqual([
      'Alpha',
      'Beta',
      'Gamma',
      'Delta',
    ])
    expect(list[1].attributes('aria-selected')).toBe('true')
    expect(list[0].attributes('aria-selected')).toBe('false')
    expect(list[1].classes()).toContain('is-active')
    wrapper.unmount()
  })

  it('roving tabindex：整组只有一个 tab 位（激活项 0，其余 -1）', async () => {
    const wrapper = await mountTabs({ modelValue: 'b' })
    expect(items(wrapper).map((i) => i.attributes('tabindex'))).toEqual(['-1', '0', '-1', '-1'])
    wrapper.unmount()
  })

  it('dirty 文档：条目 is-dirty + CSS 圆点 + 圆点与条目的读屏名都补"未保存"', async () => {
    const wrapper = await mountTabs()
    const dirtyItem = items(wrapper)[3]
    expect(dirtyItem.classes()).toContain('is-dirty')
    const dot = dirtyItem.find('.et-doctabs__dirty')
    expect(dot.exists()).toBe(true)
    expect(dot.attributes('aria-label')).toBe('未保存')
    expect(dirtyItem.attributes('aria-label')).toBe('Delta，未保存')
    // 非脏文档：无圆点、条目不带 is-dirty
    expect(items(wrapper)[0].classes()).not.toContain('is-dirty')
    expect(items(wrapper)[0].find('.et-doctabs__dirty').exists()).toBe(false)
    expect(items(wrapper)[0].attributes('aria-label')).toBe('Alpha')
    wrapper.unmount()
  })

  it('干净文档不渲染关闭钮之外的多余控件（关闭钮仅可关闭文档有）', async () => {
    const wrapper = await mountTabs()
    // a / c / d 未声明 closable → 仍然可关闭（closable !== false 才算不可关）
    expect(items(wrapper).map((i) => i.find('.et-doctabs__close').exists())).toEqual([
      true,
      true,
      true,
      true,
    ])
    wrapper.unmount()
  })
})

describe('EtDocumentTabs 选中与关闭', () => {
  it('点击条目 emit update:modelValue + change', async () => {
    const wrapper = await mountTabs()
    await items(wrapper)[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['c']])
    expect(wrapper.emitted('change')).toEqual([['c']])
    wrapper.unmount()
  })

  it('点已激活条目不重复 emit', async () => {
    const wrapper = await mountTabs()
    await items(wrapper)[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('change')).toBeUndefined()
    wrapper.unmount()
  })

  it('点关闭钮 emit close 且不触发选中', async () => {
    const wrapper = await mountTabs()
    const close = items(wrapper)[1].find('.et-doctabs__close')
    expect(close.attributes('aria-label')).toBe('关闭 Beta')
    await close.trigger('click')
    expect(wrapper.emitted('close')).toEqual([['b']])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('change')).toBeUndefined()
    wrapper.unmount()
  })

  it('closable=false 的文档不渲染关闭钮、也发不出 close', async () => {
    const wrapper = await mountTabs({
      documents: [
        { id: 'a', title: 'Alpha' },
        { id: 'locked', title: 'Locked', closable: false },
      ],
    })
    expect(items(wrapper)[0].find('.et-doctabs__close').exists()).toBe(true)
    expect(items(wrapper)[1].find('.et-doctabs__close').exists()).toBe(false)
    await items(wrapper)[1].trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()
    wrapper.unmount()
  })

  it('右键 emit context（id + event）', async () => {
    const wrapper = await mountTabs()
    await items(wrapper)[2].trigger('contextmenu')
    expect(wrapper.emitted('context')).toBeTruthy()
    expect(wrapper.emitted('context')[0][0]).toBe('c')
    expect(wrapper.emitted('context')[0][1]).toBeInstanceOf(MouseEvent)
    wrapper.unmount()
  })
})

describe('EtDocumentTabs 关闭确认', () => {
  it('confirmClose + confirmText 才包 EbPopconfirm，确认后 emit close', async () => {
    const wrapper = await mountTabs({
      confirmClose: true,
      confirmText: '有未保存的更改，确定关闭？',
    })
    expect(wrapper.findComponent(EbPopconfirm).exists()).toBe(true)
    // 点关闭钮 = 开气泡（不直接关）；气泡里点确认才 emit close
    await items(wrapper)[1].find('.et-doctabs__close').trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()
    await nextTick()
    const confirmButton = document.querySelector('.eb-popconfirm .eb-button--primary')
    expect(confirmButton).toBeTruthy()
    confirmButton.click()
    await nextTick()
    expect(wrapper.emitted('close')).toEqual([['b']])
    wrapper.unmount()
  })

  it('confirmClose 但没给确认文案：不弹，直接关闭（组件不预判产品语义）', async () => {
    const wrapper = await mountTabs({ confirmClose: true })
    expect(wrapper.findComponent(EbPopconfirm).exists()).toBe(false)
    await items(wrapper)[1].find('.et-doctabs__close').trigger('click')
    expect(wrapper.emitted('close')).toEqual([['b']])
    wrapper.unmount()
  })
})

describe('EtDocumentTabs 键盘漫游', () => {
  it('左右 / Home / End 移动激活项并把焦点落到对应 DOM（组字守卫在 roving 内）', async () => {
    const wrapper = await mountStateful()
    await items(wrapper)[0].trigger('keydown', { key: 'ArrowRight' })
    await nextTick()
    expect(lastEmit(wrapper, 'update:modelValue')).toEqual(['b'])
    expect(document.activeElement).toBe(items(wrapper)[1].element)

    await items(wrapper)[1].trigger('keydown', { key: 'ArrowRight' })
    await nextTick()
    expect(lastEmit(wrapper, 'update:modelValue')).toEqual(['c'])
    expect(document.activeElement).toBe(items(wrapper)[2].element)

    await items(wrapper)[2].trigger('keydown', { key: 'End' })
    await nextTick()
    expect(lastEmit(wrapper, 'update:modelValue')).toEqual(['d'])

    await items(wrapper)[3].trigger('keydown', { key: 'Home' })
    await nextTick()
    expect(lastEmit(wrapper, 'update:modelValue')).toEqual(['a'])
    expect(document.activeElement).toBe(items(wrapper)[0].element)
    wrapper.unmount()
  })

  it('Enter / 空格选中当前条目', async () => {
    const wrapper = await mountTabs()
    await items(wrapper)[2].trigger('keydown', { key: ' ' })
    await nextTick()
    expect(wrapper.emitted('change')).toEqual([['c']])
    wrapper.unmount()
  })
})

describe('EtDocumentTabs 窄屏溢出', () => {
  it('宽度充足时无溢出，「更多」入口退场（不占宽）', async () => {
    const wrapper = await mountTabs()
    expect(items(wrapper).filter((i) => i.classes().includes('is-collapsed'))).toHaveLength(0)
    expect(wrapper.find('.et-doctabs__more').classes()).toContain('is-hidden')
    wrapper.unmount()
  })

  it('容器宽度不足时尾部文档收进「更多」，入口带条目数角标', async () => {
    const wrapper = await mountTabs()
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

    const more = wrapper.find('.et-doctabs__more')
    expect(more.classes()).not.toContain('is-hidden')
    expect(wrapper.find('.et-doctabs__more-badge').text()).toBe('2')
    wrapper.unmount()
  })

  it('「更多」下拉点条目 = 切到该文档（脏文档在菜单里也带圆点）', async () => {
    const wrapper = await mountTabs({ documents: DOCS })
    await stubWidths(wrapper, {
      clientWidth: 250,
      itemWidths: [100, 100, 100, 100],
      moreWidth: 40,
    })

    await wrapper.find('.et-doctabs__more .eb-dropdown__trigger-inner').trigger('click')
    await nextTick()
    const menuItems = document.querySelectorAll('.eb-dropdown-menu__item')
    expect(menuItems).toHaveLength(2)
    expect(menuItems[0].textContent).toContain('Gamma')
    // 脏文档（Delta）在溢出菜单里也保留未保存圆点
    expect(menuItems[1].querySelector('.et-doctabs__dirty')).toBeTruthy()

    menuItems[0].click()
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toEqual([['c']])
    expect(wrapper.emitted('change')).toEqual([['c']])
    wrapper.unmount()
  })
})

describe('EtDocumentTabs 观察器生命周期', () => {
  it('挂载时观察容器、卸载时断开（06 §四 内存预算）', async () => {
    const wrapper = await mountTabs()
    expect(roInstances).toHaveLength(1)
    expect(roInstances[0].observe).toHaveBeenCalledWith(wrapper.element)
    wrapper.unmount()
    expect(roInstances[0].disconnect).toHaveBeenCalled()
  })

  it('无 ResizeObserver 的环境（jsdom / SSR）也能挂载', async () => {
    vi.unstubAllGlobals()
    const wrapper = await mountTabs()
    expect(wrapper.find('[role="tablist"]').exists()).toBe(true)
    expect(items(wrapper)).toHaveLength(4)
    wrapper.unmount()
  })
})
