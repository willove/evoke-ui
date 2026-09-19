import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import EbTable from '../src/components/table/index.vue'
import EbTableColumn from '../src/components/table/column.vue'

const rows = [
  { id: 1, name: '苹果', price: 8, type: '水果' },
  { id: 2, name: '香蕉', price: 3, type: '水果' },
  { id: 3, name: 'CPU', price: 999, type: '硬件' },
]

function mountTable(props = {}, slots = {}) {
  return mount(EbTable, {
    props: { data: rows, ...props },
    slots: {
      default: () =>
        h('div', [
          h(EbTableColumn, { prop: 'name', label: '名称' }),
          h(EbTableColumn, { prop: 'price', label: '价格', sortable: true }),
        ]),
      ...slots,
    },
  })
}

async function flushTable(wrapper) {
  await new Promise((r) => setTimeout(r, 10))
}

describe('EbTable 渲染契约', () => {
  it('双 class + 结构 DOM（inner-wrapper/header-wrapper/body-wrapper/cell）', async () => {
    const wrapper = mountTable()
    await flushTable(wrapper)
    expect(wrapper.classes()).toContain('eb-table')
    expect(wrapper.classes()).toContain('eb-table')
    expect(wrapper.find('.eb-table__inner-wrapper').exists()).toBe(true)
    expect(wrapper.find('.eb-table__header-wrapper').exists()).toBe(true)
    expect(wrapper.find('.eb-table__body-wrapper').exists()).toBe(true)
    expect(wrapper.find('table.eb-table__header').exists()).toBe(true)
    expect(wrapper.find('table.eb-table__body').exists()).toBe(true)
    expect(wrapper.find('.eb-table__cell .cell').exists()).toBe(true)
  })

  it('列注册渲染表头 label', async () => {
    const wrapper = mountTable()
    await flushTable(wrapper)
    const ths = wrapper.findAll('th')
    expect(ths.length).toBe(2)
    expect(ths[0].text()).toContain('名称')
    expect(ths[1].text()).toContain('价格')
  })

  it('数据行渲染 prop 字段', async () => {
    const wrapper = mountTable()
    await flushTable(wrapper)
    const trs = wrapper.findAll('tbody .eb-table__row')
    expect(trs.length).toBe(3)
    expect(trs[0].text()).toContain('苹果')
  })

  it('border/stripe 修饰类', async () => {
    const wrapper = mountTable({ border: true, stripe: true })
    await flushTable(wrapper)
    expect(wrapper.classes()).toContain('eb-table--border')
    expect(wrapper.classes()).toContain('eb-table--striped')
  })

  it('空数据显示 empty-block', async () => {
    const wrapper = mountTable({}, {})
    await wrapper.setProps({ data: [] })
    await flushTable(wrapper)
    expect(wrapper.find('.eb-table__empty-block').exists()).toBe(true)
    expect(wrapper.find('.eb-table__empty-text').text()).toBe('暂无数据')
  })
})

describe('EbTable 排序', () => {
  it('点击排序箭头循环 ascending → descending → none + sort-change', async () => {
    const wrapper = mountTable()
    await flushTable(wrapper)
    const sortWrapper = wrapper.findAll('.eb-table__sort-wrapper')[0]
    await sortWrapper.trigger('click')
    expect(wrapper.emitted('sort-change')[0][0]).toMatchObject({ prop: 'price', order: 'ascending' })
    // 升序
    let first = wrapper.find('tbody .eb-table__row .cell')
    expect(first.text()).toContain('香蕉')
    await sortWrapper.trigger('click')
    expect(wrapper.emitted('sort-change')[1][0]).toMatchObject({ order: 'descending' })
    first = wrapper.find('tbody .eb-table__row .cell')
    expect(first.text()).toContain('CPU')
    await sortWrapper.trigger('click')
    expect(wrapper.emitted('sort-change')[2][0]).toMatchObject({ order: null })
  })

  it('实例方法 sort / clearSort', async () => {
    const wrapper = mountTable()
    await flushTable(wrapper)
    wrapper.vm.sort('price', 'descending')
    await flushTable(wrapper)
    expect(wrapper.find('tbody .eb-table__row .cell').text()).toContain('CPU')
    wrapper.vm.clearSort()
    await flushTable(wrapper)
    expect(wrapper.find('tbody .eb-table__row .cell').text()).toContain('苹果')
  })

  it('default-sort 初始排序', async () => {
    const wrapper = mountTable({ defaultSort: { prop: 'price', order: 'descending' } })
    await flushTable(wrapper)
    expect(wrapper.find('tbody .eb-table__row .cell').text()).toContain('CPU')
  })
})

