import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EbContextMenu from '../src/components/context-menu/index.vue'

const wait = (ms = 30) => new Promise((r) => setTimeout(r, ms))

const ITEMS = [
  { label: '复制', icon: 'copy', command: 'copy' },
  { label: '编辑', icon: 'edit', command: 'edit', disabled: true },
  { label: '删除', icon: 'delete', command: 'delete', divided: true, danger: true },
]

function mountRegion(props = {}, items = ITEMS) {
  return mount(EbContextMenu, {
    props: { items, ...props },
    slots: { default: '<div class="region">右键区域</div>' },
    attachTo: document.body,
  })
}

function openByRegion(wrapper, x = 30, y = 40) {
  const evt = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y })
  wrapper.find('.region').element.dispatchEvent(evt)
  return evt
}

function popper() {
  return document.querySelector('.eb-context-menu__popper')
}

function itemEls() {
  return [...popper().querySelectorAll(':scope > .eb-context-menu__item')]
}

let wrapper

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.querySelectorAll('.eb-context-menu__popper').forEach((el) => el.remove())
})

describe('EbContextMenu 右键菜单', () => {
  it('区域右键弹出菜单：阻止默认行为 + role=menu 语义', async () => {
    wrapper = mountRegion()
    expect(popper()).toBeNull()
    const evt = openByRegion(wrapper)
    await wait()
    expect(evt.defaultPrevented).toBe(true)
    expect(popper()).toBeTruthy()
    expect(popper().getAttribute('role')).toBe('menu')
    expect(itemEls().length).toBe(3)
    expect(itemEls()[0].getAttribute('role')).toBe('menuitem')
  })

  it('菜单项形态：icon 渲染、disabled/divided/danger 修饰类与 aria', async () => {
    wrapper = mountRegion()
    openByRegion(wrapper)
    await wait()
    expect(itemEls()[0].querySelector('.eb-context-menu__icon')).toBeTruthy()
    expect(itemEls()[0].querySelector('.eb-context-menu__label').textContent).toBe('复制')
    expect(itemEls()[1].classList.contains('is-disabled')).toBe(true)
    expect(itemEls()[1].getAttribute('aria-disabled')).toBe('true')
    expect(itemEls()[2].classList.contains('is-divided')).toBe(true)
    expect(itemEls()[2].classList.contains('is-danger')).toBe(true)
  })

  it('点击菜单项抛 command 并自动收起，visible-change 依次抛 true/false', async () => {
    wrapper = mountRegion()
    openByRegion(wrapper)
    await wait()
    itemEls()[0].click()
    await wait()
    const host = wrapper.findComponent(EbContextMenu)
    expect(host.emitted('command')[0]).toEqual(['copy'])
    expect(popper()).toBeNull()
    expect(host.emitted('visible-change').map((c) => c[0])).toEqual([true, false])
  })

  it('禁用项点击不抛 command 也不收起', async () => {
    wrapper = mountRegion()
    openByRegion(wrapper)
    await wait()
    itemEls()[1].click()
    await wait()
    expect(wrapper.findComponent(EbContextMenu).emitted('command')).toBeUndefined()
    expect(popper()).toBeTruthy()
  })

  it('ESC 与点击外部（pointerdown）均收起', async () => {
    wrapper = mountRegion()
    openByRegion(wrapper)
    await wait()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wait()
    expect(popper()).toBeNull()

    openByRegion(wrapper)
    await wait()
    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await wait()
    expect(popper()).toBeNull()
  })

  it('滚动意图收起，浮层内部滚动除外', async () => {
    wrapper = mountRegion()
    openByRegion(wrapper)
    await wait()
    document.dispatchEvent(new Event('wheel'))
    await wait()
    expect(popper()).toBeNull()

    openByRegion(wrapper)
    await wait()
    popper().dispatchEvent(new Event('wheel', { bubbles: true }))
    await wait()
    expect(popper()).toBeTruthy()
  })

  it('disabled 时区域右键不弹出不拦截默认行为', async () => {
    wrapper = mountRegion({ disabled: true })
    const evt = openByRegion(wrapper)
    await wait()
    expect(evt.defaultPrevented).toBe(false)
    expect(popper()).toBeNull()
  })

  it('命令式 open/close：支持坐标点与 itemsOverride 按目标切换菜单', async () => {
    wrapper = mount(EbContextMenu, {
      props: { items: ITEMS },
      attachTo: document.body,
    })
    const host = wrapper.findComponent(EbContextMenu)
    host.vm.open({ x: 120, y: 80 }, [{ label: '仅此一项', command: 'only' }])
    await wait()
    expect(popper().textContent).toContain('仅此一项')
    expect(popper().textContent).not.toContain('复制')
    expect(host.emitted('visible-change')[0]).toEqual([true])

    host.vm.close()
    await wait()
    expect(popper()).toBeNull()
    expect(host.emitted('visible-change')[1]).toEqual([false])
  })

  it('命令式 open 接受 MouseEvent 形参取光标坐标', async () => {
    wrapper = mount(EbContextMenu, {
      props: { items: ITEMS },
      attachTo: document.body,
    })
    const host = wrapper.findComponent(EbContextMenu)
    host.vm.open(new MouseEvent('contextmenu', { clientX: 66, clientY: 88 }))
    await wait()
    expect(popper()).toBeTruthy()
    expect(popper().style.left).toContain('px')
  })

  it('一级子菜单：hover 延时展开、aria 标注、点击子项抛 command 并整体收起', async () => {
    wrapper = mountRegion(
      {},
      [
        { label: '排序', icon: 'refresh', children: [
          { label: '升序', command: 'asc' },
          { label: '降序', command: 'desc', danger: true },
        ] },
        { label: '刷新', command: 'refresh' },
      ]
    )
    openByRegion(wrapper)
    await wait()
    const parent = itemEls()[0]
    expect(parent.getAttribute('aria-haspopup')).toBe('menu')
    expect(document.querySelector('.eb-context-menu__submenu')).toBeNull()

    parent.dispatchEvent(new MouseEvent('mouseenter'))
    await wait(200)
    const sub = document.querySelector('.eb-context-menu__submenu')
    expect(sub).toBeTruthy()
    expect(sub.querySelectorAll('.eb-context-menu__item').length).toBe(2)
    expect(parent.getAttribute('aria-expanded')).toBe('true')

    const asc = [...sub.querySelectorAll('.eb-context-menu__item')].find((li) => li.textContent.includes('升序'))
    asc.click()
    await wait()
    const host = wrapper.findComponent(EbContextMenu)
    expect(host.emitted('command')[0]).toEqual(['asc'])
    expect(popper()).toBeNull()
  })

  it('子菜单移出延时收起', async () => {
    wrapper = mountRegion(
      {},
      [{ label: '排序', children: [{ label: '升序', command: 'asc' }] }]
    )
    openByRegion(wrapper)
    await wait()
    const parent = itemEls()[0]
    parent.dispatchEvent(new MouseEvent('mouseenter'))
    await wait(200)
    expect(document.querySelector('.eb-context-menu__submenu')).toBeTruthy()
    parent.dispatchEvent(new MouseEvent('mouseleave'))
    await wait(220)
    expect(document.querySelector('.eb-context-menu__submenu')).toBeNull()
  })

  it('点击带子菜单的父项仅展开子菜单、不抛 command', async () => {
    wrapper = mountRegion(
      {},
      [{ label: '排序', children: [{ label: '升序', command: 'asc' }] }]
    )
    openByRegion(wrapper)
    await wait()
    itemEls()[0].click()
    await wait()
    expect(wrapper.findComponent(EbContextMenu).emitted('command')).toBeUndefined()
    expect(document.querySelector('.eb-context-menu__submenu')).toBeTruthy()
  })

  it('子菜单 Teleport 至 body 独立挂载，不被父浮层 overflow 裁切', async () => {
    wrapper = mountRegion(
      {},
      [{ label: '排序', children: [{ label: '升序', command: 'asc' }] }]
    )
    openByRegion(wrapper)
    await wait()
    itemEls()[0].dispatchEvent(new MouseEvent('mouseenter'))
    await wait(200)
    const popperEl = popper()
    const sub = document.querySelector('.eb-context-menu__submenu')
    expect(sub).toBeTruthy()
    // 独立挂载：不在父浮层 DOM 子树内，直接挂在 body 下
    expect(popperEl.contains(sub)).toBe(false)
    expect(sub.parentElement).toBe(document.body)
    // 层标记：主浮层与子菜单都带，供关闭判定识别"层内"
    expect(popperEl.hasAttribute('data-eb-context-menu-layer')).toBe(true)
    expect(sub.hasAttribute('data-eb-context-menu-layer')).toBe(true)
    expect(sub.style.position).toBe('fixed')
  })

  it('子菜单层内 pointerdown / wheel 不误关菜单', async () => {
    wrapper = mountRegion(
      {},
      [{ label: '排序', children: [{ label: '升序', command: 'asc' }] }]
    )
    openByRegion(wrapper)
    await wait()
    itemEls()[0].dispatchEvent(new MouseEvent('mouseenter'))
    await wait(200)
    const sub = document.querySelector('.eb-context-menu__submenu')

    sub.querySelector('.eb-context-menu__item')
      .dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await wait()
    expect(popper()).toBeTruthy()

    sub.dispatchEvent(new Event('wheel', { bubbles: true }))
    await wait()
    expect(popper()).toBeTruthy()
  })
})
