import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import EtDropdown from '../src/components/dropdown/index.vue'
import EbDropdownItem from '../../evoke-business-ui/src/components/dropdown/item.vue'

const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms))

describe('EtDropdown', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('作用域类 et-dropdown 与底座结构、默认插槽透传', () => {
    const wrapper = mount(EtDropdown, {
      slots: { default: () => h(EbDropdownItem, { command: 'x', label: '条目' }) },
    })
    expect(wrapper.find('.et-dropdown').exists()).toBe(true)
    expect(wrapper.find('.eb-dropdown').exists()).toBe(true)
    wrapper.unmount()
  })

  it('props 透传：splitButton 渲染按钮组 + 文字', () => {
    const wrapper = mount(EtDropdown, {
      props: { trigger: 'click', splitButton: true, type: 'primary', text: '操作' },
    })
    expect(wrapper.find('.eb-dropdown__caret-button').exists()).toBe(true)
    expect(wrapper.text()).toContain('操作')
    wrapper.unmount()
  })

  it('command 与 visible-change 事件转发', async () => {
    const wrapper = mount(EtDropdown, {
      props: { trigger: 'click' },
      slots: { default: () => h(EbDropdownItem, { command: 'save', label: '保存' }) },
      attachTo: document.body,
    })
    // 点击触发器展开
    await wrapper.find('.eb-dropdown').trigger('click')
    await tick()
    const et = wrapper
    expect(et.emitted('visible-change')[0]).toEqual([true])
    // 点击菜单项 → command 上抛 + 自动收起（visible-change false）
    const item = document.querySelector('.eb-dropdown-menu__item')
    expect(item.textContent).toContain('保存')
    item.click()
    await tick()
    expect(et.emitted('command')).toBeTruthy()
    expect(et.emitted('command')[0]).toEqual(['save'])
    expect(et.emitted('visible-change')).toContainEqual([false])
    wrapper.unmount()
  })

  it('浮层菜单应用 --et-menu-*：落点是全局底座浮层类（Teleport 到 body，底座 popper 类固定）', async () => {
    const wrapper = mount(EtDropdown, {
      props: { trigger: 'click' },
      slots: { default: () => h(EbDropdownItem, { command: 'x', label: '菜单项' }) },
      attachTo: document.body,
    })
    await wrapper.find('.eb-dropdown').trigger('click')
    await tick()
    // 底座把浮层 Teleport 到 body、popper 容器类固定且不接受 popper-class 注入（探针实测），
    // 故密度菜单无法用 .et-dropdown 作用域覆盖，style.css 改写在全局 .eb-dropdown__popper 上；
    // 这里断言浮层确实渲染在 body 下（是那些全局规则的命中目标）。
    const popper = document.querySelector('.eb-dropdown__popper')
    expect(popper).toBeTruthy()
    expect(document.body.contains(popper)).toBe(true)
    wrapper.unmount()
  })

  it('popper-class 透传（合并而非覆盖，落到底座允许的位置）', () => {
    const wrapper = mount(EtDropdown, {
      props: { trigger: 'click' },
      attrs: { 'popper-class': 'my-menu' },
    })
    // 底座不接受把 popper-class 送入 Teleport 浮层；透传给底座（属性不丢失、不覆盖）
    expect(wrapper.find('.et-dropdown').attributes('popper-class')).toBe('my-menu')
    wrapper.unmount()
  })

  it('命令式转发底座 open / close', async () => {
    const wrapper = mount(EtDropdown, {
      props: { trigger: 'click' },
      slots: { default: () => h(EbDropdownItem, { command: 'x', label: 'x' }) },
      attachTo: document.body,
    })
    expect(typeof wrapper.vm.open).toBe('function')
    expect(typeof wrapper.vm.close).toBe('function')
    wrapper.vm.open()
    await tick()
    expect(document.querySelector('.eb-dropdown__popper')).toBeTruthy()
    wrapper.vm.close()
    await tick()
    expect(wrapper.emitted('visible-change')).toContainEqual([false])
    wrapper.unmount()
  })
})
