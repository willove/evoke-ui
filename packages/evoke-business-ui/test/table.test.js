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
    // 统一载荷 (expandedKeys, row, expanded)；未设 rowKey 时 key 元素为行引用
    const expandEv = wrapper.emitted('expand-change')[0]
    expect(expandEv[0]).toEqual([rows[0]])
    expect(expandEv[1]).toEqual(rows[0])
    expect(expandEv[2]).toBe(true)
    await wrapper.find('.eb-table__expand-icon').trigger('click')
    await flushTable(wrapper)
    expect(wrapper.find('.eb-table__expanded-row').exists()).toBe(false)
    // 收起：keys 清空、expanded 为 false（不再发 Set / boolean 旧形态）
    const collapseEv = wrapper.emitted('expand-change')[1]
    expect(collapseEv[0]).toEqual([])
    expect(collapseEv[1]).toEqual(rows[0])
    expect(collapseEv[2]).toBe(false)
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

describe('EbTable loading 与 rowClassName', () => {
  it('loading 渲染加载遮罩，关闭后移除', async () => {
    const wrapper = mountTable({ loading: true })
    await flushTable(wrapper)
    expect(wrapper.find('.eb-table__loading-mask').exists()).toBe(true)
    await wrapper.setProps({ loading: false })
    await flushTable(wrapper)
    expect(wrapper.find('.eb-table__loading-mask').exists()).toBe(false)
  })

  it('rowClassName 函数与字符串均追加到行类名', async () => {
    const wrapper = mountTable({ rowClassName: (row) => (row.price > 100 ? 'is-expensive' : '') })
    await flushTable(wrapper)
    const trs = wrapper.findAll('tbody .eb-table__row')
    expect(trs[2].classes()).toContain('is-expensive')
    expect(trs[0].classes()).not.toContain('is-expensive')
    const stringWrapper = mountTable({ rowClassName: 'custom-row' })
    await flushTable(stringWrapper)
    expect(stringWrapper.findAll('tbody .eb-table__row')[0].classes()).toContain('custom-row')
  })
})

describe('EbTable 服务端排序', () => {
  it('sortable="custom" 不本地重排，仅发 sort-change 且箭头状态循环', async () => {
    const wrapper = mount(EbTable, {
      props: { data: rows },
      slots: {
        default: () =>
          h('div', [
            h(EbTableColumn, { prop: 'price', label: '价格', sortable: 'custom' }),
            h(EbTableColumn, { prop: 'name', label: '名称' }),
          ]),
      },
    })
    await flushTable(wrapper)
    const sortWrapper = wrapper.find('.eb-table__sort-wrapper')
    await sortWrapper.trigger('click')
    expect(wrapper.emitted('sort-change')[0][0]).toMatchObject({ prop: 'price', order: 'ascending' })
    // 数据顺序保持原样
    let texts = wrapper.findAll('tbody .eb-table__row').map((tr) => tr.text())
    expect(texts).toEqual(['8苹果', '3香蕉', '999CPU'])
    await sortWrapper.trigger('click')
    expect(wrapper.emitted('sort-change')[1][0]).toMatchObject({ order: 'descending' })
    texts = wrapper.findAll('tbody .eb-table__row').map((tr) => tr.text())
    expect(texts).toEqual(['8苹果', '3香蕉', '999CPU'])
    // 实例方法 sort 同样只上报不重排
    wrapper.vm.sort('price', 'ascending')
    await flushTable(wrapper)
    texts = wrapper.findAll('tbody .eb-table__row').map((tr) => tr.text())
    expect(texts).toEqual(['8苹果', '3香蕉', '999CPU'])
  })
})

