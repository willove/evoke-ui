import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import EbTreeSelect from '../src/components/tree-select/index.vue'

const data = [
  {
    value: 1, label: '一级 1',
    children: [
      { value: 11, label: '二级 1-1', children: [{ value: 111, label: '三级 1-1-1' }] },
      { value: 12, label: '二级 1-2' },
    ],
  },
  {
    value: 2, label: '一级 2',
    children: [{ value: 21, label: '二级 2-1' }],
  },
]

/** v-model harness：内部 ref 承接 update:modelValue 驱动 label/tags 渲染 */
const Harness = defineComponent({
  name: 'TreeSelectHarness',
  components: { EbTreeSelect },
  inheritAttrs: false,
  props: { modelValue: { type: null, default: undefined } },
  setup(props, { attrs }) {
    const value = ref(props.modelValue)
    return () => h(EbTreeSelect, {
      ...attrs,
      modelValue: value.value,
      'onUpdate:modelValue': (v) => {
        value.value = v
      },
    })
  },
})

function mountTreeSelect(props = {}) {
  const wrapper = mount(Harness, { props: { data, ...props }, attachTo: document.body })
  return { wrapper, select: () => wrapper.findComponent(EbTreeSelect) }
}

function flush(ms = 30) {
  return new Promise((r) => setTimeout(r, ms))
}

async function openDropdown(wrapper) {
  await wrapper.find('.eb-select__wrapper').trigger('click')
  await flush()
}

/** 在 teleport 的弹层中按 label 定位节点 content DOM */
function nodeContentOf(label) {
  const nodes = [...document.querySelectorAll('.eb-tree-node')]
  const target = nodes.find((el) =>
    el.querySelector('.eb-tree-node__label')?.textContent === label
  )
  return target?.querySelector('.eb-tree-node__content') ?? null
}

function nodeCheckboxOf(label) {
  const nodes = [...document.querySelectorAll('.eb-tree-node')]
  const target = nodes.find((el) =>
    el.querySelector('.eb-tree-node__label')?.textContent === label
  )
  return target?.querySelector('input.eb-checkbox__original') ?? null
}

