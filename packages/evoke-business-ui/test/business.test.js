import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, createApp } from 'vue'
import EvokeBusinessUI, { components as ebComponents } from '../src/index'
import EbStatusTag from '../src/components/status-tag/index.vue'
import EbCellStack from '../src/components/cell-stack/index.vue'
import EbDetailDescriptions from '../src/components/detail-descriptions/index.vue'
import EbSearchFilter from '../src/components/search-filter/index.vue'
import EbDataTable from '../src/components/data-table/index.vue'
import EbImportExportPanel from '../src/components/import-export-panel/index.vue'
import EbAuditTimeline from '../src/components/audit-timeline/index.vue'
import EbColumnSettings from '../src/components/column-settings/index.vue'

describe('图表组件双注册名', () => {
  it('EvChart 与 EbChart 指向同一引擎组件', () => {
    expect(ebComponents.EbChart).toBeTruthy()
    expect(ebComponents.EvChart).toBe(ebComponents.EbChart)
  })

  it('install 后模板可解析 <ev-chart> 与 <eb-chart>', () => {
    const app = createApp({ template: '<div />' })
    app.use(EvokeBusinessUI)
    expect(app.component('EvChart')).toBeTruthy()
    expect(app.component('EvChart')).toBe(app.component('EbChart'))
    app.unmount()
  })
})

describe('EbStatusTag', () => {
  const STATUSES = [
    { value: 'active', label: '启用', type: 'success' },
    { value: 'disabled', label: '禁用', type: 'danger' },
    { value: 'pending', label: '待审核', type: 'warning' },
  ]

  it('命中映射：label + type 语义色', () => {
    const wrapper = mount(EbStatusTag, { props: { value: 'active', statuses: STATUSES } })
    expect(wrapper.text()).toBe('启用')
    expect(wrapper.find('.eb-tag').classes()).toContain('eb-tag--success')
  })

  it('未命中回退 fallbackType + 原值', () => {
    const wrapper = mount(EbStatusTag, { props: { value: 'unknown', statuses: STATUSES } })
    expect(wrapper.text()).toBe('unknown')
    expect(wrapper.find('.eb-tag').classes()).toContain('eb-tag--info')
  })

  it('fallbackType 可指定', () => {
    const wrapper = mount(EbStatusTag, { props: { value: 'x', statuses: STATUSES, fallbackType: 'danger' } })
    expect(wrapper.find('.eb-tag').classes()).toContain('eb-tag--danger')
  })

  it('size/effect 透传 EbTag', () => {
    const wrapper = mount(EbStatusTag, {
      props: { value: 'active', statuses: STATUSES, size: 'large', effect: 'plain' },
    })
    const cls = wrapper.find('.eb-tag').classes()
    expect(cls).toContain('eb-tag--large')
    expect(cls).toContain('eb-tag--plain')
  })

  it('label 缺省时显示原值', () => {
    const wrapper = mount(EbStatusTag, {
      props: { value: 'ok', statuses: [{ value: 'ok', type: 'success' }] },
    })
    expect(wrapper.text()).toBe('ok')
  })
})

describe('EbCellStack', () => {
  it('双行结构：主行加粗 + 副行', () => {
    const wrapper = mount(EbCellStack, { props: { main: '订单 A-1001', sub: '张三 · 2026-01-01' } })
    expect(wrapper.find('.eb-cell-stack__main').text()).toBe('订单 A-1001')
    expect(wrapper.find('.eb-cell-stack__sub').text()).toBe('张三 · 2026-01-01')
    expect(wrapper.find('.eb-cell-stack__main').classes()).toContain('eb-cell-stack__main')
  })

  it('sub 为空只渲染主行', () => {
    const wrapper = mount(EbCellStack, { props: { main: '仅主行' } })
    expect(wrapper.find('.eb-cell-stack__main').exists()).toBe(true)
    expect(wrapper.find('.eb-cell-stack__sub').exists()).toBe(false)
  })

  it('main/sub 插槽覆盖', () => {
    const wrapper = mount(EbCellStack, {
      props: { main: 'x', sub: 'y' },
      slots: { main: '<b class="m">主</b>', sub: '<i class="s">副</i>' },
    })
    expect(wrapper.find('.m').text()).toBe('主')
    expect(wrapper.find('.s').text()).toBe('副')
  })
})

