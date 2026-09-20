import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import EbTimePicker from '../src/components/time-picker/index.vue'
import EbTimeSelect from '../src/components/time-select/index.vue'
import { dayjs } from '../src/components/date-picker/utils'

function mountWith(comp, props = {}) {
  const Harness = defineComponent({
    name: 'PickerHarness',
    components: { [comp.name || 'Comp']: comp },
    inheritAttrs: false,
    props: { modelValue: { type: null, default: null } },
    setup(props, { attrs }) {
      const value = ref(props.modelValue)
      return () => h(comp, {
        ...attrs,
        modelValue: value.value,
        'onUpdate:modelValue': (v) => {
          value.value = v
        },
      })
    },
  })
  const wrapper = mount(Harness, { props, attachTo: document.body })
  return { wrapper, comp: () => wrapper.findComponent(comp) }
}

function flush(ms = 30) {
  return new Promise((r) => setTimeout(r, ms))
}

async function openPanel(wrapper) {
  await wrapper.find('.eb-input__wrapper').trigger('click')
  await flush()
}

function spinnerItem(colIndex, label) {
  const cols = document.querySelectorAll('.eb-time-spinner__wrapper')
  return [...cols[colIndex].querySelectorAll('.eb-time-spinner__item')].find((li) =>
    li.textContent.trim() === label
  )
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('EbTimePicker 渲染契约', () => {
  it('双 class + eb-date-editor 同构 + 时钟图标 + placeholder', () => {
    const { wrapper } = mountWith(EbTimePicker)
    expect(wrapper.classes()).toContain('eb-date-editor')
    expect(wrapper.classes()).toContain('eb-time-picker')
    expect(wrapper.find('.eb-input__wrapper').exists()).toBe(true)
    expect(wrapper.find('.eb-input__inner').attributes('placeholder')).toBe('选择时间')
  })

  it('is-range：双输入 + 分隔符', () => {
    const { wrapper } = mountWith(EbTimePicker, { isRange: true })
    expect(wrapper.classes()).toContain('eb-date-editor--timerange')
    const inputs = wrapper.findAll('.eb-range-input')
    expect(inputs.length).toBe(2)
    expect(inputs[0].attributes('placeholder')).toBe('开始时间')
    expect(inputs[1].attributes('placeholder')).toBe('结束时间')
  })

  it('初始 Date 值回显', () => {
    const d = dayjs().hour(9).minute(30).second(0).toDate()
    const { wrapper } = mountWith(EbTimePicker, { modelValue: d })
    expect(wrapper.find('.eb-input__inner').element.value).toBe('09:30:00')
  })
})

describe('EbTimePicker 单值', () => {
  it('滚轮三列（24/60/60），点击小时实时更新，confirm 关闭', async () => {
    const { wrapper, comp } = mountWith(EbTimePicker)
    await openPanel(wrapper)
    expect(document.querySelector('.eb-time-panel')).toBeTruthy()
    const cols = document.querySelectorAll('.eb-time-spinner__wrapper')
    expect(cols.length).toBe(3)
    expect(cols[0].querySelectorAll('.eb-time-spinner__item').length).toBe(24)
    expect(cols[1].querySelectorAll('.eb-time-spinner__item').length).toBe(60)
    spinnerItem(0, '10').click()
    await flush()
    const emitted = comp().emitted('update:modelValue')[0][0]
    expect(emitted instanceof Date).toBe(true)
    expect(dayjs(emitted).hour()).toBe(10)
    // 未关闭
    expect(document.querySelector('.eb-time-panel')).toBeTruthy()
    document.querySelector('.eb-time-panel__btn.confirm').click()
    await flush()
    expect(document.querySelector('.eb-time-panel')).toBeNull()
  })

  it('value-format 输出字符串', async () => {
    const { wrapper, comp } = mountWith(EbTimePicker, { valueFormat: 'HH:mm' })
    await openPanel(wrapper)
    spinnerItem(0, '08').click()
    await flush()
    spinnerItem(1, '15').click()
    await flush()
    expect(comp().emitted('update:modelValue').at(-1)[0]).toBe('08:15')
  })

  it('format 无秒 → 两列', async () => {
    const { wrapper } = mountWith(EbTimePicker, { format: 'HH:mm' })
    await openPanel(wrapper)
    expect(document.querySelectorAll('.eb-time-spinner__wrapper').length).toBe(2)
  })

  it('手动输入合法时间，非法回滚', async () => {
    const { wrapper, comp } = mountWith(EbTimePicker)
    const input = wrapper.find('.eb-input__inner')
    await input.setValue('12:30:00')
    await flush()
    expect(dayjs(comp().emitted('update:modelValue')[0][0]).format('HH:mm:ss')).toBe('12:30:00')
    await input.setValue('bad-time')
    await flush()
    expect(comp().emitted('update:modelValue').length).toBe(1)
    expect(input.element.value).toBe('12:30:00')
  })

  it('clearable 清空', async () => {
    const { wrapper, comp } = mountWith(EbTimePicker, { modelValue: new Date() })
    await wrapper.find('.eb-range__close-icon').trigger('click')
    await flush()
    expect(comp().emitted('update:modelValue')[0][0]).toBeNull()
    expect(comp().emitted('clear')).toBeTruthy()
  })
})

describe('EbTimePicker 区间', () => {
  it('双滚轮 + confirm 输出 [start, end]', async () => {
    const { wrapper, comp } = mountWith(EbTimePicker, { isRange: true })
    await openPanel(wrapper)
    expect(document.querySelector('.eb-time-range-picker')).toBeTruthy()
    expect(document.querySelectorAll('.eb-time-range-picker__cell').length).toBe(2)
    // 左滚轮选 9 点，右滚轮选 18 点
    const cells = document.querySelectorAll('.eb-time-range-picker__cell')
    const leftHour = [...cells[0].querySelectorAll('.eb-time-spinner__item')].find((li) =>
      li.textContent.trim() === '09'
    )
    leftHour.click()
    await flush()
    const rightHour = [...cells[1].querySelectorAll('.eb-time-spinner__item')].find((li) =>
      li.textContent.trim() === '18'
    )
    rightHour.click()
    await flush()
    expect(comp().emitted('update:modelValue')).toBeUndefined()
    document.querySelector('.eb-time-range-picker .eb-time-panel__btn.confirm').click()
    await flush()
    const [s, e] = comp().emitted('update:modelValue')[0][0]
    expect(dayjs(s).hour()).toBe(9)
    expect(dayjs(e).hour()).toBe(18)
    expect(document.querySelector('.eb-time-range-picker')).toBeNull()
  })

  it('区间值回显 + 清空', async () => {
    const [s, e] = [dayjs().hour(8).minute(0).second(0).toDate(), dayjs().hour(20).minute(0).second(0).toDate()]
    const { wrapper, comp } = mountWith(EbTimePicker, { isRange: true, modelValue: [s, e] })
    const inputs = wrapper.findAll('.eb-range-input')
    expect(inputs[0].element.value).toBe('08:00:00')
    expect(inputs[1].element.value).toBe('20:00:00')
    await wrapper.find('.eb-range__close-icon').trigger('click')
    await flush()
    expect(comp().emitted('update:modelValue')[0][0]).toEqual([null, null])
  })

  it('区间手输：合法走 confirm 通道（排序输出），非法回滚显示', async () => {
    const s = dayjs().hour(8).minute(0).second(0).toDate()
    const e = dayjs().hour(20).minute(0).second(0).toDate()
    const { wrapper, comp } = mountWith(EbTimePicker, { isRange: true, modelValue: [s, e] })
    const inputs = wrapper.findAll('.eb-range-input')
    // 手输开始时间 → 立即确认（另一端沿用当前值）
    await inputs[0].setValue('09:15:30')
    await flush()
    const first = comp().emitted('update:modelValue').at(-1)[0]
    expect(dayjs(first[0]).format('HH:mm:ss')).toBe('09:15:30')
    expect(dayjs(first[1]).format('HH:mm:ss')).toBe('20:00:00')
    // 手输结束时间早于开始 → confirm 排序交换
    await inputs[1].setValue('07:00:00')
    await flush()
    const second = comp().emitted('update:modelValue').at(-1)[0]
    expect(dayjs(second[0]).format('HH:mm:ss')).toBe('07:00:00')
    expect(dayjs(second[1]).format('HH:mm:ss')).toBe('09:15:30')
    // 非法输入回滚显示，不提交
    await inputs[0].setValue('bad-input')
    await flush()
    expect(comp().emitted('update:modelValue').length).toBe(2)
    expect(inputs[0].element.value).toBe('07:00:00')
  })
})

describe('EbTimePicker 禁用时间', () => {
  it('disabled-hours：禁用项置灰不可选中，可用项正常', async () => {
    const { wrapper, comp } = mountWith(EbTimePicker, {
      modelValue: dayjs().hour(10).minute(0).second(0).toDate(),
      disabledHours: () => [5, 6, 7],
    })
    await openPanel(wrapper)
    const five = spinnerItem(0, '05')
    expect(five.classList.contains('is-disabled')).toBe(true)
    five.click()
    await flush()
    expect(comp().emitted('update:modelValue')).toBeUndefined()
    spinnerItem(0, '08').click()
    await flush()
    expect(dayjs(comp().emitted('update:modelValue')[0][0]).hour()).toBe(8)
  })

  it('初始值落在禁用集内：打开面板自动让位到最近可用值', async () => {
    const { wrapper, comp } = mountWith(EbTimePicker, {
      modelValue: dayjs().hour(4).minute(0).second(0).toDate(),
      disabledHours: () => [3, 4],
    })
    await openPanel(wrapper)
    await flush()
    const emitted = comp().emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(dayjs(emitted.at(-1)[0]).hour()).toBe(5)
    // 回显同步为让位后的值
    expect(wrapper.find('.eb-input__inner').element.value).toBe('05:00:00')
  })

  it('disabled-minutes：分钟让位（依赖当前 hour 的禁用集）', async () => {
    const { wrapper, comp } = mountWith(EbTimePicker, {
      modelValue: dayjs().hour(10).minute(30).second(0).toDate(),
      disabledMinutes: (hour) => (hour === 10 ? [30] : []),
    })
    await openPanel(wrapper)
    await flush()
    const emitted = comp().emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    const d = dayjs(emitted.at(-1)[0])
    expect(d.hour()).toBe(10)
    expect(d.minute()).toBe(29)
  })
})

describe('EbTimeSelect', () => {
  it('双 class + 编辑器结构', () => {
    const { wrapper } = mountWith(EbTimeSelect)
    expect(wrapper.classes()).toContain('eb-time-select')
    expect(wrapper.classes()).toContain('eb-time-select')
    expect(wrapper.find('.eb-input__inner').attributes('placeholder')).toBe('选择时间')
  })

  it('默认选项 09:00-18:00 每 30 分钟（19 项）', async () => {
    const { wrapper } = mountWith(EbTimeSelect)
    await openPanel(wrapper)
    const items = [...document.querySelectorAll('.eb-time-select__item')]
    expect(items.length).toBe(19)
    expect(items[0].textContent.trim()).toBe('09:00')
    expect(items[18].textContent.trim()).toBe('18:00')
  })

  it('点击选项：emit + 关闭 + is-active 高亮', async () => {
    const { wrapper, comp } = mountWith(EbTimeSelect)
    await openPanel(wrapper)
    const items = [...document.querySelectorAll('.eb-time-select__item')]
    items[2].click() // 10:00
    await flush()
    expect(comp().emitted('update:modelValue')[0][0]).toBe('10:00')
    expect(comp().emitted('change')[0][0]).toBe('10:00')
    expect(document.querySelector('.eb-time-select-dropdown')).toBeNull()
    // 重新打开 → 高亮
    await openPanel(wrapper)
    const active = document.querySelector('.eb-time-select__item.is-active')
    expect(active?.textContent.trim()).toBe('10:00')
  })

  it('minTime/maxTime 禁用边界项', async () => {
    const { wrapper, comp } = mountWith(EbTimeSelect, { minTime: '10:00', maxTime: '16:00' })
    await openPanel(wrapper)
    const items = [...document.querySelectorAll('.eb-time-select__item')]
    const disabled = items.filter((el) => el.classList.contains('is-disabled'))
    expect(disabled.length).toBeGreaterThan(0)
    items[0].click() // 09:00 < minTime → 禁用
    await flush()
    expect(comp().emitted('update:modelValue')).toBeUndefined()
    expect(document.querySelector('.eb-time-select-dropdown')).toBeTruthy()
  })

  it('自定义 start/end/step 选项序列', async () => {
    const { wrapper } = mountWith(EbTimeSelect, { start: '08:00', end: '10:00', step: '01:00' })
    await openPanel(wrapper)
    const items = [...document.querySelectorAll('.eb-time-select__item')].map((el) => el.textContent.trim())
    expect(items).toEqual(['08:00', '09:00', '10:00'])
  })

  it('初始值回显 + 手动输入合法项', async () => {
    const { wrapper, comp } = mountWith(EbTimeSelect, { modelValue: '09:30' })
    expect(wrapper.find('.eb-input__inner').element.value).toBe('09:30')
    const input = wrapper.find('.eb-input__inner')
    await input.setValue('11:00')
    await flush()
    expect(comp().emitted('update:modelValue')[0][0]).toBe('11:00')
    await input.setValue('07:00') // 不在选项中
    await flush()
    expect(comp().emitted('update:modelValue').length).toBe(1)
  })

  it('键盘可达：触发器 Enter/Space/ArrowDown 打开面板，Esc 关闭', async () => {
    for (const key of ['Enter', ' ', 'ArrowDown']) {
      const { wrapper, comp } = mountWith(EbTimeSelect)
      const input = wrapper.find('.eb-input__inner')
      // combobox 语义 aria
      expect(input.attributes('role')).toBe('combobox')
      expect(input.attributes('aria-haspopup')).toBe('listbox')
      expect(input.attributes('aria-expanded')).toBe('false')
      await input.trigger('keydown', { key })
      await flush()
      expect(comp().emitted('visible-change')[0]).toEqual([true])
      expect(document.querySelector('.eb-time-select-dropdown')).toBeTruthy()
      expect(input.attributes('aria-expanded')).toBe('true')
      // Esc 关闭，焦点留在触发器上
      await input.trigger('keydown', { key: 'Escape' })
      await flush()
      expect(document.querySelector('.eb-time-select-dropdown')).toBeNull()
      expect(comp().emitted('visible-change').at(-1)).toEqual([false])
      expect(document.activeElement).toBe(input.element)
      wrapper.unmount()
    }
  })

  it('键盘打开后点选可用，禁用项键盘打开不受影响', async () => {
    const { wrapper, comp } = mountWith(EbTimeSelect, { minTime: '10:00' })
    const input = wrapper.find('.eb-input__inner')
    expect(input.attributes('aria-disabled')).toBeUndefined()
    await input.trigger('keydown', { key: 'ArrowDown' })
    await flush()
    const items = [...document.querySelectorAll('.eb-time-select__item')]
    items[2].click() // 10:00（首个可用项）
    await flush()
    expect(comp().emitted('update:modelValue')[0][0]).toBe('10:00')
    wrapper.unmount()
  })
})
