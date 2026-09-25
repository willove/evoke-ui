import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EtCommandPalette from '../src/components/command-palette/index.vue'
import { createCommandRegistry } from '../src/runtime/command/registry'

const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

afterEach(() => {
  document.body.innerHTML = ''
  localStorage.clear()
})

/** 可控命令表（G3：命令 id 均为本测试自行注册的合法 kebab-case；运行时不依赖 demo） */
function makeRegistry() {
  const r = createCommandRegistry()
  const spies = { copy: 0, bold: 0, zoom: 0, clear: 0 }
  r.registerAll([
    { id: 'copy', title: '复制', desc: '复制选区', keys: 'mod+c', icon: 'copy', group: '剪贴板', run: () => spies.copy++ },
    { id: 'bold', title: '加粗', keys: 'mod+b', icon: 'bold', group: '字体', run: () => spies.bold++ },
    { id: 'font-size', title: '字号', desc: '设置字号', icon: 'font-size', group: '字体', run: () => {} },
    { id: 'clear', title: '清除', icon: 'close', group: '剪贴板', enabled: () => false, run: () => spies.clear++ },
  ])
  r.spies = spies
  return r
}

function findItem(labelText) {
  return [...document.querySelectorAll('.eb-command-palette__item')].find((el) =>
    el.querySelector('.eb-command-palette__item-label')?.textContent?.includes(labelText),
  )
}

function itemHotkey(el) {
  return el.querySelector('.eb-command-palette__kbd--item')?.textContent ?? ''
}