describe('EbTable 表尾合计', () => {
  it('showSummary 渲染合计行，默认数字列求和、其余列为空', async () => {
    const wrapper = mountTable({ showSummary: true })
    await flushTable(wrapper)
    const footRow = wrapper.find('tfoot .eb-table__footer-row')
    expect(footRow.exists()).toBe(true)
    const cells = footRow.findAll('.cell')
    expect(cells[0].text()).toBe('')
    expect(cells[1].text()).toBe('1010')
  })

  it('summaryMethod 自定义合计（接收数据，按列 prop 返回文本映射）', async () => {
    const wrapper = mountTable({
      showSummary: true,
      summaryMethod: (data) => ({ name: `共 ${data.length} 条`, price: '—' }),
    })
    await flushTable(wrapper)
    const cells = wrapper.find('tfoot .eb-table__footer-row').findAll('.cell')
    expect(cells[0].text()).toBe('共 3 条')
    expect(cells[1].text()).toBe('—')
  })

  it('合计行不参与斑马纹与行选择', async () => {
    const wrapper = mountTable({ showSummary: true, stripe: true })
    await flushTable(wrapper)
    expect(wrapper.find('tfoot .eb-table__footer-row').classes()).not.toContain('eb-table__row')
    expect(wrapper.find('tfoot .eb-table__footer-row').classes()).not.toContain('eb-table__row--striped')
    expect(wrapper.find('tfoot .eb-checkbox').exists()).toBe(false)
  })
})

describe('EbTable scroll-x 横向滚动', () => {
  function mountWideTable(props = {}) {
    return mount(EbTable, {
      props: { data: rows, ...props },
      slots: {
        default: () =>
          h('div', [
            h(EbTableColumn, { prop: 'name', label: '名称', width: 300 }),
            h(EbTableColumn, { prop: 'price', label: '价格', minWidth: 200 }),
            h(EbTableColumn, { prop: 'type', label: '类型' }),
          ]),
      },
    })
  }

  it('scroll-x：表格按声明宽度渲染并允许溢出，列宽声明不被压缩', async () => {
    const wrapper = mountWideTable({ scrollX: 800 })
    await flushTable(wrapper)
    const bodyStyle = wrapper.find('table.eb-table__body').attributes('style')
    expect(bodyStyle).toContain('width: 800px')
    expect(bodyStyle).toContain('min-width: 100%')
    expect(wrapper.find('table.eb-table__header').attributes('style')).toContain('width: 800px')
    // colgroup 保留列宽声明：固定宽列与 minWidth 列均落为固定宽（fixed 布局不解析 col 的 min-width）
    const cols = wrapper.find('table.eb-table__body colgroup').findAll('col')
    expect(cols[0].attributes('style')).toContain('width: 300px')
    expect(cols[1].attributes('style')).toContain('width: 200px')
    wrapper.unmount()
  })

  it('scroll-x：表体横向滚动时表头 scrollLeft 同步', async () => {
    const wrapper = mountWideTable({ scrollX: 800 })
    await flushTable(wrapper)
    const body = wrapper.find('.eb-table__body-wrapper')
    const header = wrapper.find('.eb-table__header-wrapper')
    Object.defineProperty(body.element, 'scrollLeft', { value: 120, configurable: true })
    Object.defineProperty(header.element, 'scrollLeft', { value: 0, writable: true, configurable: true })
    await body.trigger('scroll')
    expect(header.element.scrollLeft).toBe(120)
    wrapper.unmount()
  })

  it('scroll-x 支持 max-content 字符串', async () => {
    const wrapper = mountWideTable({ scrollX: 'max-content' })
    await flushTable(wrapper)
    expect(wrapper.find('table.eb-table__body').attributes('style')).toContain('width: max-content')
    wrapper.unmount()
  })

  it('未传 scroll-x 保持原行为（宽度 100%，minWidth 列不转固定宽）', async () => {
    const wrapper = mountWideTable()
    await flushTable(wrapper)
    expect(wrapper.find('table.eb-table__body').attributes('style')).toContain('width: 100%')
    const cols = wrapper.find('table.eb-table__body colgroup').findAll('col')
    expect(cols[1].attributes('style')).toContain('min-width: 200px')
    expect(cols[1].attributes('style')).toContain('width: auto')
    wrapper.unmount()
  })
})