describe('EbTable 多选', () => {
  function mountSelectionTable(props = {}) {
    return mount(EbTable, {
      props: { data: rows, ...props },
      slots: {
        default: () =>
          h('div', [
            h(EbTableColumn, { type: 'selection' }),
            h(EbTableColumn, { prop: 'name', label: '名称' }),
          ]),
      },
    })
  }

  it('selection 列渲染 checkbox + 勾选触发 selection-change', async () => {
    const wrapper = mountSelectionTable()
    await flushTable(wrapper)
    const boxes = wrapper.findAll('tbody .eb-checkbox')
    expect(boxes.length).toBe(3)
    await boxes[0].find('input').trigger('change')
    expect(wrapper.emitted('selection-change')[0][0]).toHaveLength(1)
    expect(wrapper.emitted('selection-change')[0][0][0].name).toBe('苹果')
  })

  it('表头全选 + toggleAllSelection + clearSelection', async () => {
    const wrapper = mountSelectionTable()
    await flushTable(wrapper)
    await wrapper.find('thead .eb-checkbox input').trigger('change')
    expect(wrapper.emitted('selection-change')[0][0]).toHaveLength(3)
    wrapper.vm.clearSelection()
    await flushTable(wrapper)
    const events = wrapper.emitted('selection-change')
    expect(events[events.length - 1][0]).toHaveLength(0)
  })

  it('toggleRowSelection 实例方法', async () => {
    const wrapper = mountSelectionTable()
    await flushTable(wrapper)
    wrapper.vm.toggleRowSelection(rows[1], true)
    await flushTable(wrapper)
    const events = wrapper.emitted('selection-change')
    expect(events[events.length - 1][0]).toHaveLength(1)
  })

  it('selectable 禁用行不可选', async () => {
    const wrapper = mount(EbTable, {
      props: { data: rows },
      slots: {
        default: () =>
          h('div', [
            h(EbTableColumn, {
              type: 'selection',
              selectable: (row) => row.id !== 1,
            }),
            h(EbTableColumn, { prop: 'name', label: '名称' }),
          ]),
      },
    })
    await flushTable(wrapper)
    const firstBox = wrapper.findAll('tbody .eb-checkbox')[0]
    expect(firstBox.classes()).toContain('is-disabled')
  })
})

describe('EbTable 展开行与自定义列', () => {
  it('expand 列点击展开 + expand-change + 展开内容渲染', async () => {
    const wrapper = mount(EbTable, {
      props: { data: rows },
      slots: {
        default: () =>
          h('div', [
            h(EbTableColumn, {
              type: 'expand',
            }, {
              default: ({ row }) => h('div', { class: 'expand-content' }, `详情：${row.name}`),
            }),
            h(EbTableColumn, { prop: 'name', label: '名称' }),
          ]),
      },
    })
    await flushTable(wrapper)
    expect(wrapper.find('.eb-table__expanded-row').exists()).toBe(false)
    await wrapper.find('.eb-table__expand-icon').trigger('click')
    await flushTable(wrapper)
    expect(wrapper.find('.eb-table__expanded-row').exists()).toBe(true)
    expect(wrapper.find('.expand-content').text()).toBe('详情：苹果')
    expect(wrapper.emitted('expand-change')).toBeTruthy()
    await wrapper.find('.eb-table__expand-icon').trigger('click')
    await flushTable(wrapper)
    expect(wrapper.find('.eb-table__expanded-row').exists()).toBe(false)
  })

  it('作用域插槽渲染单元格 + formatter', async () => {
    const wrapper = mount(EbTable, {
      props: { data: rows },
      slots: {
        default: () =>
          h('div', [
            h(EbTableColumn, { prop: 'name', label: '名称' }, {
              default: ({ row }) => h('span', { class: 'custom-cell' }, `★${row.name}`),
            }),
            h(EbTableColumn, {
              prop: 'price',
              label: '价格',
              formatter: (row) => `¥${row.price}`,
            }),
          ]),
      },
    })
    await flushTable(wrapper)
    expect(wrapper.find('.custom-cell').text()).toBe('★苹果')
    expect(wrapper.find('tbody tr').text()).toContain('¥8')
  })

  it('index 列序号', async () => {
    const wrapper = mount(EbTable, {
      props: { data: rows },
      slots: {
        default: () => h('div', [h(EbTableColumn, { type: 'index' }), h(EbTableColumn, { prop: 'name' })]),
      },
    })
    await flushTable(wrapper)
    const firstRowCells = wrapper.findAll('tbody tr')[0].findAll('.cell')
    expect(firstRowCells[0].text()).toBe('1')
  })

  it('show-overflow-tooltip 省略 + title', async () => {
    const wrapper = mount(EbTable, {
      props: { data: rows },
      slots: {
        default: () =>
          h('div', [h(EbTableColumn, { prop: 'name', label: '名称', showOverflowTooltip: true })]),
      },
    })
    await flushTable(wrapper)
    const cell = wrapper.find('tbody .cell')
    expect(cell.classes()).toContain('is-ellipsis')
    expect(cell.attributes('title')).toBe('苹果')
  })
})

