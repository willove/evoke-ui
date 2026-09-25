import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import EtProvider from '../src/components/provider/index.vue'
import { useDensity } from '../src/composables/useDensity'

describe('EtProvider — 密度提供者（03 §3.1）', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-density')
  })

  it('挂载后把 density 写到根级属性', () => {
    mount(EtProvider, { props: { density: 'compact' } })
    expect(document.documentElement.getAttribute('data-density')).toBe('compact')
  })

  it('默认档位 default', () => {
    mount(EtProvider)
    expect(document.documentElement.getAttribute('data-density')).toBe('default')
  })

  it('prop 校验只放行三档', () => {
    expect(EtProvider.props.density.validator('ultra')).toBe(false)
    expect(EtProvider.props.density.validator('compact')).toBe(true)
  })

  it('provide 的密度可被 useDensity 读到', () => {
    let seen
    const Probe = {
      components: { EtProvider },
      setup() {
        seen = useDensity()
        return () => null
      },
    }
    mount(Probe)
    expect(seen.value).toBe('default')
  })

  it('未挂 Provider 时 useDensity 回落 default', () => {
    let seen
    const Probe = { setup() { seen = useDensity(); return () => null } }
    mount(Probe)
    expect(seen.value).toBe('default')
  })

  it('运行时切档即时生效（A-19：prop 变 → 根属性跟着变，不靠刷新）', async () => {
    const wrapper = mount(EtProvider, { props: { density: 'compact' } })
    expect(document.documentElement.getAttribute('data-density')).toBe('compact')
    await wrapper.setProps({ density: 'relaxed' })
    expect(document.documentElement.getAttribute('data-density')).toBe('relaxed')
    await wrapper.setProps({ density: 'default' })
    expect(document.documentElement.getAttribute('data-density')).toBe('default')
  })

  it('运行时切档后卸载，还原的是挂载时的外部值（不是最后一次 prop）', async () => {
    document.documentElement.setAttribute('data-density', 'compact')
    const wrapper = mount(EtProvider, { props: { density: 'default' } })
    await wrapper.setProps({ density: 'relaxed' })
    expect(document.documentElement.getAttribute('data-density')).toBe('relaxed')
    wrapper.unmount()
    expect(document.documentElement.getAttribute('data-density')).toBe('compact')
  })

  it('useDensity 随 provider prop 联动（provide 的是 computed，切档即刷新）', async () => {
    let seen
    const Probe = { setup() { seen = useDensity(); return () => null } }
    const wrapper = mount(EtProvider, {
      props: { density: 'compact' },
      slots: { default: () => h(Probe) },
    })
    expect(seen.value).toBe('compact')
    await wrapper.setProps({ density: 'relaxed' })
    expect(seen.value).toBe('relaxed')
  })

  it('卸载时还原外部已有的 data-density', () => {
    document.documentElement.setAttribute('data-density', 'relaxed')
    const wrapper = mount(EtProvider, { props: { density: 'compact' } })
    expect(document.documentElement.getAttribute('data-density')).toBe('compact')
    wrapper.unmount()
    expect(document.documentElement.getAttribute('data-density')).toBe('relaxed')
  })
})