describe('EbTable 受控选中与单选', () => {
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

  it('v-model:selection 受控：勾选 emit 行数组，外部按 key 回填可回显', async () => {
    const wrapper = mountSelectionTable({ rowKey: 'id', selection: [] })
    await flushTable(wrapper)
    await wrapper.findAll('tbody .eb-checkbox')[0].find('input').trigger('change')
    expect(wrapper.emitted('update:selection')[0][0]).toEqual([rows[0]])
    // 外部按 rowKey 回填（如翻页回显），勾选态跟随受控值
    await wrapper.setProps({ selection: [2] })
    await flushTable(wrapper)
    const boxes = wrapper.findAll('tbody .eb-checkbox')
    expect(boxes[1].classes()).toContain('is-checked')
    expect(boxes[0].classes()).not.toContain('is-checked')
    wrapper.unmount()
  })

  it('selection-type=radio：单选互斥、update:selection 发单 key、表头无全选框', async () => {
    const wrapper = mountSelectionTable({ rowKey: 'id', selectionType: 'radio' })
    await flushTable(wrapper)
    const radios = wrapper.findAll('tbody .eb-radio')
    expect(radios.length).toBe(3)
    expect(wrapper.find('thead .eb-checkbox').exists()).toBe(false)
    await radios[0].find('input').trigger('change')
    expect(wrapper.emitted('update:selection')[0][0]).toBe(1)
    expect(wrapper.emitted('selection-change')[0][0]).toEqual([rows[0]])
    // 互斥：改选另一行后仍只有一个选中
    await radios[2].find('input').trigger('change')
    const sel = wrapper.emitted('selection-change')[1][0]
    expect(sel).toHaveLength(1)
    expect(sel[0].name).toBe('CPU')
    expect(wrapper.emitted('update:selection')[1][0]).toBe(3)
    // 重复点击已选项不再发事件
    const count = wrapper.emitted('update:selection').length
    await radios[2].find('input').trigger('change')
    expect(wrapper.emitted('update:selection').length).toBe(count)
    // 受控 key 回显
    await wrapper.setProps({ selection: 2 })
    await flushTable(wrapper)
    const next = wrapper.findAll('tbody .eb-radio')
    expect(next[1].classes()).toContain('is-checked')
    expect(next[0].classes()).not.toContain('is-checked')
    wrapper.unmount()
  })

  it('非受控兼容：不传 selection 仍内部自持（radio 未设 rowKey 时 update:selection 发行对象）', async () => {
    const wrapper = mountSelectionTable({ selectionType: 'radio' })
    await flushTable(wrapper)
    await wrapper.findAll('tbody .eb-radio')[1].find('input').trigger('change')
    expect(wrapper.emitted('update:selection')[0][0]).toEqual(rows[1])
    expect(wrapper.findAll('tbody .eb-radio')[1].classes()).toContain('is-checked')
    wrapper.unmount()
  })

  it('树形行展开 expand-change 统一载荷（业务行 key 数组）', async () => {
    const treeData = [
      {
        id: 1,
        name: '研发部',
        children: [{ id: 11, name: '前端组', children: [{ id: 111, name: '平台组' }] }],
      },
      { id: 2, name: '市场部' },
    ]
    const wrapper = mount(EbTable, {
      props: { data: treeData, rowKey: 'id' },
      slots: {
        default: () => h('div', [h(EbTableColumn, { prop: 'name', label: '名称' })]),
      },
    })
    await flushTable(wrapper)
    await wrapper.find('.eb-table__expand-icon').trigger('click')
    const expandEv = wrapper.emitted('expand-change')[0]
    expect(expandEv[0]).toEqual([1])
    expect(expandEv[1]).toEqual(treeData[0])
    expect(expandEv[2]).toBe(true)
    // 展开子行后 keys 聚合
    const icons = wrapper.findAll('.eb-table__expand-icon')
    expect(icons.length).toBe(2)
    await icons[1].trigger('click')
    const childEv = wrapper.emitted('expand-change')[1]
    expect(childEv[0]).toEqual([1, 11])
    expect(childEv[1]).toEqual(treeData[0].children[0])
    expect(childEv[2]).toBe(true)
    // 收起根节点：expanded 为 false，根 key 移出（子行展开态仍保留）
    await wrapper.find('.eb-table__expand-icon').trigger('click')
    const collapseEv = wrapper.emitted('expand-change')[2]
    expect(collapseEv[0]).toEqual([11])
    expect(collapseEv[2]).toBe(false)
    wrapper.unmount()
  })
})