describe('EbTable 筛选', () => {
  it('filter-method 过滤 + filter-change', async () => {
    const wrapper = mount(EbTable, {
      props: { data: rows },
      slots: {
        default: () =>
          h('div', [
            h(EbTableColumn, {
              prop: 'type',
              label: '类型',
              columnKey: 'type',
              filters: [
                { text: '水果', value: '水果' },
                { text: '硬件', value: '硬件' },
              ],
              filterMethod: (value, row) => row.type === value,
            }),
            h(EbTableColumn, { prop: 'name', label: '名称' }),
          ]),
      },
    })
    await flushTable(wrapper)
    // 打开筛选面板（Teleport body）
    await wrapper.find('.eb-table__column-filter-trigger').trigger('click')
    await flushTable(wrapper)
    expect(document.querySelector('.eb-table__filter')).toBeTruthy()
    // 点击"硬件"筛选项
    const filterItem = [...document.querySelectorAll('.eb-table__filter-list-item')].find((el) =>
      el.textContent.includes('硬件')
    )
    filterItem.click()
    await flushTable(wrapper)
    // 点击筛选按钮
    const applyBtn = [...document.querySelectorAll('.eb-table__filter-bottom button')].find((b) =>
      b.textContent.includes('筛选')
    )
    applyBtn.click()
    await flushTable(wrapper)
    expect(wrapper.emitted('filter-change')[0][0]).toEqual({ type: ['硬件'] })
    // 过滤后只剩 CPU 行
    expect(wrapper.findAll('tbody .eb-table__row')).toHaveLength(1)
    // clearFilter 实例方法
    wrapper.vm.clearFilter('type')
    await flushTable(wrapper)
    expect(wrapper.findAll('tbody .eb-table__row')).toHaveLength(3)
  })

  it('筛选面板：点击外部与 Esc 关闭，面板内点击不关', async () => {
    const wrapper = mount(EbTable, {
      props: { data: rows },
      slots: {
        default: () =>
          h('div', [
            h(EbTableColumn, {
              prop: 'type',
              label: '类型',
              columnKey: 'type',
              filters: [
                { text: '水果', value: '水果' },
                { text: '硬件', value: '硬件' },
              ],
            }),
            h(EbTableColumn, { prop: 'name', label: '名称' }),
          ]),
      },
    })
    await flushTable(wrapper)
    await wrapper.find('.eb-table__column-filter-trigger').trigger('click')
    await flushTable(wrapper)
    expect(document.querySelector('.eb-table__filter')).toBeTruthy()
    // 面板内点击（勾选筛选项）不关闭
    document.querySelector('.eb-table__filter-list-item').click()
    await flushTable(wrapper)
    expect(document.querySelector('.eb-table__filter')).toBeTruthy()
    // 面板外 pointerdown 关闭
    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await flushTable(wrapper)
    expect(document.querySelector('.eb-table__filter')).toBeNull()

    // Esc 关闭
    await wrapper.find('.eb-table__column-filter-trigger').trigger('click')
    await flushTable(wrapper)
    expect(document.querySelector('.eb-table__filter')).toBeTruthy()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushTable(wrapper)
    expect(document.querySelector('.eb-table__filter')).toBeNull()
    wrapper.unmount()
  })
})

describe('EbTable 行事件与当前行', () => {
  it('row-click / cell-click 事件', async () => {
    const wrapper = mountTable()
    await flushTable(wrapper)
    await wrapper.find('tbody .eb-table__row').trigger('click')
    expect(wrapper.emitted('row-click')).toBeTruthy()
    expect(wrapper.emitted('row-click')[0][0].name).toBe('苹果')
    // cell-click 需点击 td 本身
    await wrapper.find('tbody .eb-table__row td').trigger('click')
    expect(wrapper.emitted('cell-click')).toBeTruthy()
  })

  it('highlight-current-row 高亮 + current-change + setCurrentRow', async () => {
    const wrapper = mountTable({ highlightCurrentRow: true })
    await flushTable(wrapper)
    await wrapper.findAll('tbody .eb-table__row')[1].trigger('click')
    expect(wrapper.emitted('current-change')).toBeTruthy()
    expect(wrapper.findAll('tbody .eb-table__row')[1].classes()).toContain('current-row')
    wrapper.vm.setCurrentRow(null)
    await flushTable(wrapper)
    expect(wrapper.findAll('tbody .eb-table__row')[1].classes()).not.toContain('current-row')
  })

  it('TableInstance 方法齐全', async () => {
    const wrapper = mountTable()
    await flushTable(wrapper)
    for (const m of [
      'sort', 'clearSort', 'toggleRowSelection', 'toggleAllSelection',
      'clearSelection', 'clearFilter', 'doLayout', 'toggleRowExpansion', 'setCurrentRow',
    ]) {
      expect(typeof wrapper.vm[m], `method ${m}`).toBe('function')
    }
  })
})
