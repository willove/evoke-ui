import { describe, it, expect } from 'vitest'
import { encodeQR, QRCODE_MAX_BYTES } from '../src/components/qrcode/qrcode'
import { normalizeHex, mixHex, generatePrimaryRamp } from '../src/utils/theme'
import { mount } from '@vue/test-utils'
import EvVirtualList from '../src/components/virtual-list/index.vue'
import EvListy from '../src/components/virtual-list/index.vue'
import EvAutoComplete from '../src/components/auto-complete/index.vue'

/**
 * VirtualList / AutoComplete / QRCode 编码器 / 主题工具
 */

describe('EvVirtualList', () => {
  function makeItems(n) {
    return Array.from({ length: n }, (_, i) => ({ id: i, name: `item-${i}` }))
  }

  it('固定行高：只渲染可视窗口 + 缓冲', async () => {
    const wrapper = mount(EvVirtualList, {
      props: { items: makeItems(1000), itemKey: 'id', itemSize: 40, height: 400, buffer: 5 },
    })
    await wrapper.vm.$nextTick()
    // 视口 400/40=10 条 + 上下各 5 缓冲 → 远小于 1000
    const rendered = wrapper.findAll('.ev-virtual-list__item').length
    expect(rendered).toBeLessThan(30)
    expect(rendered).toBeGreaterThan(0)
    // 占位总高 = 1000 * 40
    const spacer = wrapper.find('.ev-virtual-list__spacer')
    expect(spacer.element.style.height).toBe('40000px')
    wrapper.unmount()
  })

  it('range-change 事件与 scrollTo API', async () => {
    const wrapper = mount(EvVirtualList, {
      props: { items: makeItems(100), itemKey: 'id', itemSize: 20, height: 200 },
    })
    await wrapper.vm.$nextTick()
    const emitted = wrapper.emitted('range-change')
    expect(emitted).toBeTruthy()
    // jsdom 无布局引擎，scrollTop 恒为 0，只验证 API 可调用与初始窗口合法
    expect(() => wrapper.vm.scrollTo(50)).not.toThrow()
    expect(() => wrapper.vm.scrollToTop()).not.toThrow()
    const range = wrapper.vm.getVisibleRange()
    expect(range.start).toBeLessThanOrEqual(50)
    expect(range.end).toBeLessThan(100)
    wrapper.unmount()
  })

  it('空数据不渲染条目', async () => {
    const wrapper = mount(EvVirtualList, {
      props: { items: [], itemSize: 40, height: 200 },
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.ev-virtual-list__item').length).toBe(0)
    wrapper.unmount()
  })
})

describe('EvListy（EvVirtualList 别名）', () => {
  it('同一组件对象：ev-listy 标签等价 ev-virtual-list', () => {
    expect(EvListy).toBe(EvVirtualList)
  })

  it('千级数据只渲染窗口', async () => {
    const items = Array.from({ length: 2000 }, (_, i) => ({ id: i, text: `x${i}` }))
    const wrapper = mount(EvListy, {
      props: { items, itemKey: 'id', itemSize: 32, height: 320 },
      slots: { default: `<template #default="{ item }"><div class="row">{{ item.text }}</div></template>` },
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.ev-virtual-list__item').length).toBeLessThan(40)
    wrapper.unmount()
  })
})

describe('EvAutoComplete', () => {
  // 弹层 Teleport 到 body，须 attachTo 并从 document 查询
  function mountAC(props = {}) {
    const wrapper = mount(EvAutoComplete, {
      props,
      attachTo: document.body,
    })
    return wrapper
  }

  it('静态候选 + 输入过滤', async () => {
    const wrapper = mountAC({
      modelValue: '',
      suggestions: ['Apple', 'Banana', 'Cherry'],
      debounce: 0,
    })
    const input = wrapper.find('input')
    await input.setValue('an')
    await new Promise((r) => setTimeout(r, 10))
    await wrapper.vm.$nextTick()
    expect(document.body.textContent).toContain('Banana')
    wrapper.unmount()
  })

  it('fetchSuggestions 异步联想', async () => {
    const fetchSuggestions = (q, cb) => {
      setTimeout(() => cb([{ value: `${q}-result` }]), 5)
    }
    const wrapper = mountAC({ modelValue: '', fetchSuggestions, debounce: 0 })
    const input = wrapper.find('input')
    await input.setValue('ab')
    await new Promise((r) => setTimeout(r, 30))
    await wrapper.vm.$nextTick()
    expect(document.body.textContent).toContain('ab-result')
    wrapper.unmount()
  })

  it('minlength 未达阈值不弹面板', async () => {
    const wrapper = mountAC({
      modelValue: '',
      suggestions: ['Apple'],
      debounce: 0,
      minlength: 2,
    })
    const input = wrapper.find('input')
    await input.setValue('a')
    await new Promise((r) => setTimeout(r, 10))
    expect(document.querySelector('.ev-autocomplete__menu')).toBeNull()
    wrapper.unmount()
  })
})

describe('QRCode 编码器', () => {
  function assertNoNull(matrix) {
    for (const row of matrix) for (const v of row) expect(v === true || v === false).toBe(true)
  }

  it('短文本 → v1 21×21，定位图案结构正确', () => {
    const { matrix, version, size } = encodeQR('HELLO WORLD')
    expect(version).toBe(1)
    expect(size).toBe(21)
    expect(matrix.length).toBe(21)
    assertNoNull(matrix)
    // 三个定位角为暗，分隔带为亮
    expect(matrix[0][0]).toBe(true)
    expect(matrix[0][6]).toBe(true)
    expect(matrix[6][0]).toBe(true)
    expect(matrix[7][7]).toBe(false)
    // 暗色模块（恒暗）
    expect(matrix[size - 8][8]).toBe(true)
  })

  it('输出确定性：同输入同矩阵', () => {
    const a = encodeQR('https://evoke-ui.example.com/dashboard?id=42')
    const b = encodeQR('https://evoke-ui.example.com/dashboard?id=42')
    expect(JSON.stringify(a.matrix)).toBe(JSON.stringify(b.matrix))
  })

  it('UTF-8 中文按字节计入容量', () => {
    const cn = '企业级中后台组件库'.repeat(10) // 9 汉字 ×10 = 270 bytes 超出
    expect(() => encodeQR(cn)).toThrow()
    const ok = encodeQR('企业级中后台组件库') // 27 bytes → v2/3 级别
    expect(ok.version).toBeGreaterThanOrEqual(2)
    assertNoNull(ok.matrix)
  })

  it('容量边界：接近上限可用，超出抛错', () => {
    const near = 'a'.repeat(QRCODE_MAX_BYTES - 10)
    const ok = encodeQR(near)
    expect(ok.version).toBe(10)
    expect(() => encodeQR('a'.repeat(QRCODE_MAX_BYTES + 50))).toThrow()
  })

  it('数据往返校验：固定掩码下从矩阵反读数据码字与规范一致（v1 无对齐图案）', () => {
    const text = 'HELLO WORLD' // 11 字节 → v1-M（容量 16 数据码字，无对齐图案）
    const { matrix } = encodeQR(text, { maskId: 0 })
    const n = matrix.length
    const MASK0 = (r, c) => (r + c) % 2 === 0
    const isFunction = (r, c) => {
      const inFinder = (r <= 8 && c <= 8) || (r <= 8 && c >= n - 8) || (r >= n - 8 && c <= 8)
      if (inFinder) return true
      if (r === 6 || c === 6) return true
      const formatZone =
        (r === 8 && c <= 8) ||
        (c === 8 && r <= 8) ||
        (r === 8 && c >= n - 8) ||
        (c === 8 && r >= n - 8) ||
        (r === n - 8 && c === 8)
      if (formatZone) return true
      return false
    }
    const bits = []
    let upward = true
    for (let col = n - 1; col > 0; col -= 2) {
      if (col === 6) col--
      for (let i = 0; i < n; i++) {
        const row = upward ? n - 1 - i : i
        for (const c of [col, col - 1]) {
          if (isFunction(row, c)) continue
          let dark = matrix[row][c]
          if (MASK0(row, c)) dark = !dark
          bits.push(dark ? 1 : 0)
        }
      }
      upward = !upward
    }
    const codewords = []
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      let b = 0
      for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j]
      codewords.push(b)
    }
    expect(codewords.length).toBe(26) // v1-M 共 16 数据 + 10 纠错
    // 按规范独立重算数据码字：byte 模式 + 计数 + 内容 + 终止符 + 填充
    const expected = []
    const dataBits = []
    const put = (num, len) => {
      for (let i = len - 1; i >= 0; i--) dataBits.push((num >>> i) & 1)
    }
    put(0b0100, 4)
    put(text.length, 8)
    for (const ch of text) put(ch.charCodeAt(0), 8)
    for (let i = 0; i < 4 && dataBits.length % 8 !== 0; i++) dataBits.push(0)
    while (dataBits.length % 8 !== 0) dataBits.push(0)
    for (let i = 0; i < dataBits.length; i += 8) {
      let b = 0
      for (let j = 0; j < 8; j++) b = (b << 1) | dataBits[i + j]
      expected.push(b)
    }
    const pads = [0xec, 0x11]
    let pi = 0
    while (expected.length < 16) expected.push(pads[pi++ % 2])
    // 前 16 个码字必须逐一吻合（验证段编码 + 之字形布点 + 掩码应用全链路）
    expect(codewords.slice(0, 16)).toEqual(expected)
  })
})

describe('theme utils（回归）', () => {
  it('normalizeHex + mixHex 快照', () => {
    expect(normalizeHex('#4D8BFF')).toBe('#4d8bff')
    expect(mixHex('#ffffff', '#000000', 1)).toBe('#000000')
    expect(generatePrimaryRamp('#175DFF')['--ev-color-primary']).toBe('#175dff')
  })
})