describe('EtCommandPalette（M1 交付物 4 / 底座 EbCommandPalette 适配）', () => {
  it('items 由命令表生成：label / hint / hotkey / group', async () => {
    const registry = makeRegistry()
    const wrapper = mount(EtCommandPalette, {
      props: { registry, modelValue: true },
      attachTo: document.body,
    })
    await tick()

    const copy = findItem('复制')
    expect(copy).toBeTruthy()
    // label = title，hint = desc
    expect(copy.querySelector('.eb-command-palette__item-label').textContent).toBe('复制')
    expect(copy.querySelector('.eb-command-palette__item-hint').textContent).toBe('复制选区')
    // Windows 默认平台：mod+c → Ctrl+C
    expect(itemHotkey(copy)).toBe('Ctrl+C')

    // 加粗：hotkey 由 keys 符号化
    expect(itemHotkey(findItem('加粗'))).toBe('Ctrl+B')
    // 字号：无 keys → 不渲染快捷键 kbd；有 desc → 有 hint
    const fontSize = findItem('字号')
    expect(fontSize.querySelector('.eb-command-palette__item-hint').textContent).toBe('设置字号')
    expect(itemHotkey(fontSize)).toBe('')

    // group 分区标签来自命令表 group
    const groups = [...document.querySelectorAll('.eb-command-palette__group-label')].map((el) => el.textContent)
    expect(groups).toContain('剪贴板')
    expect(groups).toContain('字体')

    wrapper.unmount()
  })

  it('禁用命令不过滤：仍在列表、键位照显、action 保持面板打开且不执行', async () => {
    const registry = makeRegistry()
    const wrapper = mount(EtCommandPalette, {
      props: { registry, modelValue: true },
      attachTo: document.body,
    })
    await tick()

    // 禁用命令仍在列表（用户要看得见为什么不可用）
    const clear = findItem('清除')
    expect(clear).toBeTruthy()

    clear.click()
    await tick()

    // action 返回 false → 底座保持面板打开；未执行 run、未 emit command
    expect(document.querySelector('.eb-command-palette')).toBeTruthy()
    expect(registry.spies.clear).toBe(0)
    expect(wrapper.emitted('command')).toBeFalsy()

    wrapper.unmount()
  })

  it('最近使用：recentKey 命中的置顶；选中后写回（去重、截断到 5）', async () => {
    const registry = makeRegistry()
    // 预置最近使用：bold 最近
    localStorage.setItem('et-palette-recent:demo', JSON.stringify(['bold']))

    const wrapper = mount(EtCommandPalette, {
      props: { registry, recentKey: 'demo', runOnSelect: true, modelValue: true },
      attachTo: document.body,
    })
    await tick()

    // 命中的命令置顶为第一项
    const first = document.querySelector('.eb-command-palette__item')
    expect(first.querySelector('.eb-command-palette__item-label').textContent).toBe('加粗')

    // 选中另一条命令 → 写回 localStorage（去重、最新在前、截断到 5）
    findItem('复制').click()
    await tick()
    expect(JSON.parse(localStorage.getItem('et-palette-recent:demo'))).toEqual(['copy', 'bold'])
    expect(registry.spies.copy).toBe(1)
    expect(wrapper.emitted('command')[0]).toEqual(['copy'])

    wrapper.unmount()
  })

  it('runOnSelect 语义：默认只 emit 不 run；true 时先 run 再 emit', async () => {
    // 默认模式（runOnSelect=false）：执行体归消费方——只 emit('command', id)，不碰 registry.run
    const registryA = makeRegistry()
    const wrapperA = mount(EtCommandPalette, {
      props: { registry: registryA, modelValue: true },
      attachTo: document.body,
    })
    await tick()
    const runA = vi.spyOn(registryA, 'run')
    findItem('复制').click()
    await tick()
    expect(wrapperA.emitted('command')[0]).toEqual(['copy'])
    expect(runA).not.toHaveBeenCalled()
    expect(registryA.spies.copy).toBe(0)
    wrapperA.unmount()

    // 便捷模式（runOnSelect=true）：选中即执行——registry.run 与 emit 都发生
    const registryB = makeRegistry()
    const wrapperB = mount(EtCommandPalette, {
      props: { registry: registryB, runOnSelect: true, modelValue: true },
      attachTo: document.body,
    })
    await tick()
    const runB = vi.spyOn(registryB, 'run')
    findItem('复制').click()
    await tick()
    expect(runB).toHaveBeenCalledWith('copy', {})
    expect(registryB.spies.copy).toBe(1)
    expect(wrapperB.emitted('command')[0]).toEqual(['copy'])
    wrapperB.unmount()
  })

  it('open / close 转发底座（update:modelValue）', async () => {
    const registry = makeRegistry()
    const wrapper = mount(EtCommandPalette, {
      props: { registry, modelValue: false },
      attachTo: document.body,
    })

    expect(typeof wrapper.vm.open).toBe('function')
    expect(typeof wrapper.vm.close).toBe('function')

    wrapper.vm.open()
    await tick()
    expect(wrapper.emitted('update:modelValue')).toContainEqual([true])

    // modelValue 拉高后面板真实渲染；close() 转发为 update:modelValue false
    await wrapper.setProps({ modelValue: true })
    await tick()
    expect(document.querySelector('.eb-command-palette')).toBeTruthy()
    wrapper.vm.close()
    await tick()
    expect(wrapper.emitted('update:modelValue')).toContainEqual([false])

    wrapper.unmount()
  })

  it('hotkey 平台符号化：win 与 mac 各断言一次', async () => {
    const registry = makeRegistry()
    const originalUA = window.navigator.userAgent

    const wrapper = mount(EtCommandPalette, {
      props: { registry, modelValue: true },
      attachTo: document.body,
    })
    await tick()
    // jsdom 默认 UA 非 Mac → win 平台
    expect(itemHotkey(findItem('复制'))).toBe('Ctrl+C')

    // 切到 mac UA，重开面板（触发 items 重算 → 走 mac 符号）
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
      configurable: true,
    })
    await wrapper.setProps({ modelValue: false })
    await tick()
    await wrapper.setProps({ modelValue: true })
    await tick()
    expect(itemHotkey(findItem('复制'))).toBe('⌘C')

    Object.defineProperty(window.navigator, 'userAgent', { value: originalUA, configurable: true })
    wrapper.unmount()
  })
})
