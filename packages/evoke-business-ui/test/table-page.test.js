import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { h } from 'vue'
import EbTablePage from '../src/components/table-page/index.vue'
import EbDataTable from '../src/components/data-table/index.vue'
import EbSearchFilter from '../src/components/search-filter/index.vue'

const rows = [
  { id: 1, name: '苹果', age: 8 },
  { id: 2, name: '香蕉', age: 3 },
]

function makeRequest(list = rows, total = 30) {
  return vi.fn(async () => ({ list, total }))
}

const baseColumns = [
  { prop: 'name', label: '名称' },
  { prop: 'age', label: '年龄', sortable: true },
]

function mountPage(props = {}) {
  const { slots, ...rest } = props
  const request = rest.request || makeRequest()
  const wrapper = mount(EbTablePage, {
    props: { request, columns: baseColumns, ...rest },
    slots,
  })
  return { wrapper, request }
}

describe('EbTablePage — 数据代理', () => {
  it('挂载即首查，行与总数渲染', async () => {
    const { wrapper, request } = mountPage()
    await flushPromises()
    expect(request).toHaveBeenCalledTimes(1)
    expect(request.mock.calls[0][0]).toMatchObject({ page: 1, pageSize: 10 })
    expect(wrapper.findAll('tbody .eb-table__row').length).toBe(2)
    expect(wrapper.text()).toContain('30')
  })

  it('翻页 → 以新分页参数重查', async () => {
    const { wrapper, request } = mountPage()
    await flushPromises()
    wrapper.findComponent(EbDataTable).vm.$emit('page-change', { page: 3, pageSize: 10 })
    await flushPromises()
    expect(wrapper.emitted('page-change')).toBeTruthy()
    expect(request.mock.calls.at(-1)[0]).toMatchObject({ page: 3, pageSize: 10 })
  })

  it('改页容量 → 换容量并回第 1 页（useTable 既有语义）', async () => {
    const { wrapper, request } = mountPage()
    await flushPromises()
    wrapper.findComponent(EbDataTable).vm.$emit('page-change', { page: 3, pageSize: 50 })
    await flushPromises()
    expect(request.mock.calls.at(-1)[0]).toMatchObject({ page: 1, pageSize: 50 })
  })

  it('expose.search 合并筛选并回第 1 页；reset 恢复默认参数', async () => {
    const { wrapper, request } = mountPage({ defaultParams: { status: 1 } })
    await flushPromises()
    wrapper.findComponent(EbDataTable).vm.$emit('page-change', { page: 4, pageSize: 10 })
    await flushPromises()
    wrapper.vm.search({ keyword: 'x' })
    await flushPromises()
    expect(request.mock.calls.at(-1)[0]).toMatchObject({ page: 1, status: 1, keyword: 'x' })
    wrapper.vm.reset()
    await flushPromises()
    const last = request.mock.calls.at(-1)[0]
    expect(last).toMatchObject({ page: 1, status: 1 })
    expect(last.keyword).toBeUndefined()
  })

  it('翻页后 sort-change 以当前页重查并写入排序参数', async () => {
    const { wrapper, request } = mountPage()
    await flushPromises()
    wrapper.findComponent(EbDataTable).vm.$emit('page-change', { page: 2, pageSize: 10 })
    await flushPromises()
    wrapper.findComponent(EbDataTable).vm.$emit('sort-change', { prop: 'age', order: 'ascending', column: {} })
    await flushPromises()
    expect(request.mock.calls.at(-1)[0]).toMatchObject({ page: 2, sortProp: 'age', sortOrder: 'asc' })
    wrapper.findComponent(EbDataTable).vm.$emit('sort-change', { prop: 'age', order: null, column: {} })
    await flushPromises()
    expect(request.mock.calls.at(-1)[0].sortProp).toBe('')
    expect(request.mock.calls.at(-1)[0].sortOrder).toBe('')
  })

  it('remoteSort 关闭时不写排序参数', async () => {
    const { wrapper, request } = mountPage({ remoteSort: false })
    await flushPromises()
    wrapper.findComponent(EbDataTable).vm.$emit('sort-change', { prop: 'age', order: 'descending', column: {} })
    await flushPromises()
    expect(request.mock.calls.at(-1)[0].sortProp).toBeUndefined()
    expect(wrapper.emitted('sort-change')).toBeTruthy()
  })

  it('remoteFilter 开启时 filter-change 写入筛选并回第 1 页', async () => {
    const { wrapper, request } = mountPage({ remoteFilter: true })
    await flushPromises()
    wrapper.findComponent(EbDataTable).vm.$emit('page-change', { page: 2, pageSize: 10 })
    await flushPromises()
    wrapper.findComponent(EbDataTable).vm.$emit('filter-change', { age: [3] })
    await flushPromises()
    expect(request.mock.calls.at(-1)[0]).toMatchObject({ page: 1, filters: { age: [3] } })
  })

  it('pagination 关闭：不渲染分页，请求不带分页参数', async () => {
    const { wrapper, request } = mountPage({ pagination: false })
    await flushPromises()
    expect(wrapper.findComponent(EbDataTable).props('showPagination')).toBe(false)
    expect(request.mock.calls[0][0].page).toBeUndefined()
  })

  it('数组返回形态（无 total 包装）可用', async () => {
    const { wrapper, request } = mountPage({ request: vi.fn(async () => rows) })
    await flushPromises()
    expect(request).toHaveBeenCalledTimes(1)
    expect(wrapper.findAll('tbody .eb-table__row').length).toBe(2)
  })
})