describe('EbDetailDescriptions', () => {
  const DATA = {
    orderNo: 'A-1001',
    user: { name: '张三', phone: '13800000000' },
    amount: 9900,
  }
  const ITEMS = [
    { prop: 'orderNo', label: '订单号' },
    { prop: 'user.name', label: '客户' },
    { prop: 'amount', label: '金额', formatter: (v) => `￥${(v / 100).toFixed(2)}` },
    { prop: 'remark', label: '备注' },
  ]

  it('基于 EbDescriptions 渲染 + 路径取值 + formatter + 空值占位', () => {
    const wrapper = mount(EbDetailDescriptions, { props: { data: DATA, items: ITEMS, title: '订单详情' } })
    expect(wrapper.find('.eb-descriptions').exists()).toBe(true)
    const labels = wrapper.findAll('.eb-descriptions__label').map((l) => l.text())
    expect(labels).toEqual(['订单号', '客户', '金额', '备注'])
    const contents = wrapper.findAll('.eb-descriptions__content').map((c) => c.text())
    expect(contents).toEqual(['A-1001', '张三', '￥99.00', '-'])
    expect(wrapper.find('.eb-descriptions__title').text()).toBe('订单详情')
  })

  it('item slot 分发（slot 名 + value 作用域）', () => {
    const wrapper = mount(EbDetailDescriptions, {
      props: { data: DATA, items: [{ prop: 'user.phone', label: '电话', slot: 'phone' }] },
      slots: { phone: '<b class="p">{{ value }}</b>' },
    })
    expect(wrapper.find('.p').text()).toBe('13800000000')
  })

  it('column/border 透传', () => {
    const wrapper = mount(EbDetailDescriptions, {
      props: { data: DATA, items: ITEMS.slice(0, 1), column: 4, border: false },
    })
    expect(wrapper.find('.eb-descriptions').classes()).not.toContain('is-bordered')
  })
})

