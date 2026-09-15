import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import EbTable from '../src/components/table/index.vue'
import EbTableColumn from '../src/components/table/column.vue'

/**
 * Table 虚拟滚动（占位行）与行内编辑（editable 列 + cell-change）
 * 注：jsdom 无布局，clientHeight 恒 0 → 虚拟窗口退化为全量渲染
 * （SSR/测试安全的兜底），窗口断言通过「设视口高度 + 触发 scroll」驱动。
 */

const bigRows = Array.from({ length: 500 }, (_, i) => ({
  id: i + 1,
  name: `项目 ${i + 1}`,
  value: i * 10,
}))

function mountTable(props = {}, nameColProps = {}) {
  return mount(EbTable, {
    props,
    slots: {
      default: () =>
        h('div', [
          h(EbTableColumn, { prop: 'name', label: '名称', ...nameColProps }),
          h(EbTableColumn, { prop: 'value', label: '数值' }),
        ]),
    },
    attachTo: document.body,
  })
}

function setViewport(wrapper, height, scrollTop = 0) {
  const body = wrapper.find('.eb-table__body-wrapper')
  Object.defineProperty(body.element, 'clientHeight', { value: height, configurable: true })
  Object.defineProperty(body.element, 'scrollTop', { value: scrollTop, writable: true, configurable: true })
  return body
}

async function flushTable(wrapper) {
  await new Promise((r) => setTimeout(r, 10))
}

describe('EbTable 虚拟滚动', () => {
  it('非虚拟模式渲染全部行（回归保障）', async () => {
    const wrapper = mountTable({ data: bigRows })
    await flushTable(wrapper)
    expect(wrapper.findAll('tbody tr.eb-table__row').length).toBe(500)
    wrapper.unmount()
  })

  it('虚拟模式：视口 5 行时只渲染窗口行 + 底部占位', async () => {
    const wrapper = mountTable({ data: bigRows, virtual: true, rowHeight: 40, height: 200 })
    await flushTable(wrapper)
    const body = setViewport(wrapper, 200)
    await body.trigger('scroll')
    await flushTable(wrapper)
    const dataRows = wrapper.findAll('tbody tr.eb-table__row').length
    expect(dataRows).toBeLessThan(500)
    expect(dataRows).toBeGreaterThan(0)
    // 顶部无滚动 → 无上占位；底部占位撑起剩余高度
    const spacers = wrapper.findAll('tr.eb-table__virtual-spacer')
    expect(spacers.length).toBe(1)
    wrapper.unmount()
  })

  it('虚拟模式滚动后窗口跟随（上下占位 + 绝对索引）', async () => {
    const wrapper = mountTable({ data: bigRows, virtual: true, rowHeight: 40, height: 200 })
    await flushTable(wrapper)
    const body = setViewport(wrapper, 200, 100 * 40)
    await body.trigger('scroll')
    await flushTable(wrapper)
    const spacers = wrapper.findAll('tr.eb-table__virtual-spacer')
    expect(spacers.length).toBe(2)
    // 上占位 = 100 行 - buffer(5) = 95 行 × 40px
    expect(spacers[0].find('td').attributes('style')).toContain('height: 3800px')
    // 窗口首行是绝对索引 95
    const firstRow = wrapper.find('tbody tr.eb-table__row')
    expect(firstRow.attributes('data-row-index')).toBe('95')
    wrapper.unmount()
  })

  it('虚拟模式窗口行绝对索引连续（stripe/键盘索引不漂移）', async () => {
    const wrapper = mountTable({
      data: bigRows,
      virtual: true,
      rowHeight: 40,
      height: 200,
      stripe: true,
    })
    await flushTable(wrapper)
    const body = setViewport(wrapper, 200, 2000)
    await body.trigger('scroll')
    await flushTable(wrapper)
    const indices = wrapper
      .findAll('tbody tr.eb-table__row')
      .map((r) => Number(r.attributes('data-row-index')))
    expect(indices[0]).toBe(45)
    expect(indices).toEqual(indices.map((v, i) => 45 + i))
    wrapper.unmount()
  })

  it('虚拟模式键盘 ↓ 跨出窗口底：滚动对齐目标行', async () => {
    const wrapper = mountTable({
      data: bigRows,
      virtual: true,
      rowHeight: 40,
      height: 200,
    })
    await flushTable(wrapper)
    const body = setViewport(wrapper, 200, 0)
    await body.trigger('scroll')
    await flushTable(wrapper)
    // 窗口末行获取焦点后按 ↓（目标行在窗外）
    const rows = wrapper.findAll('tbody tr.eb-table__row')
    const last = rows[rows.length - 1]
    await last.trigger('focusin')
    await last.trigger('keydown', { key: 'ArrowDown' })
    await flushTable(wrapper)
    // 焦点行移出窗口顶后，滚动位置应变化（scrollTop 由组件驱动）
    expect(body.element.scrollTop).toBeGreaterThan(0)
    wrapper.unmount()
  })
})