describe('EbTablePage — 查询区与四区结构', () => {
  it('fields 内建 EbSearchFilter；reset→自带 search 抑制为单次请求', async () => {
    const { wrapper, request } = mountPage({
      fields: [{ prop: 'name', label: '名称' }],
    })
    await flushPromises()
    const sf = wrapper.findComponent(EbSearchFilter)
    expect(sf.exists()).toBe(true)

    sf.vm.$emit('search', { name: '果' })
    await flushPromises()
    expect(request.mock.calls.at(-1)[0]).toMatchObject({ name: '果' })

    const before = request.mock.calls.length
    sf.vm.$emit('reset', { name: '' })
    sf.vm.$emit('search', { name: '' }) // searchOnReset 的自带合并
    await flushPromises()
    expect(request.mock.calls.length).toBe(before + 1)
    expect(request.mock.calls.at(-1)[0]).toMatchObject({ page: 1 })
  })

  it('search 插槽拿到 params/search/reset 上下文', async () => {
    const { wrapper, request } = mountPage({
      slots: {
        search: ({ search }) => h('button', { class: 't-go', onClick: () => search({ keyword: 'y' }) }, '查'),
      },
    })
    await flushPromises()
    expect(wrapper.find('.t-go').exists()).toBe(true)
    wrapper.find('.t-go').trigger('click')
    await flushPromises()
    expect(request.mock.calls.at(-1)[0]).toMatchObject({ keyword: 'y' })
  })

  it('页头区按 props/插槽渲染，toolbar 插槽拿到 selection 上下文', async () => {
    const { wrapper } = mountPage({
      title: '订单列表',
      description: '全部订单',
      slots: {
        toolbar: ({ selectionCount }) => h('span', { class: 't-sel' }, String(selectionCount)),
      },
    })
    await flushPromises()
    expect(wrapper.find('.eb-table-page__title').text()).toBe('订单列表')
    expect(wrapper.find('.eb-table-page__description').text()).toBe('全部订单')
    wrapper.findComponent(EbDataTable).vm.$emit('selection-change', [rows[0]])
    await flushPromises()
    expect(wrapper.find('.t-sel').text()).toBe('1')
    expect(wrapper.emitted('selection-change')).toBeTruthy()
  })

  it('fit 默认开：is-fit 类落在页面与表格区；jsdom 无 RO 时不报错', async () => {
    const { wrapper } = mountPage()
    await flushPromises()
    expect(wrapper.classes()).toContain('is-fit')
    const dt = wrapper.findComponent(EbDataTable)
    expect(dt.classes()).toContain('is-fit')
    expect(dt.props('fit')).toBe(true)
    // 环境无 ResizeObserver：EbTable height 保持 undefined，不崩溃
    expect(wrapper.find('.eb-table').exists()).toBe(true)
  })

  it('selection-change 透传与 expose.clearSelection', async () => {
    const { wrapper } = mountPage({ selectable: true })
    await flushPromises()
    wrapper.findComponent(EbDataTable).vm.$emit('selection-change', [rows[0]])
    wrapper.vm.clearSelection()
    await flushPromises()
    expect(wrapper.vm.selection).toEqual([])
  })
})
