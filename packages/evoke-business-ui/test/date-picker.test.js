import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import EbDatePicker from '../src/components/date-picker/index.vue'
import { dayjs } from '../src/components/date-picker/utils'

const Harness = defineComponent({
  name: 'DatePickerHarness',
  components: { EbDatePicker },
  inheritAttrs: false,
  props: { modelValue: { type: null, default: null } },
  setup(props, { attrs }) {
    const value = ref(props.modelValue)
    return () => h(EbDatePicker, {
      ...attrs,
      modelValue: value.value,
      'onUpdate:modelValue': (v) => {
        value.value = v
      },
    })
  },
})

function mountPicker(props = {}) {
  const wrapper = mount(Harness, { props, attachTo: document.body })
  return { wrapper, picker: () => wrapper.findComponent(EbDatePicker) }
}

function flush(ms = 30) {
  return new Promise((r) => setTimeout(r, ms))
}

async function openPanel(wrapper) {
  await wrapper.find('.eb-input__wrapper').trigger('click')
  await flush()
}

/** 当前月内某天的单元格（跨两个面板时取左表） */
function dayCell(dayNum, tableIndex = 0) {
  const tables = document.querySelectorAll('.eb-date-table')
  const tds = [...tables[tableIndex].querySelectorAll('td')]
  return tds.find((td) =>
    td.textContent.trim() === String(dayNum)
    && !td.classList.contains('prev-month')
    && !td.classList.contains('next-month')
  )
}

function monthCell(monthIdx) {
  const tds = [...document.querySelectorAll('.eb-month-table td')]
  return tds[monthIdx]
}

