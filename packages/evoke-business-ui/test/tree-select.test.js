import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import EvTreeSelect from '../src/components/tree-select/index.vue'

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
  components: { EvTreeSelect },
  inheritAttrs: false,
  props: { modelValue: { type: null, default: undefined } },
  setup(props, { attrs }) {
    const value = ref(props.modelValue)
    return () => h(EvTreeSelect, {
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
  return { wrapper, select: () => wrapper.findComponent(EvTreeSelect) }
}

function flush(ms = 30) {
  return new Promise((r) => setTimeout(r, ms))
}

async function openDropdown(wrapper) {
  await wrapper.find('.ev-select__wrapper').trigger('click')
  await flush()
}

/** 在 teleport 的弹层中按 label 定位节点 content DOM */
function nodeContentOf(label) {
  const nodes = [...document.querySelectorAll('.ev-tree-node')]
  const target = nodes.find((el) =>
    el.querySelector('.ev-tree-node__label')?.textContent === label
  )
  return target?.querySelector('.ev-tree-node__content') ?? null
}

function nodeCheckboxOf(label) {
  const nodes = [...document.querySelectorAll('.ev-tree-node')]
  const target = nodes.find((el) =>
    el.querySelector('.ev-tree-node__label')?.textContent === label
  )
  return target?.querySelector('input.ev-checkbox__original') ?? null
}

function nodeLabels() {
  return [...document.querySelectorAll('.ev-tree-node__label')].map((el) => el.textContent)
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('EvTreeSelect 渲染契约', () => {
  it('双 class + Select 结构（wrapper/suffix）', () => {
    const { wrapper } = mountTreeSelect()
    expect(wrapper.classes()).toContain('ev-select')
    expect(wrapper.classes()).toContain('ev-tree-select')
    expect(wrapper.classes()).toContain('ev-tree-select')
    expect(wrapper.find('.ev-select__wrapper').exists()).toBe(true)
    expect(wrapper.find('.ev-select__suffix').exists()).toBe(true)
  })

  it('弹层内嵌树（el-tree-select__popper + ev-tree）', async () => {
    const { wrapper } = mountTreeSelect()
    await openDropdown(wrapper)
    const popper = document.querySelector('.ev-tree-select__popper')
    expect(popper).toBeTruthy()
    expect(popper.querySelector('.ev-tree')).toBeTruthy()
    expect(document.querySelectorAll('.ev-tree-node').length).toBe(6)
  })

  it('placeholder 默认文案', () => {
    const { wrapper } = mountTreeSelect()
    expect(wrapper.find('.ev-select__placeholder').text()).toBe('请选择')
  })
})

describe('EvTreeSelect 单选（无复选）', () => {
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
    expect(wrapper.find('.ev-select__selected-item-text').text()).toBe('二级 2-1')
    expect(document.querySelector('.ev-tree-select__popper')).toBeNull()
  })

  it('checkStrictly：非叶子直接选中', async () => {
    const { wrapper, select } = mountTreeSelect({ checkStrictly: true })
    await openDropdown(wrapper)
    nodeContentOf('一级 1').click()
    await flush()
    expect(select().emitted('update:modelValue')[0]).toEqual([1])
    expect(wrapper.find('.ev-select__selected-item-text').text()).toBe('一级 1')
  })

  it('初始值 label 解析 + 祖先链自动展开 + 高亮', async () => {
    const { wrapper } = mountTreeSelect({ modelValue: 111 })
    expect(wrapper.find('.ev-select__selected-item-text').text()).toBe('三级 1-1-1')
    await openDropdown(wrapper)
    const deepNode = [...document.querySelectorAll('.ev-tree-node')].find((el) =>
      el.querySelector('.ev-tree-node__label')?.textContent === '三级 1-1-1'
    )
    expect(deepNode.classList.contains('is-current')).toBe(true)
  })
})

describe('EvTreeSelect 多选', () => {
  it('无复选：叶子 toggle + tags 展示 + remove-tag', async () => {
    const { wrapper, select } = mountTreeSelect({ multiple: true })
    await openDropdown(wrapper)
    nodeContentOf('一级 2').click() // 展开
    await flush()
    nodeContentOf('二级 2-1').click()
    await flush()
    expect(select().emitted('update:modelValue')[0]).toEqual([[21]])
    let tags = wrapper.findAll('.ev-select__tag')
    expect(tags.length).toBe(1)
    expect(tags[0].text()).toContain('二级 2-1')
    // 再点取消
    nodeContentOf('二级 2-1').click()
    await flush()
    expect(select().emitted('update:modelValue')[1]).toEqual([[]])
    expect(select().emitted('remove-tag')[0]).toEqual([21])
    tags = wrapper.findAll('.ev-select__tag')
    expect(tags.length).toBe(0)
  })

  it('复选级联：勾选父级 → modelValue 存叶子 key', async () => {
    const { wrapper, select } = mountTreeSelect({ multiple: true, showCheckbox: true })
    await openDropdown(wrapper)
    nodeCheckboxOf('一级 1').dispatchEvent(new Event('change'))
    await flush()
    expect(select().emitted('update:modelValue')[0][0].sort((a, b) => a - b)).toEqual([12, 111])
    // tags 展示叶子
    const tags = wrapper.findAll('.ev-select__tag')
    expect(tags.length).toBe(2)
    // 树上级联全选
    const rootEl = [...document.querySelectorAll('.ev-tree-node')].find((el) =>
      el.querySelector('.ev-tree-node__label')?.textContent === '一级 1'
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
    const rootEl = [...document.querySelectorAll('.ev-tree-node')].find((el) =>
      el.querySelector('.ev-tree-node__label')?.textContent === '一级 2'
    )
    expect(rootEl.classList.contains('is-checked')).toBe(true)
    const tags = wrapper.findAll('.ev-select__tag')
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
    const tags = wrapper.findAll('.ev-select__tag')
    expect(tags.length).toBe(1)
    expect(wrapper.find('.ev-select__tags-collapse-item').text()).toBe('+ 2')
  })
})

describe('EvTreeSelect 单选 + 复选', () => {
  it('勾选父级 → 取首个叶子 key；再点取消', async () => {
    const { wrapper, select } = mountTreeSelect({ showCheckbox: true })
    await openDropdown(wrapper)
    nodeCheckboxOf('一级 1').dispatchEvent(new Event('change'))
    await flush()
    expect(select().emitted('update:modelValue')[0]).toEqual([111])
    expect(wrapper.find('.ev-select__selected-item-text').text()).toBe('三级 1-1-1')
    // 再次点击取消
    nodeCheckboxOf('一级 1').dispatchEvent(new Event('change'))
    await flush()
    expect(select().emitted('update:modelValue')[1]).toEqual([undefined])
  })
})

describe('EvTreeSelect 过滤与清空', () => {
  it('filterable：输入过滤树', async () => {
    const { wrapper } = mountTreeSelect({ filterable: true })
    await openDropdown(wrapper)
    await wrapper.find('.ev-select__input').setValue('三级')
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
    await wrapper.find('.ev-select__input').setValue('一级')
    await flush()
    expect(nodeLabels()).toEqual(['一级 1', '一级 2'])
  })

  it('clearable：清空并触发 clear 事件', async () => {
    const { wrapper, select } = mountTreeSelect({ modelValue: 21, clearable: true })
    await wrapper.find('.ev-select__clear').trigger('click')
    await flush()
    expect(select().emitted('update:modelValue')[0]).toEqual([undefined])
    expect(select().emitted('clear')).toBeTruthy()
  })

  it('disabled 不可打开', async () => {
    const { wrapper } = mountTreeSelect({ disabled: true })
    await wrapper.find('.ev-select__wrapper').trigger('click')
    await flush()
    expect(document.querySelector('.ev-tree-select__popper')).toBeNull()
  })
})

describe('EvTreeSelect 字段映射与 expose', () => {
  it('props 自定义 value/label/children 字段', async () => {
    const customData = [
      { id: 'a', name: '苹果', kids: [{ id: 'a1', name: '红富士' }] },
    ]
    const { wrapper, select } = mountTreeSelect({
      data: customData,
      props: { value: 'id', label: 'name', children: 'kids' },
    })
    expect(wrapper.find('.ev-select__placeholder').text()).toBe('请选择')
    await openDropdown(wrapper)
    expect(nodeLabels()).toContain('苹果')
    expect(nodeLabels()).toContain('红富士')
    nodeContentOf('红富士').click()
    await flush()
    expect(select().emitted('update:modelValue')[0]).toEqual(['a1'])
    expect(wrapper.find('.ev-select__selected-item-text').text()).toBe('红富士')
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