describe('EbTable 行内编辑', () => {
  it('点击文本进入编辑，Enter 提交并 emit cell-change', async () => {
    const data = [{ id: 1, name: '苹果', value: 8 }]
    const onCellChange = vi.fn()
    const wrapper = mountTable({ data, onCellChange }, { editable: true })
    await flushTable(wrapper)
    const text = wrapper.find('.eb-table__editable-text')
    expect(text.exists()).toBe(true)
    await text.trigger('click')
    await flushTable(wrapper)
    const input = wrapper.find('.eb-table__edit-input')
    expect(input.exists()).toBe(true)
    expect(input.element.value).toBe('苹果')
    await input.setValue('橙子')
    await input.trigger('keydown', { key: 'Enter' })
    await flushTable(wrapper)
    expect(data[0].name).toBe('橙子')
    expect(onCellChange).toHaveBeenCalledTimes(1)
    const payload = onCellChange.mock.calls[0][0]
    expect(payload).toMatchObject({ prop: 'name', value: '橙子', oldValue: '苹果', $index: 0 })
    // 提交后回到展示态
    expect(wrapper.find('.eb-table__edit-input').exists()).toBe(false)
    expect(wrapper.find('.eb-table__editable-text').text()).toBe('橙子')
    wrapper.unmount()
  })

  it('Esc 取消编辑不改数据', async () => {
    const data = [{ id: 1, name: '苹果', value: 8 }]
    const onCellChange = vi.fn()
    const wrapper = mountTable({ data, onCellChange }, { editable: true })
    await flushTable(wrapper)
    await wrapper.find('.eb-table__editable-text').trigger('click')
    await flushTable(wrapper)
    const input = wrapper.find('.eb-table__edit-input')
    await input.setValue('改一半')
    await input.trigger('keydown', { key: 'Escape' })
    await flushTable(wrapper)
    expect(data[0].name).toBe('苹果')
    expect(onCellChange).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('值未变化时不发事件', async () => {
    const data = [{ id: 1, name: '苹果', value: 8 }]
    const onCellChange = vi.fn()
    const wrapper = mountTable({ data, onCellChange }, { editable: true })
    await flushTable(wrapper)
    await wrapper.find('.eb-table__editable-text').trigger('click')
    await flushTable(wrapper)
    await wrapper.find('.eb-table__edit-input').trigger('keydown', { key: 'Enter' })
    await flushTable(wrapper)
    expect(onCellChange).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('失焦提交', async () => {
    const data = [{ id: 1, name: '苹果', value: 8 }]
    const onCellChange = vi.fn()
    const wrapper = mountTable({ data, onCellChange }, { editable: true })
    await flushTable(wrapper)
    await wrapper.find('.eb-table__editable-text').trigger('click')
    await flushTable(wrapper)
    const input = wrapper.find('.eb-table__edit-input')
    await input.setValue('梨')
    await input.trigger('blur')
    await flushTable(wrapper)
    expect(data[0].name).toBe('梨')
    expect(onCellChange).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('带 default 插槽的列不进入编辑', async () => {
    const data = [{ id: 1, name: '苹果', value: 8 }]
    const wrapper = mount(EbTable, {
      props: { data },
      slots: {
        default: () =>
          h('div', [
            h(EbTableColumn, { prop: 'name', label: '名称', editable: true }),
            h(
              EbTableColumn,
              { prop: 'value', label: '数值', editable: true },
              { default: ({ row }) => h('b', `#${row.value}`) }
            ),
          ]),
      },
      attachTo: document.body,
    })
    await flushTable(wrapper)
    // 第二列虽有 editable，但有插槽 → 保持插槽渲染
    expect(wrapper.find('b').text()).toBe('#8')
    expect(wrapper.findAll('.eb-table__editable-text').length).toBe(1)
    wrapper.unmount()
  })

  it('editable + formatter：展示走 formatter，编辑回原始值', async () => {
    const data = [{ id: 1, name: '苹果', value: 8 }]
    const wrapper = mount(EbTable, {
      props: { data },
      slots: {
        default: () =>
          h('div', [
            h(EbTableColumn, { prop: 'name', label: '名称' }),
            h(EbTableColumn, {
              prop: 'value',
              label: '数值',
              editable: true,
              formatter: (row) => `${row.value} 元`,
            }),
          ]),
      },
      attachTo: document.body,
    })
    await flushTable(wrapper)
    expect(wrapper.find('.eb-table__editable-text').text()).toBe('8 元')
    await wrapper.find('.eb-table__editable-text').trigger('click')
    await flushTable(wrapper)
    const input = wrapper.find('.eb-table__edit-input')
    expect(input.element.value).toBe('8')
    await input.setValue('12')
    await input.trigger('keydown', { key: 'Enter' })
    await flushTable(wrapper)
    expect(data[0].value).toBe('12')
    wrapper.unmount()
  })
})