function nodeLabels() {
  return [...document.querySelectorAll('.eb-tree-node__label')].map((el) => el.textContent)
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('EbTreeSelect 渲染契约', () => {
  it('双 class + Select 结构（wrapper/suffix）', () => {
    const { wrapper } = mountTreeSelect()
    expect(wrapper.classes()).toContain('eb-select')
    expect(wrapper.classes()).toContain('eb-tree-select')
    expect(wrapper.classes()).toContain('eb-tree-select')
    expect(wrapper.find('.eb-select__wrapper').exists()).toBe(true)
    expect(wrapper.find('.eb-select__suffix').exists()).toBe(true)
  })

  it('弹层内嵌树（eb-tree-select__popper + eb-tree）', async () => {
    const { wrapper } = mountTreeSelect()
    await openDropdown(wrapper)
    const popper = document.querySelector('.eb-tree-select__popper')
    expect(popper).toBeTruthy()
    expect(popper.querySelector('.eb-tree')).toBeTruthy()
    expect(document.querySelectorAll('.eb-tree-node').length).toBe(6)
  })

  it('placeholder 默认文案', () => {
    const { wrapper } = mountTreeSelect()
    expect(wrapper.find('.eb-select__placeholder').text()).toBe('请选择')
  })
})

describe('EbTreeSelect 单选（无复选）', () => {
  it('点击叶子选中：label 回显 + 关闭下拉', async () => {
    const { wrapper, select } = mountTreeSelect()
    await openDropdown(wrapper)
    // 非叶子点击 → 展开，不选中
    nodeContentOf('一级 2').click()
    await flush()
    expect(select().emitted('update:modelValue')).toBeUndefined()
    // 叶子选中
    nodeContentOf('二级 2-1').click()
    await flush()
    expect(select().emitted('update:modelValue')[0]).toEqual([21])
    expect(select().emitted('change')[0]).toEqual([21])
    expect(wrapper.find('.eb-select__selected-item-text').text()).toBe('二级 2-1')
    expect(document.querySelector('.eb-tree-select__popper')).toBeNull()
  })

  it('checkStrictly：非叶子直接选中', async () => {
    const { wrapper, select } = mountTreeSelect({ checkStrictly: true })
    await openDropdown(wrapper)
    nodeContentOf('一级 1').click()
    await flush()
    expect(select().emitted('update:modelValue')[0]).toEqual([1])
    expect(wrapper.find('.eb-select__selected-item-text').text()).toBe('一级 1')
  })

  it('初始值 label 解析 + 祖先链自动展开 + 高亮', async () => {
    const { wrapper } = mountTreeSelect({ modelValue: 111 })
    expect(wrapper.find('.eb-select__selected-item-text').text()).toBe('三级 1-1-1')
    await openDropdown(wrapper)
    const deepNode = [...document.querySelectorAll('.eb-tree-node')].find((el) =>
      el.querySelector('.eb-tree-node__label')?.textContent === '三级 1-1-1'
    )
    expect(deepNode.classList.contains('is-current')).toBe(true)
  })
})

describe('EbTreeSelect 多选', () => {
  it('无复选：叶子 toggle + tags 展示 + remove-tag', async () => {
    const { wrapper, select } = mountTreeSelect({ multiple: true })
    await openDropdown(wrapper)
    nodeContentOf('一级 2').click() // 展开
    await flush()
    nodeContentOf('二级 2-1').click()
    await flush()
    expect(select().emitted('update:modelValue')[0]).toEqual([[21]])
    let tags = wrapper.findAll('.eb-select__tag')
    expect(tags.length).toBe(1)
    expect(tags[0].text()).toContain('二级 2-1')
    // 再点取消
    nodeContentOf('二级 2-1').click()
    await flush()
    expect(select().emitted('update:modelValue')[1]).toEqual([[]])
    expect(select().emitted('remove-tag')[0]).toEqual([21])
    tags = wrapper.findAll('.eb-select__tag')
    expect(tags.length).toBe(0)
  })

  it('复选级联：勾选父级 → modelValue 存叶子 key', async () => {
    const { wrapper, select } = mountTreeSelect({ multiple: true, showCheckbox: true })
    await openDropdown(wrapper)
    nodeCheckboxOf('一级 1').dispatchEvent(new Event('change'))
    await flush()
    expect(select().emitted('update:modelValue')[0][0].sort((a, b) => a - b)).toEqual([12, 111])
    // tags 展示叶子
    const tags = wrapper.findAll('.eb-select__tag')
    expect(tags.length).toBe(2)
    // 树上级联全选
    const rootEl = [...document.querySelectorAll('.eb-tree-node')].find((el) =>
      el.querySelector('.eb-tree-node__label')?.textContent === '一级 1'
    )
    expect(rootEl.classList.contains('is-checked')).toBe(true)
    // 取消一个叶子 → model 移除
    nodeCheckboxOf('二级 1-2').dispatchEvent(new Event('change'))
    await flush()
    expect(select().emitted('update:modelValue')[1][0]).toEqual([111])
  })

  it('复选级联：外部设置父级 key 向下级联勾选', async () => {
    const { wrapper } = mountTreeSelect({ multiple: true, showCheckbox: true, modelValue: [2] })
    await openDropdown(wrapper)
    const rootEl = [...document.querySelectorAll('.eb-tree-node')].find((el) =>
      el.querySelector('.eb-tree-node__label')?.textContent === '一级 2'
    )
    expect(rootEl.classList.contains('is-checked')).toBe(true)
    const tags = wrapper.findAll('.eb-select__tag')
    expect(tags.length).toBe(1)
    expect(tags[0].text()).toContain('一级 2')
  })

  it('checkStrictly + 复选：modelValue 存全部勾选 key（不级联）', async () => {
    const { wrapper, select } = mountTreeSelect({
      multiple: true, showCheckbox: true, checkStrictly: true,
    })
    await openDropdown(wrapper)
    nodeCheckboxOf('一级 1').dispatchEvent(new Event('change'))
    await flush()
    expect(select().emitted('update:modelValue')[0][0]).toEqual([1])
  })

  it('collapseTags 折叠展示', () => {
    const { wrapper } = mountTreeSelect({
      multiple: true, showCheckbox: true, collapseTags: true, modelValue: [111, 12, 21],
    })
    const tags = wrapper.findAll('.eb-select__tag')
    expect(tags.length).toBe(1)
    expect(wrapper.find('.eb-select__tags-collapse-item').text()).toBe('+ 2')
  })
})

describe('EbTreeSelect checked-strategy（多选复选回传归约）', () => {
  it('child（默认）：只存叶子 key', async () => {
    const { wrapper, select } = mountTreeSelect({
      multiple: true, showCheckbox: true, checkedStrategy: 'child',
    })
    await openDropdown(wrapper)
    nodeCheckboxOf('一级 1').dispatchEvent(new Event('change'))
    await flush()
    expect(select().emitted('update:modelValue')[0][0].sort((a, b) => a - b)).toEqual([12, 111])
    // 回显：叶子 key 反查 label
    const tags = wrapper.findAll('.eb-select__tag')
    expect(tags.map((t) => t.text())).toContain('三级 1-1-1')
    expect(tags.map((t) => t.text())).toContain('二级 1-2')
  })

  it('all：全存勾选 key（含父级）', async () => {
    const { wrapper, select } = mountTreeSelect({
      multiple: true, showCheckbox: true, checkedStrategy: 'all',
    })
    await openDropdown(wrapper)
    nodeCheckboxOf('一级 2').dispatchEvent(new Event('change'))
    await flush()
    expect(select().emitted('update:modelValue')[0][0].sort((a, b) => a - b)).toEqual([2, 21])
    // 回显：父级 key 也能反查 label
    const tags = wrapper.findAll('.eb-select__tag')
    expect(tags.length).toBe(2)
    expect(tags.map((t) => t.text())).toContain('一级 2')
    expect(tags.map((t) => t.text())).toContain('二级 2-1')
  })

  it('parent：只存子级全选中的最上层父 key', async () => {
    const { wrapper, select } = mountTreeSelect({
      multiple: true, showCheckbox: true, checkedStrategy: 'parent',
    })
    await openDropdown(wrapper)
    nodeCheckboxOf('一级 1').dispatchEvent(new Event('change'))
    await flush()
    // 一级 1 子级全选中 → 只存父 key
    expect(select().emitted('update:modelValue')[0][0]).toEqual([1])
    let tags = wrapper.findAll('.eb-select__tag')
    expect(tags.length).toBe(1)
    expect(tags[0].text()).toContain('一级 1')
    // 取消一个叶子 → 一级 1 不再全选；二级 1-1 子树仍全选 → 归约为其最上层 key
    nodeCheckboxOf('二级 1-2').dispatchEvent(new Event('change'))
    await flush()
    expect(select().emitted('update:modelValue')[1][0]).toEqual([11])
    tags = wrapper.findAll('.eb-select__tag')
    expect(tags.map((t) => t.text())).toContain('二级 1-1')
  })

  it('parent：父 key 初始回显向下级联勾选', async () => {
    const { wrapper } = mountTreeSelect({
      multiple: true, showCheckbox: true, checkedStrategy: 'parent', modelValue: [1],
    })
    await openDropdown(wrapper)
    const rootEl = [...document.querySelectorAll('.eb-tree-node')].find((el) =>
      el.querySelector('.eb-tree-node__label')?.textContent === '一级 1'
    )
    expect(rootEl.classList.contains('is-checked')).toBe(true)
    const tags = wrapper.findAll('.eb-select__tag')
    expect(tags.length).toBe(1)
    expect(tags[0].text()).toContain('一级 1')
  })
})

describe('EbTreeSelect 单选 + 复选', () => {
  it('勾选父级 → 取首个叶子 key；再点取消', async () => {
    const { wrapper, select } = mountTreeSelect({ showCheckbox: true })
    await openDropdown(wrapper)
    nodeCheckboxOf('一级 1').dispatchEvent(new Event('change'))
    await flush()
    expect(select().emitted('update:modelValue')[0]).toEqual([111])
    expect(wrapper.find('.eb-select__selected-item-text').text()).toBe('三级 1-1-1')
    // 再次点击取消
    nodeCheckboxOf('一级 1').dispatchEvent(new Event('change'))
    await flush()
    expect(select().emitted('update:modelValue')[1]).toEqual([undefined])
  })
})

describe('EbTreeSelect 过滤与清空', () => {
  it('filterable：输入过滤树', async () => {
    const { wrapper } = mountTreeSelect({ filterable: true })
    await openDropdown(wrapper)
    await wrapper.find('.eb-select__input').setValue('三级')
    await flush()
    const labels = nodeLabels()
    expect(labels).toContain('三级 1-1-1')
    expect(labels).toContain('一级 1')
    expect(labels).not.toContain('一级 2')
  })

  it('filterMethod 自定义过滤', async () => {
    const { wrapper } = mountTreeSelect({
      filterable: true,
      filterMethod: (q, node) => String(node.label).startsWith(q),
    })
    await openDropdown(wrapper)
    await wrapper.find('.eb-select__input').setValue('一级')
    await flush()
    expect(nodeLabels()).toEqual(['一级 1', '一级 2'])
  })

  it('clearable：清空并触发 clear 事件', async () => {
    const { wrapper, select } = mountTreeSelect({ modelValue: 21, clearable: true })
    await wrapper.find('.eb-select__clear').trigger('click')
    await flush()
    expect(select().emitted('update:modelValue')[0]).toEqual([undefined])
    expect(select().emitted('clear')).toBeTruthy()
  })

  it('disabled 不可打开', async () => {
    const { wrapper } = mountTreeSelect({ disabled: true })
    await wrapper.find('.eb-select__wrapper').trigger('click')
    await flush()
    expect(document.querySelector('.eb-tree-select__popper')).toBeNull()
  })
})

describe('EbTreeSelect 字段映射与 expose', () => {
  it('props 自定义 value/label/children 字段', async () => {
    const customData = [
      { id: 'a', name: '苹果', kids: [{ id: 'a1', name: '红富士' }] },
    ]
    const { wrapper, select } = mountTreeSelect({
      data: customData,
      props: { value: 'id', label: 'name', children: 'kids' },
    })
    expect(wrapper.find('.eb-select__placeholder').text()).toBe('请选择')
    await openDropdown(wrapper)
    expect(nodeLabels()).toContain('苹果')
    expect(nodeLabels()).toContain('红富士')
    nodeContentOf('红富士').click()
    await flush()
    expect(select().emitted('update:modelValue')[0]).toEqual(['a1'])
    expect(wrapper.find('.eb-select__selected-item-text').text()).toBe('红富士')
  })

  it('expose 透传树方法', async () => {
    const { wrapper, select } = mountTreeSelect({ showCheckbox: true, multiple: true })
    await openDropdown(wrapper)
    expect(typeof select().vm.filter).toBe('function')
    expect(typeof select().vm.getNode).toBe('function')
    expect(typeof select().vm.setCheckedKeys).toBe('function')
    expect(select().vm.getNode(11)?.label).toBe('二级 1-1')
    select().vm.setCheckedKeys([12])
    await flush()
    expect(select().vm.getCheckedKeys()).toEqual([12])
  })
})

describe('EbTreeSelect label-in-value 与键盘打开', () => {
  it('label-in-value 单选：负载形如 { value, label }，外部对象值可回显', async () => {
    const { wrapper, select } = mountTreeSelect({
      labelInValue: true,
      modelValue: { value: 21, label: '二级 2-1' },
    })
    // 外部对象值回显
    expect(wrapper.find('.eb-select__selected-item-text').text()).toBe('二级 2-1')
    await openDropdown(wrapper)
    nodeContentOf('三级 1-1-1').click()
    await flush()
    expect(select().emitted('update:modelValue')[0]).toEqual([{ value: 111, label: '三级 1-1-1' }])
    expect(select().emitted('change')[0]).toEqual([{ value: 111, label: '三级 1-1-1' }])
    expect(wrapper.find('.eb-select__selected-item-text').text()).toBe('三级 1-1-1')
    expect(document.querySelector('.eb-tree-select__popper')).toBeNull()
  })

  it('label-in-value 多选无复选：叶子 toggle 负载为对象数组', async () => {
    const { wrapper, select } = mountTreeSelect({ labelInValue: true, multiple: true })
    await openDropdown(wrapper)
    nodeContentOf('一级 2').click() // 展开非叶子，不选中
    await flush()
    nodeContentOf('二级 2-1').click()
    await flush()
    expect(select().emitted('update:modelValue')[0][0]).toEqual([{ value: 21, label: '二级 2-1' }])
    const tags = wrapper.findAll('.eb-select__tag')
    expect(tags.length).toBe(1)
    expect(tags[0].text()).toContain('二级 2-1')
  })

  it('label-in-value 多选复选：与 checked-strategy 组合，label 取归约后 key 的文案', async () => {
    const { wrapper, select } = mountTreeSelect({
      labelInValue: true,
      multiple: true,
      showCheckbox: true,
      checkedStrategy: 'parent',
    })
    await openDropdown(wrapper)
    nodeCheckboxOf('一级 1').dispatchEvent(new Event('change'))
    await flush()
    expect(select().emitted('update:modelValue')[0][0]).toEqual([{ value: 1, label: '一级 1' }])
    const tags = wrapper.findAll('.eb-select__tag')
    expect(tags.length).toBe(1)
    expect(tags[0].text()).toContain('一级 1')
    // 外部对象数组初始值也能回显（归约 key 不在数据中时回退自带 label）
    const wrapper2 = mount(Harness, {
      props: {
        data,
        labelInValue: true,
        multiple: true,
        modelValue: [{ value: 999, label: '外部节点' }],
      },
      attachTo: document.body,
    })
    const tags2 = wrapper2.findAll('.eb-select__tag')
    expect(tags2.length).toBe(1)
    expect(tags2[0].text()).toContain('外部节点')
    wrapper2.unmount()
  })

  it('关闭态触发器键盘 Enter/Space/ArrowDown 打开下拉', async () => {
    for (const key of ['Enter', ' ', 'ArrowDown']) {
      const { wrapper, select } = mountTreeSelect()
      await wrapper.find('.eb-select__wrapper').trigger('keydown', { key })
      await flush()
      expect(select().emitted('visible-change')[0]).toEqual([true])
      expect(document.querySelector('.eb-tree-select__popper')).toBeTruthy()
      wrapper.unmount()
    }
  })

  it('filter 输入框 keydown 冒泡被守卫拦截，不触发打开', async () => {
    const { wrapper, select } = mountTreeSelect({ filterable: true })
    await wrapper.find('.eb-select__input').trigger('keydown', { key: 'Enter' })
    await flush()
    expect(select().emitted('visible-change')).toBeUndefined()
    expect(document.querySelector('.eb-tree-select__popper')).toBeNull()
  })

  it('disabled 下键盘不打开', async () => {
    const { wrapper, select } = mountTreeSelect({ disabled: true })
    await wrapper.find('.eb-select__wrapper').trigger('keydown', { key: 'Enter' })
    await flush()
    expect(select().emitted('visible-change')).toBeUndefined()
  })
})