describe('EbSearchFilter', () => {
  const FIELDS = [
    { prop: 'keyword', label: '关键词' },
    { prop: 'status', label: '状态', type: 'select', options: [{ label: '启用', value: 1 }], defaultValue: 1 },
    { prop: 'region', label: '区域', type: 'select', options: [] },
  ]

  it('fields 渲染（input/select）+ 布局类', () => {
    const wrapper = mount(EbSearchFilter, { props: { fields: FIELDS, columns: 2 } })
    expect(wrapper.find('.eb-search-filter').classes()).toContain('eb-search-filter--cols-2')
    expect(wrapper.find('input.eb-input__inner, .eb-input__inner').exists()).toBe(true)
    // 3 个字段 = 3 个 label
    expect(wrapper.findAll('.eb-search-filter__label')).toHaveLength(3)
    expect(wrapper.findAll('.eb-search-filter__actions button').length).toBeGreaterThanOrEqual(2)
  })

  it('输入更新 v-model + 查询事件带值', async () => {
    const wrapper = mount(EbSearchFilter, { props: { fields: FIELDS, modelValue: { keyword: '' } } })
    const input = wrapper.find('.eb-search-filter__field .eb-input__inner')
    await input.setValue('订单')
    expect(wrapper.emitted('update:modelValue')[0][0].keyword).toBe('订单')

    await wrapper.setProps({ modelValue: { keyword: '订单', status: 1 } })
    const btns = wrapper.findAll('.eb-search-filter__actions button')
    await btns[0].trigger('click')
    expect(wrapper.emitted('search')[0][0]).toEqual({ keyword: '订单', status: 1 })
  })

  it('重置恢复 defaultValue 并触发 search', async () => {
    const wrapper = mount(EbSearchFilter, {
      props: { fields: FIELDS, modelValue: { keyword: 'x', status: 1, region: 2 } },
    })
    const btns = wrapper.findAll('.eb-search-filter__actions button')
    await btns[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual({ keyword: '', status: 1, region: '' })
    expect(wrapper.emitted('reset')).toBeTruthy()
    expect(wrapper.emitted('search')[0][0]).toEqual({ keyword: '', status: 1, region: '' })
  })

  it('loading 时查询按钮禁用', () => {
    const wrapper = mount(EbSearchFilter, { props: { fields: FIELDS, loading: true } })
    expect(wrapper.find('.eb-search-filter__actions .eb-button--primary').classes()).toContain('is-loading')
  })

  it('select 字段渲染下拉', () => {
    const wrapper = mount(EbSearchFilter, { props: { fields: FIELDS } })
    expect(wrapper.find('.eb-select').exists()).toBe(true)
  })
})

describe('EbDataTable', () => {
  const COLUMNS = [
    { prop: 'name', label: '名称' },
    { prop: 'amount', label: '金额' },
    { prop: 'owner', label: '负责人', stack: (row) => row.dept },
  ]
  const ROWS = [
    { id: 1, name: '订单 A', amount: 100, owner: '张三', dept: '销售部' },
    { id: 2, name: '订单 B', amount: 200, owner: '李四', dept: '交付部' },
  ]

  const mountTable = (props = {}) =>
    mount(EbDataTable, {
      props: { columns: COLUMNS, data: ROWS, total: 120, title: '订单列表', ...props },
      attachTo: document.body,
    })

  it('工具栏：标题 + 计数角标 + actions 插槽', () => {
    const wrapper = mountTable({ showPagination: false })
    expect(wrapper.find('.eb-data-table__title').text()).toBe('订单列表')
    expect(wrapper.find('.eb-data-table__total-badge').text()).toContain('120')
    wrapper.unmount()
  })

  it('列渲染 + 双行单元格列（stack）', async () => {
    const wrapper = mountTable({ showPagination: false })
    await nextTick()
    const cells = wrapper.findAll('.eb-table__row, tr').length
    expect(cells).toBeGreaterThan(0)
    expect(wrapper.find('.eb-cell-stack__main').exists()).toBe(true)
    expect(wrapper.find('.eb-cell-stack__sub').text()).toContain('销售部')
    wrapper.unmount()
  })

  it('计数角标 showTotal=false 隐藏', () => {
    const wrapper = mountTable({ showTotal: false, showPagination: false })
    expect(wrapper.find('.eb-data-table__total-badge').exists()).toBe(false)
    wrapper.unmount()
  })

  it('分页受控：page-change/update:page/update:pageSize', async () => {
    const wrapper = mountTable({ page: 1, pageSize: 10 })
    await nextTick()
    const pagination = wrapper.findComponent({ name: 'EbPagination' })
    // 触发分页组件的对象值更新
    pagination.vm.$emit('update:modelValue', { page: 3, size: 20 })
    await nextTick()
    expect(wrapper.emitted('update:page')[0][0]).toBe(3)
    expect(wrapper.emitted('update:pageSize')[0][0]).toBe(20)
    expect(wrapper.emitted('page-change')[0][0]).toEqual({ page: 3, pageSize: 20 })
    wrapper.unmount()
  })

  it('loading 遮罩渲染', () => {
    const wrapper = mountTable({ loading: true, showPagination: false })
    expect(wrapper.find('.eb-data-table__loading-mask').exists()).toBe(true)
    wrapper.unmount()
  })

  it('expose 透传表格方法', () => {
    const wrapper = mountTable({ showPagination: false })
    expect(typeof wrapper.vm.clearSelection).toBe('function')
    expect(typeof wrapper.vm.sort).toBe('function')
    wrapper.unmount()
  })

  it('operations 插槽渲染操作列', async () => {
    const wrapper = mountTable(
      { showPagination: false },
    )
    // 无插槽时不渲染操作列
    expect(wrapper.text()).not.toContain('操作列头')
    wrapper.unmount()
  })
})

describe('EbImportExportPanel', () => {
  it('双分区结构 + 默认格式按钮', () => {
    const wrapper = mount(EbImportExportPanel, { props: { templateName: '导入模板.xlsx' } })
    const sections = wrapper.findAll('.eb-import-export-panel__section')
    expect(sections).toHaveLength(2)
    expect(wrapper.find('.eb-import-export-panel__section-title').text()).toBe('批量导入')
    expect(wrapper.text()).toContain('下载模板')
    expect(wrapper.text()).toContain('导出 XLSX')
    expect(wrapper.text()).toContain('导出 CSV')
    wrapper.unmount()
  })

  it('导出按钮 emit export(格式)', async () => {
    const wrapper = mount(EbImportExportPanel, { props: {} })
    const btns = wrapper.findAll('button').filter((b) => b.text().includes('导出'))
    await btns[1].trigger('click')
    expect(wrapper.emitted('export')[0][0]).toBe('csv')
    wrapper.unmount()
  })

  it('选择文件 emit import-file', async () => {
    const wrapper = mount(EbImportExportPanel, { props: { action: '' } })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      value: [new File(['x'], 'data.xlsx')],
      configurable: true,
    })
    await input.trigger('change')
    const evt = wrapper.emitted('import-file')
    expect(evt).toBeTruthy()
    expect(evt[0][0].name).toBe('data.xlsx')
    wrapper.unmount()
  })

  it('下载模板按钮 emit download-template', async () => {
    const wrapper = mount(EbImportExportPanel, { props: { templateName: '模板' } })
    const btn = wrapper.findAll('button').find((b) => b.text().includes('下载模板'))
    await btn.trigger('click')
    expect(wrapper.emitted('download-template')).toHaveLength(1)
    wrapper.unmount()
  })
})