function yearCellInDecade(year) {
  const tds = [...document.querySelectorAll('.eb-year-table td')]
  return tds.find((td) => td.textContent.trim() === String(year))
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('EbDatePicker 渲染契约', () => {
  it('单值编辑器双 class + eb-input 同构 DOM', () => {
    const { wrapper } = mountPicker()
    expect(wrapper.classes()).toContain('eb-date-editor')
    expect(wrapper.classes()).toContain('eb-date-editor')
    expect(wrapper.find('.eb-input__wrapper').exists()).toBe(true)
    expect(wrapper.find('.eb-input__inner').exists()).toBe(true)
    expect(wrapper.find('.eb-input__prefix').exists()).toBe(true)
    expect(wrapper.find('.eb-input__inner').attributes('placeholder')).toBe('选择日期')
  })

  it('区间编辑器：双输入 + 分隔符 + 独立 placeholder', () => {
    const { wrapper } = mountPicker({ type: 'daterange' })
    const inputs = wrapper.findAll('.eb-range-input')
    expect(inputs.length).toBe(2)
    expect(wrapper.find('.eb-range-separator').text()).toBe('-')
    expect(inputs[0].attributes('placeholder')).toBe('开始日期')
    expect(inputs[1].attributes('placeholder')).toBe('结束日期')
    expect(wrapper.classes()).toContain('eb-date-editor--daterange')
  })

  it('datetime placeholder 组合', () => {
    const { wrapper } = mountPicker({ type: 'datetime' })
    expect(wrapper.find('.eb-input__inner').attributes('placeholder')).toContain('选择日期')
  })
})

describe('EbDatePicker 面板与选择（date）', () => {
  it('打开面板：eb-picker__popper + eb-date-picker + 6×7 网格', async () => {
    const { wrapper } = mountPicker()
    await openPanel(wrapper)
    expect(document.querySelector('.eb-picker__popper')).toBeTruthy()
    expect(document.querySelector('.eb-picker-panel.eb-date-picker')).toBeTruthy()
    expect(document.querySelectorAll('.eb-date-table td').length).toBe(42)
    expect(document.querySelectorAll('.eb-date-table th').length).toBe(7)
  })

  it('点击日期：update/change 传 Date（当天零点）并关闭', async () => {
    const { wrapper, picker } = mountPicker()
    await openPanel(wrapper)
    const today = dayjs()
    dayCell(today.date()).click()
    await flush()
    const emitted = picker().emitted('update:modelValue')[0][0]
    expect(emitted instanceof Date).toBe(true)
    expect(dayjs(emitted).format('YYYY-MM-DD')).toBe(today.format('YYYY-MM-DD'))
    expect(picker().emitted('change')).toBeTruthy()
    expect(document.querySelector('.eb-picker__popper')).toBeNull()
  })

  it('value-format 输出字符串', async () => {
    const { wrapper, picker } = mountPicker({ valueFormat: 'YYYY-MM-DD' })
    await openPanel(wrapper)
    const today = dayjs()
    dayCell(today.date()).click()
    await flush()
    expect(picker().emitted('update:modelValue')[0][0]).toBe(today.format('YYYY-MM-DD'))
  })

  it('初始 Date 值回显 + 表格 current 高亮', async () => {
    const d = dayjs().subtract(1, 'month').date(15).toDate()
    const { wrapper } = mountPicker({ modelValue: d })
    expect(wrapper.find('.eb-input__inner').element.value).toBe(
      dayjs(d).format('YYYY-MM-DD')
    )
    await openPanel(wrapper)
    const current = document.querySelector('.eb-date-table td.current')
    expect(current?.textContent.trim()).toBe('15')
  })

  it('手动输入合法日期解析，非法回滚', async () => {
    const { wrapper, picker } = mountPicker()
    const input = wrapper.find('.eb-input__inner')
    // setValue 自带 input+change 触发
    await input.setValue('2026-01-15')
    await flush()
    expect(dayjs(picker().emitted('update:modelValue')[0][0]).format('YYYY-MM-DD')).toBe('2026-01-15')
    // 非法输入 → 回滚且不提交
    await input.setValue('not-a-date')
    await flush()
    const emits = picker().emitted('update:modelValue')
    expect(emits.length).toBe(1)
    expect(input.element.value).toBe('2026-01-15')
  })

  it('disabled-date 禁用不可选', async () => {
    const { wrapper, picker } = mountPicker({
      disabledDate: (d) => dayjs(d).date() > 20,
    })
    await openPanel(wrapper)
    const today = dayjs()
    if (today.date() > 20) {
      // 当天被禁用 → 点击无效
      dayCell(today.date()).click()
      await flush()
      expect(picker().emitted('update:modelValue')).toBeUndefined()
      expect(document.querySelector('.eb-picker__popper')).toBeTruthy()
    } else {
      dayCell(25).click()
      await flush()
      expect(picker().emitted('update:modelValue')).toBeUndefined()
    }
  })

  it('shortcuts 快捷选项应用并关闭', async () => {
    const yesterday = dayjs().subtract(1, 'day').toDate()
    const { wrapper, picker } = mountPicker({
      shortcuts: [{ text: '昨天', value: yesterday }],
    })
    await openPanel(wrapper)
    expect(document.querySelector('.eb-picker-panel__sidebar')).toBeTruthy()
    document.querySelector('.eb-picker-panel__shortcut').click()
    await flush()
    const emitted = picker().emitted('update:modelValue')[0][0]
    expect(dayjs(emitted).format('YYYY-MM-DD')).toBe(dayjs(yesterday).format('YYYY-MM-DD'))
    expect(document.querySelector('.eb-picker__popper')).toBeNull()
  })

  it('clearable 清空', async () => {
    const { wrapper, picker } = mountPicker({ modelValue: new Date() })
    await wrapper.find('.eb-range__close-icon').trigger('click')
    await flush()
    expect(picker().emitted('update:modelValue')[0][0]).toBeNull()
    expect(picker().emitted('clear')).toBeTruthy()
  })

  it('视图切换：月份视图选月回到日期视图', async () => {
    const { wrapper } = mountPicker()
    await openPanel(wrapper)
    // 月份标签（第二个）→ 月份视图
    document.querySelectorAll('.eb-date-picker__header-label')[1].click()
    await flush()
    expect(document.querySelectorAll('.eb-month-table td').length).toBe(12)
    monthCell(0).click() // 1 月
    await flush()
    expect(document.querySelector('.eb-date-table')).toBeTruthy()
    const label = document.querySelector('.eb-date-picker__header-label').textContent
    expect(label).toContain('2026')
  })

  it('年份视图：十年网格 + 点击年份进入月份视图', async () => {
    const { wrapper } = mountPicker()
    await openPanel(wrapper)
    const labels = document.querySelectorAll('.eb-date-picker__header-label')
    labels[0].click() // 年份标签 → 年视图
    await flush()
    const tds = document.querySelectorAll('.eb-year-table td')
    expect(tds.length).toBe(12)
    expect(document.querySelector('.eb-year-table td.prev-decade')).toBeTruthy()
    expect(document.querySelector('.eb-year-table td.next-decade')).toBeTruthy()
    yearCellInDecade(2026).click()
    await flush()
    expect(document.querySelector('.eb-month-table')).toBeTruthy()
  })
})

describe('EbDatePicker month/year 类型', () => {
  it('month：直接月份网格，点选输出月初', async () => {
    const { wrapper, picker } = mountPicker({ type: 'month' })
    await openPanel(wrapper)
    expect(document.querySelector('.eb-month-table')).toBeTruthy()
    monthCell(2).click() // 3 月
    await flush()
    const emitted = picker().emitted('update:modelValue')[0][0]
    expect(dayjs(emitted).format('YYYY-MM')).toBe(`${dayjs().year()}-03`)
    expect(document.querySelector('.eb-picker__popper')).toBeNull()
  })

  it('year：十年网格，点选输出年初', async () => {
    const { wrapper, picker } = mountPicker({ type: 'year' })
    await openPanel(wrapper)
    expect(document.querySelector('.eb-year-table')).toBeTruthy()
    yearCellInDecade(2025).click()
    await flush()
    expect(dayjs(picker().emitted('update:modelValue')[0][0]).format('YYYY')).toBe('2025')
  })
})

describe('EbDatePicker datetime（单值）', () => {
  it('选日期不关闭，confirm 关闭', async () => {
    const { wrapper, picker } = mountPicker({ type: 'datetime' })
    await openPanel(wrapper)
    const today = dayjs()
    dayCell(today.date()).click()
    await flush()
    expect(document.querySelector('.eb-picker__popper')).toBeTruthy()
    expect(dayjs(picker().emitted('update:modelValue')[0][0]).format('YYYY-MM-DD HH:mm:ss'))
      .toBe(today.format('YYYY-MM-DD 00:00:00'))
    // footer 确定
    const btns = [...document.querySelectorAll('.eb-picker-panel__footer .eb-picker-panel__btn')]
    btns.find((b) => b.textContent.includes('确 定') || b.textContent.trim() === '确定').click()
    await flush()
    expect(document.querySelector('.eb-picker__popper')).toBeNull()
  })

  it('default-time 应用于日期选择', async () => {
    const { wrapper, picker } = mountPicker({ type: 'datetime', defaultTime: '09:30:00' })
    await openPanel(wrapper)
    const today = dayjs()
    dayCell(today.date()).click()
    await flush()
    expect(dayjs(picker().emitted('update:modelValue')[0][0]).format('HH:mm:ss')).toBe('09:30:00')
  })

  it('时间按钮打开滚轮并调整时间', async () => {
    const { wrapper, picker } = mountPicker({ type: 'datetime' })
    await openPanel(wrapper)
    const today = dayjs()
    dayCell(today.date()).click()
    await flush()
    document.querySelector('.eb-date-picker__time-btn').click()
    await flush()
    expect(document.querySelector('.eb-time-panel')).toBeTruthy()
    // 点 10 时
    const hourCol = document.querySelector('.eb-time-spinner__wrapper')
    const hour10 = [...hourCol.querySelectorAll('.eb-time-spinner__item')].find((li) =>
      li.textContent.trim() === '10'
    )
    hour10.click()
    await flush()
    expect(dayjs(picker().emitted('update:modelValue').at(-1)[0]).format('HH:mm:ss'))
      .toBe('10:00:00')
  })

  it('此刻按钮：设为当前时间并关闭', async () => {
    const { wrapper, picker } = mountPicker({ type: 'datetime' })
    await openPanel(wrapper)
    const btns = [...document.querySelectorAll('.eb-picker-panel__footer .eb-picker-panel__btn')]
    btns.find((b) => b.textContent.includes('此刻')).click()
    await flush()
    const emitted = picker().emitted('update:modelValue')[0][0]
    expect(dayjs(emitted).format('YYYY-MM-DD')).toBe(dayjs().format('YYYY-MM-DD'))
    expect(document.querySelector('.eb-picker__popper')).toBeNull()
  })
})

describe('EbDatePicker 区间', () => {
  it('daterange：两次点选 + calendar-change + 排序输出', async () => {
    const { wrapper, picker } = mountPicker({ type: 'daterange' })
    await openPanel(wrapper)
    expect(document.querySelector('.eb-date-range-picker')).toBeTruthy()
    expect(document.querySelectorAll('.eb-date-table').length).toBe(2)
    const today = dayjs()
    const d1 = today.date() > 20 ? today.date() - 10 : today.date() + 5
    const d2 = d1 + 3
    dayCell(d1).click()
    await flush()
    expect(picker().emitted('calendar-change')).toBeTruthy()
    dayCell(d2).click()
    await flush()
    const [s, e] = picker().emitted('update:modelValue')[0][0]
    expect(dayjs(s).date()).toBe(d1)
    expect(dayjs(e).date()).toBe(d2)
    expect(document.querySelector('.eb-picker__popper')).toBeNull()
  })

  it('daterange 反向点选自动以先者重选起点', async () => {
    const { wrapper, picker } = mountPicker({ type: 'daterange' })
    await openPanel(wrapper)
    const today = dayjs()
    const d1 = today.date() > 25 ? 20 : 26
    const d2 = 2
    dayCell(d1).click()
    await flush()
    dayCell(d2).click() // 更早 → 重设起点
    await flush()
    const evt = picker().emitted('update:modelValue')
    expect(evt).toBeUndefined() // 未完成区间
    expect(document.querySelector('.eb-picker__popper')).toBeTruthy()
  })

  it('datetimerange + default-time：选完保持打开，confirm 关闭且带时间', async () => {
    const { wrapper, picker } = mountPicker({
      type: 'datetimerange',
      defaultTime: ['00:00:00', '23:59:59'],
    })
    await openPanel(wrapper)
    const today = dayjs()
    const d1 = today.date() > 20 ? today.date() - 10 : today.date() + 1
    const d2 = d1 + 2
    dayCell(d1).click()
    await flush()
    dayCell(d2).click()
    await flush()
    // 未关闭
    expect(document.querySelector('.eb-picker__popper')).toBeTruthy()
    const [s, e] = picker().emitted('update:modelValue')[0][0]
    expect(dayjs(e).format('HH:mm:ss')).toBe('23:59:59')
    // confirm
    document.querySelector('.eb-picker-panel__footer .eb-picker-panel__btn').click()
    await flush()
    expect(document.querySelector('.eb-picker__popper')).toBeNull()
  })

  it('monthrange：月份网格区间选择', async () => {
    const { wrapper, picker } = mountPicker({ type: 'monthrange' })
    await openPanel(wrapper)
    expect(document.querySelectorAll('.eb-month-table').length).toBe(2)
    monthCell(1).click()
    await flush()
    monthCell(3).click()
    await flush()
    const [s, e] = picker().emitted('update:modelValue')[0][0]
    expect(dayjs(s).month()).toBe(1)
    expect(dayjs(e).month()).toBe(3)
  })

  it('unlink-panels：右面板独立翻页', async () => {
    const { wrapper } = mountPicker({ type: 'daterange', unlinkPanels: true })
    await openPanel(wrapper)
    const rightHeader = [...document.querySelectorAll('.eb-date-range-picker__header')]
    const rightLabelBefore = rightHeader[1].textContent
    // 右面板下一年
    const btns = document.querySelectorAll('.eb-picker-panel__icon-btn.d-arrow-right')
    btns[btns.length - 1].click()
    await flush()
    const rightLabelAfter = [...document.querySelectorAll('.eb-date-range-picker__header')][1].textContent
    expect(rightLabelBefore).not.toBe(rightLabelAfter)
  })

  it('区间清空', async () => {
    const { wrapper, picker } = mountPicker({
      type: 'daterange',
      modelValue: [new Date(), new Date()],
    })
    await wrapper.find('.eb-range__close-icon').trigger('click')
    await flush()
    expect(picker().emitted('update:modelValue')[0][0]).toEqual([null, null])
  })
})
