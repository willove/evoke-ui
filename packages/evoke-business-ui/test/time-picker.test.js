import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import EvTimePicker from '../src/components/time-picker/index.vue'
import EvTimeSelect from '../src/components/time-select/index.vue'
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
  await wrapper.find('.ev-input__wrapper').trigger('click')
  await flush()
}

function spinnerItem(colIndex, label) {
  const cols = document.querySelectorAll('.ev-time-spinner__wrapper')
  return [...cols[colIndex].querySelectorAll('.ev-time-spinner__item')].find((li) =>
    li.textContent.trim() === label
  )
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('EvTimePicker 渲染契约', () => {
  it('双 class + ev-date-editor 同构 + 时钟图标 + placeholder', () => {
    const { wrapper } = mountWith(EvTimePicker)
    expect(wrapper.classes()).toContain('ev-date-editor')
    expect(wrapper.classes()).toContain('ev-time-picker')
    expect(wrapper.find('.ev-input__wrapper').exists()).toBe(true)
    expect(wrapper.find('.ev-input__inner').attributes('placeholder')).toBe('选择时间')
  })

  it('is-range：双输入 + 分隔符', () => {
    const { wrapper } = mountWith(EvTimePicker, { isRange: true })
    expect(wrapper.classes()).toContain('ev-date-editor--timerange')
    const inputs = wrapper.findAll('.ev-range-input')
    expect(inputs.length).toBe(2)
    expect(inputs[0].attributes('placeholder')).toBe('开始时间')
    expect(inputs[1].attributes('placeholder')).toBe('结束时间')
  })

  it('初始 Date 值回显', () => {
    const d = dayjs().hour(9).minute(30).second(0).toDate()
    const { wrapper } = mountWith(EvTimePicker, { modelValue: d })
    expect(wrapper.find('.ev-input__inner').element.value).toBe('09:30:00')
  })
})

describe('EvTimePicker 单值', () => {
  it('滚轮三列（24/60/60），点击小时实时更新，confirm 关闭', async () => {
    const { wrapper, comp } = mountWith(EvTimePicker)
    await openPanel(wrapper)
    expect(document.querySelector('.ev-time-panel')).toBeTruthy()
    const cols = document.querySelectorAll('.ev-time-spinner__wrapper')
    expect(cols.length).toBe(3)
    expect(cols[0].querySelectorAll('.ev-time-spinner__item').length).toBe(24)
    expect(cols[1].querySelectorAll('.ev-time-spinner__item').length).toBe(60)
    spinnerItem(0, '10').click()
    await flush()
    const emitted = comp().emitted('update:modelValue')[0][0]
    expect(emitted instanceof Date).toBe(true)
    expect(dayjs(emitted).hour()).toBe(10)
    // 未关闭
    expect(document.querySelector('.ev-time-panel')).toBeTruthy()
    document.querySelector('.ev-time-panel__btn.confirm').click()
    await flush()
    expect(document.querySelector('.ev-time-panel')).toBeNull()
  })

  it('value-format 输出字符串', async () => {
    const { wrapper, comp } = mountWith(EvTimePicker, { valueFormat: 'HH:mm' })
    await openPanel(wrapper)
    spinnerItem(0, '08').click()
    await flush()
    spinnerItem(1, '15').click()
    await flush()
    expect(comp().emitted('update:modelValue').at(-1)[0]).toBe('08:15')
  })

  it('format 无秒 → 两列', async () => {
    const { wrapper } = mountWith(EvTimePicker, { format: 'HH:mm' })
    await openPanel(wrapper)
    expect(document.querySelectorAll('.ev-time-spinner__wrapper').length).toBe(2)
  })

  it('手动输入合法时间，非法回滚', async () => {
    const { wrapper, comp } = mountWith(EvTimePicker)
    const input = wrapper.find('.ev-input__inner')
    await input.setValue('12:30:00')
    await flush()
    expect(dayjs(comp().emitted('update:modelValue')[0][0]).format('HH:mm:ss')).toBe('12:30:00')
    await input.setValue('bad-time')
    await flush()
    expect(comp().emitted('update:modelValue').length).toBe(1)
    expect(input.element.value).toBe('12:30:00')
  })

  it('clearable 清空', async () => {
    const { wrapper, comp } = mountWith(EvTimePicker, { modelValue: new Date() })
    await wrapper.find('.ev-range__close-icon').trigger('click')
    await flush()
    expect(comp().emitted('update:modelValue')[0][0]).toBeNull()
    expect(comp().emitted('clear')).toBeTruthy()
  })
})

describe('EvTimePicker 区间', () => {
  it('双滚轮 + confirm 输出 [start, end]', async () => {
    const { wrapper, comp } = mountWith(EvTimePicker, { isRange: true })
    await openPanel(wrapper)
    expect(document.querySelector('.ev-time-range-picker')).toBeTruthy()
    expect(document.querySelectorAll('.ev-time-range-picker__cell').length).toBe(2)
    // 左滚轮选 9 点，右滚轮选 18 点
    const cells = document.querySelectorAll('.ev-time-range-picker__cell')
    const leftHour = [...cells[0].querySelectorAll('.ev-time-spinner__item')].find((li) =>
      li.textContent.trim() === '09'
    )
    leftHour.click()
    await flush()
    const rightHour = [...cells[1].querySelectorAll('.ev-time-spinner__item')].find((li) =>
      li.textContent.trim() === '18'
    )
    rightHour.click()
    await flush()
    expect(comp().emitted('update:modelValue')).toBeUndefined()
    document.querySelector('.ev-time-range-picker .ev-time-panel__btn.confirm').click()
    await flush()
    const [s, e] = comp().emitted('update:modelValue')[0][0]
    expect(dayjs(s).hour()).toBe(9)
    expect(dayjs(e).hour()).toBe(18)
    expect(document.querySelector('.ev-time-range-picker')).toBeNull()
  })

  it('区间值回显 + 清空', async () => {
    const [s, e] = [dayjs().hour(8).minute(0).second(0).toDate(), dayjs().hour(20).minute(0).second(0).toDate()]
    const { wrapper, comp } = mountWith(EvTimePicker, { isRange: true, modelValue: [s, e] })
    const inputs = wrapper.findAll('.ev-range-input')
    expect(inputs[0].element.value).toBe('08:00:00')
    expect(inputs[1].element.value).toBe('20:00:00')
    await wrapper.find('.ev-range__close-icon').trigger('click')
    await flush()
    expect(comp().emitted('update:modelValue')[0][0]).toEqual([null, null])
  })
})

describe('EvTimeSelect', () => {
  it('双 class + 编辑器结构', () => {
    const { wrapper } = mountWith(EvTimeSelect)
    expect(wrapper.classes()).toContain('ev-time-select')
    expect(wrapper.classes()).toContain('ev-time-select')
    expect(wrapper.find('.ev-input__inner').attributes('placeholder')).toBe('选择时间')
  })

  it('默认选项 09:00-18:00 每 30 分钟（19 项）', async () => {
    const { wrapper } = mountWith(EvTimeSelect)
    await openPanel(wrapper)
    const items = [...document.querySelectorAll('.ev-time-select__item')]
    expect(items.length).toBe(19)
    expect(items[0].textContent.trim()).toBe('09:00')
    expect(items[18].textContent.trim()).toBe('18:00')
  })

  it('点击选项：emit + 关闭 + is-active 高亮', async () => {
    const { wrapper, comp } = mountWith(EvTimeSelect)
    await openPanel(wrapper)
    const items = [...document.querySelectorAll('.ev-time-select__item')]
    items[2].click() // 10:00
    await flush()
    expect(comp().emitted('update:modelValue')[0][0]).toBe('10:00')
    expect(comp().emitted('change')[0][0]).toBe('10:00')
    expect(document.querySelector('.ev-time-select-dropdown')).toBeNull()
    // 重新打开 → 高亮
    await openPanel(wrapper)
    const active = document.querySelector('.ev-time-select__item.is-active')
    expect(active?.textContent.trim()).toBe('10:00')
  })

  it('minTime/maxTime 禁用边界项', async () => {
    const { wrapper, comp } = mountWith(EvTimeSelect, { minTime: '10:00', maxTime: '16:00' })
    await openPanel(wrapper)
    const items = [...document.querySelectorAll('.ev-time-select__item')]
    const disabled = items.filter((el) => el.classList.contains('is-disabled'))
    expect(disabled.length).toBeGreaterThan(0)
    items[0].click() // 09:00 < minTime → 禁用
    await flush()
    expect(comp().emitted('update:modelValue')).toBeUndefined()
    expect(document.querySelector('.ev-time-select-dropdown')).toBeTruthy()
  })

  it('自定义 start/end/step 选项序列', async () => {
    const { wrapper } = mountWith(EvTimeSelect, { start: '08:00', end: '10:00', step: '01:00' })
    await openPanel(wrapper)
    const items = [...document.querySelectorAll('.ev-time-select__item')].map((el) => el.textContent.trim())
    expect(items).toEqual(['08:00', '09:00', '10:00'])
  })

  it('初始值回显 + 手动输入合法项', async () => {
    const { wrapper, comp } = mountWith(EvTimeSelect, { modelValue: '09:30' })
    expect(wrapper.find('.ev-input__inner').element.value).toBe('09:30')
    const input = wrapper.find('.ev-input__inner')
    await input.setValue('11:00')
    await flush()
    expect(comp().emitted('update:modelValue')[0][0]).toBe('11:00')
    await input.setValue('07:00') // 不在选项中
    await flush()
    expect(comp().emitted('update:modelValue').length).toBe(1)
  })
})