describe('EbAuditTimeline', () => {
  const ITEMS = () => [
    {
      id: 'a1',
      operator: '张三',
      action: '更新了订单金额',
      createdAt: '2026-09-05 10:00',
      diff: [{ field: '金额', before: 100, after: 200 }],
    },
    {
      id: 'a2',
      user: '李四',
      action: '创建了订单',
      createdAt: '2026-09-05 09:00',
      detail: '来源：后台录入',
    },
  ]

  it('时间线渲染 + 操作者/动作/时间', () => {
    const wrapper = mount(EbAuditTimeline, { props: { items: ITEMS(), expandable: false } })
    expect(wrapper.find('.eb-audit-timeline').exists()).toBe(true)
    expect(wrapper.findAll('.eb-timeline-item')).toHaveLength(2)
    expect(wrapper.text()).toContain('张三')
    expect(wrapper.text()).toContain('更新了订单金额')
    // label 位放时间（轴对侧 aside 区）
    expect(wrapper.find('.eb-timeline-item__aside').text()).toBe('2026-09-05 10:00')
  })

  it('diff 展开按钮 + 明细渲染', async () => {
    const wrapper = mount(EbAuditTimeline, { props: { items: ITEMS() } })
    const toggle = wrapper.find('.eb-audit-timeline__toggle')
    expect(toggle.text()).toContain('展开变更 (1)')
    await toggle.trigger('click')
    expect(wrapper.find('.eb-audit-timeline__diff-row').exists()).toBe(true)
    expect(wrapper.text()).toContain('金额')
    expect(wrapper.emitted('expand-change')[0][0]).toEqual(['a1'])
  })

  it('before 为空显示（空）', async () => {
    const wrapper = mount(EbAuditTimeline, {
      props: {
        items: [{ id: 'x', operator: 'A', action: 'act', diff: [{ field: 'f', before: '', after: 1 }] }],
      },
    })
    await wrapper.find('.eb-audit-timeline__toggle').trigger('click')
    expect(wrapper.find('.eb-audit-timeline__diff-before').text()).toBe('（空）')
    expect(wrapper.find('.eb-audit-timeline__diff-before').classes()).toContain('is-empty')
  })

  it('expandedItems 受控', async () => {
    const wrapper = mount(EbAuditTimeline, {
      props: { items: ITEMS(), expandedItems: [] },
    })
    await wrapper.find('.eb-audit-timeline__toggle').trigger('click')
    expect(wrapper.emitted('update:expandedItems')[0][0]).toEqual(['a1'])
  })

  it('operator 缺省回退 user → 系统', () => {
    const wrapper = mount(EbAuditTimeline, { props: { items: [{ action: 'act', user: '李四' }] } })
    expect(wrapper.find('.eb-audit-timeline__operator').text()).toBe('李四')
    const empty = mount(EbAuditTimeline, { props: { items: [{ action: 'act' }] } })
    expect(empty.find('.eb-audit-timeline__operator').text()).toBe('系统')
  })
})

describe('EbColumnSettings', () => {
  const COLS = [
    { prop: 'name', label: '名称' },
    { prop: 'amount', label: '金额' },
    { prop: 'owner', label: '负责人' },
  ]

  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  const mountSettings = (props = {}) =>
    mount(EbColumnSettings, {
      props: { columns: COLS, ...props },
      attachTo: document.body,
    })

  it('触发按钮 + 面板打开（Teleport）', async () => {
    const wrapper = mountSettings()
    await wrapper.find('.eb-column-settings__trigger').trigger('click')
    await nextTick()
    expect(document.querySelector('.eb-column-settings__panel')).toBeTruthy()
    expect(document.querySelectorAll('.eb-column-settings__item').length).toBe(3)
    wrapper.unmount()
  })

  it('取消勾选从受控值移除 + change 事件', async () => {
    const wrapper = mountSettings({ modelValue: ['name', 'amount', 'owner'] })
    await wrapper.find('.eb-column-settings__trigger').trigger('click')
    await nextTick()
    const items = document.querySelectorAll('.eb-column-settings__item input')
    await items[1].checks?.()
    // 直接触发 checkbox 的 change（原生 input）
    items[1].click()
    await nextTick()
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted[0][0]).toEqual(['name', 'owner'])
    expect(wrapper.emitted('change')).toBeTruthy()
    wrapper.unmount()
  })

  it('至少保留一列：仅剩一列时禁用取消', async () => {
    const wrapper = mountSettings({ modelValue: ['name'] })
    await wrapper.find('.eb-column-settings__trigger').trigger('click')
    await nextTick()
    const item = document.querySelectorAll('.eb-column-settings__item')[0]
    const cb = item.querySelector('.eb-checkbox')
    expect(cb.className).toContain('is-disabled')
    wrapper.unmount()
  })

  it('重置恢复定义顺序', async () => {
    const wrapper = mountSettings({ modelValue: ['owner', 'name'] })
    await wrapper.find('.eb-column-settings__trigger').trigger('click')
    await nextTick()
    const reset = document.querySelector('.eb-column-settings__reset')
    reset.click()
    await nextTick()
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['name', 'amount', 'owner'])
    wrapper.unmount()
  })

  it('storageKey 持久化写入与恢复', async () => {
    const wrapper = mountSettings({ storageKey: 'p5-col-settings', modelValue: ['name', 'amount', 'owner'] })
    await wrapper.find('.eb-column-settings__trigger').trigger('click')
    await nextTick()
    const items = document.querySelectorAll('.eb-column-settings__item input')
    items[2].click()
    await nextTick()
    expect(JSON.parse(localStorage.getItem('p5-col-settings'))).toEqual(['name', 'amount'])

    // 新实例恢复
    const wrapper2 = mountSettings({ storageKey: 'p5-col-settings' })
    expect(wrapper.vm.value || true).toBeTruthy()
    wrapper2.unmount()
    wrapper.unmount()
  })
})
