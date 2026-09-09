import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import EvCascader from '../src/components/cascader/index.vue'

const options = [
  {
    value: 'zhejiang', label: '浙江', children: [
      {
        value: 'hangzhou', label: '杭州', children: [
          { value: 'xihu', label: '西湖' },
          { value: 'binjiang', label: '滨江' },
        ],
      },
      { value: 'ningbo', label: '宁波' },
    ],
  },
  {
    value: 'jiangsu', label: '江苏', children: [
      { value: 'nanjing', label: '南京' },
    ],
  },
]

const Harness = defineComponent({
  name: 'CascaderHarness',
  components: { EvCascader },
  inheritAttrs: false,
  props: { modelValue: { type: null, default: null } },
  setup(props, { attrs }) {
    const value = ref(props.modelValue)
    return () => h(EvCascader, {
      ...attrs,
      modelValue: value.value,
      'onUpdate:modelValue': (v) => {
        value.value = v
      },
    })
  },
})

function mountCascader(props = {}) {
  const wrapper = mount(Harness, { props: { options, ...props }, attachTo: document.body })
  return { wrapper, cascader: () => wrapper.findComponent(EvCascader) }
}

function flush(ms = 30) {
  return new Promise((r) => setTimeout(r, ms))
}

async function openDropdown(wrapper) {
  await wrapper.find('.ev-input__wrapper').trigger('click')
  await flush()
}

function nodeEl(label, menuIndex) {
  const menus = document.querySelectorAll('.ev-cascader-menu')
  return [...menus[menuIndex].querySelectorAll('.ev-cascader-node')].find((el) =>
    el.querySelector('.ev-cascader-node__label')?.textContent === label
  )
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('EvCascader 渲染契约', () => {
  it('双 class + 编辑器结构 + placeholder', () => {
    const { wrapper } = mountCascader()
    expect(wrapper.classes()).toContain('ev-cascader')
    expect(wrapper.classes()).toContain('ev-cascader')
    expect(wrapper.find('.ev-input__wrapper').exists()).toBe(true)
    expect(wrapper.find('.ev-cascader__placeholder').text()).toBe('请选择')
  })

  it('打开面板：一级菜单节点 + 下拉类名', async () => {
    const { wrapper } = mountCascader()
    await openDropdown(wrapper)
    expect(document.querySelector('.ev-cascader__dropdown')).toBeTruthy()
    expect(document.querySelector('.ev-cascader-panel')).toBeTruthy()
    expect(document.querySelectorAll('.ev-cascader-menu').length).toBe(1)
    expect(nodeEl('浙江', 0)).toBeTruthy()
    expect(nodeEl('江苏', 0)).toBeTruthy()
  })
})

describe('EvCascader 单选流程', () => {
  it('逐级展开 → 选叶子：emit 路径数组 + 全路径 label + 关闭', async () => {
    const { wrapper, cascader } = mountCascader()
    await openDropdown(wrapper)
    nodeEl('浙江', 0).click()
    await flush()
    expect(document.querySelectorAll('.ev-cascader-menu').length).toBe(2)
    expect(cascader().emitted('expand-change')[0][0]).toEqual([])
    nodeEl('杭州', 1).click()
    await flush()
    expect(document.querySelectorAll('.ev-cascader-menu').length).toBe(3)
    expect(cascader().emitted('expand-change')[1][0]).toEqual(['zhejiang'])
    nodeEl('西湖', 2).click()
    await flush()
    expect(cascader().emitted('update:modelValue')[0][0]).toEqual(['zhejiang', 'hangzhou', 'xihu'])
    expect(wrapper.find('.ev-cascader__label').text()).toBe('浙江 / 杭州 / 西湖')
    expect(document.querySelector('.ev-cascader__dropdown')).toBeNull()
  })

  it('emitPath=false → 只发叶值；showAllLevels=false → 只显示末级', async () => {
    const { wrapper, cascader } = mountCascader({
      props: { emitPath: false }, showAllLevels: false,
    })
    await openDropdown(wrapper)
    nodeEl('浙江', 0).click()
    await flush()
    nodeEl('杭州', 1).click()
    await flush()
    nodeEl('西湖', 2).click()
    await flush()
    expect(cascader().emitted('update:modelValue')[0][0]).toBe('xihu')
    expect(wrapper.find('.ev-cascader__label').text()).toBe('西湖')
  })

  it('checkStrictly：非叶子直接可选', async () => {
    const { wrapper, cascader } = mountCascader({ props: { checkStrictly: true } })
    await openDropdown(wrapper)
    nodeEl('浙江', 0).click()
    await flush()
    expect(cascader().emitted('update:modelValue')[0][0]).toEqual(['zhejiang'])
    expect(wrapper.find('.ev-cascader__label').text()).toBe('浙江')
    // 面板保持打开（严格模式不关闭）
    expect(document.querySelector('.ev-cascader__dropdown')).toBeTruthy()
  })

  it('初始路径值回显 + 打开回放激活路径', async () => {
    const { wrapper } = mountCascader({ modelValue: ['zhejiang', 'hangzhou', 'xihu'] })
    expect(wrapper.find('.ev-cascader__label').text()).toBe('浙江 / 杭州 / 西湖')
    await openDropdown(wrapper)
    expect(document.querySelectorAll('.ev-cascader-menu').length).toBe(3)
    expect(nodeEl('杭州', 1).classList.contains('in-active-path')).toBe(true)
  })

  it('disabled 节点不可选', async () => {
    const disabledOptions = [
      { value: 'a', label: '可用' },
      { value: 'b', label: '禁用', disabled: true },
    ]
    const { wrapper, cascader } = mountCascader({ options: disabledOptions })
    await openDropdown(wrapper)
    nodeEl('禁用', 0).click()
    await flush()
    expect(cascader().emitted('update:modelValue')).toBeUndefined()
    expect(document.querySelector('.ev-cascader__dropdown')).toBeTruthy()
  })

  it('clearable 清空', async () => {
    const { wrapper, cascader } = mountCascader({ modelValue: ['zhejiang', 'ningbo'] })
    await wrapper.find('.ev-cascader__clear').trigger('click')
    await flush()
    expect(cascader().emitted('update:modelValue')[0][0]).toBeNull()
    expect(cascader().emitted('clear')).toBeTruthy()
  })
})

describe('EvCascader 多选', () => {
  it('勾选父级 → 级联全部叶路径；tag 展示', async () => {
    const { wrapper, cascader } = mountCascader({ multiple: true })
    await openDropdown(wrapper)
    const zjNode = nodeEl('浙江', 0)
    zjNode.querySelector('input.ev-checkbox__original').dispatchEvent(new Event('change'))
    await flush()
    expect(cascader().emitted('update:modelValue')[0][0]).toEqual([
      ['zhejiang', 'hangzhou', 'xihu'],
      ['zhejiang', 'hangzhou', 'binjiang'],
      ['zhejiang', 'ningbo'],
    ])
    const tags = wrapper.findAll('.ev-cascader__tag')
    expect(tags.length).toBe(3)
  })

  it('半选父级再点 → 勾选全部后代；全选再点 → 取消', async () => {
    // 江苏：唯一叶子已勾选 → 全选状态，再点取消
    const { wrapper, cascader } = mountCascader({
      multiple: true,
      modelValue: [['jiangsu', 'nanjing']],
    })
    await openDropdown(wrapper)
    const jsNode = nodeEl('江苏', 0)
    jsNode.querySelector('input.ev-checkbox__original').dispatchEvent(new Event('change'))
    await flush()
    expect(cascader().emitted('update:modelValue')[0][0]).toEqual([])
  })

  it('checkStrictly 多选：仅切换该路径', async () => {
    const { wrapper, cascader } = mountCascader({
      multiple: true, props: { checkStrictly: true },
    })
    await openDropdown(wrapper)
    const zjNode = nodeEl('浙江', 0)
    zjNode.querySelector('input.ev-checkbox__original').dispatchEvent(new Event('change'))
    await flush()
    expect(cascader().emitted('update:modelValue')[0][0]).toEqual([['zhejiang']])
  })

  it('removeTag 移除单个叶路径', async () => {
    const { wrapper, cascader } = mountCascader({
      multiple: true,
      modelValue: [['zhejiang', 'ningbo'], ['jiangsu', 'nanjing']],
    })
    const tags = wrapper.findAll('.ev-cascader__tag')
    expect(tags.length).toBe(2)
    await tags[0].find('.ev-tag__close').trigger('click')
    await flush()
    expect(cascader().emitted('update:modelValue')[0][0]).toEqual([['jiangsu', 'nanjing']])
    expect(cascader().emitted('remove-tag')).toBeTruthy()
  })

  it('collapseTags 折叠', () => {
    const { wrapper } = mountCascader({
      multiple: true,
      collapseTags: true,
      modelValue: [['zhejiang', 'ningbo'], ['jiangsu', 'nanjing']],
    })
    expect(wrapper.findAll('.ev-cascader__tag').length).toBe(1)
    expect(wrapper.find('.ev-select__tags-collapse-item').text()).toBe('+ 1')
  })
})

describe('EvCascader 过滤', () => {
  it('输入关键字 → 建议面板；点击建议选中', async () => {
    const { wrapper, cascader } = mountCascader({ filterable: true })
    await openDropdown(wrapper)
    await wrapper.find('.ev-cascader__input').setValue('西湖')
    await flush()
    const items = [...document.querySelectorAll('.ev-cascader__suggestion-item')]
    expect(items.length).toBe(1)
    expect(items[0].textContent).toBe('浙江 / 杭州 / 西湖')
    items[0].click()
    await flush()
    expect(cascader().emitted('update:modelValue')[0][0]).toEqual(['zhejiang', 'hangzhou', 'xihu'])
    expect(document.querySelector('.ev-cascader__dropdown')).toBeNull()
  })

  it('无匹配建议显示空态', async () => {
    const { wrapper } = mountCascader({ filterable: true })
    await openDropdown(wrapper)
    await wrapper.find('.ev-cascader__input').setValue('不存在')
    await flush()
    const empty = document.querySelector('.ev-cascader__suggestion-item.is-empty')
    expect(empty?.textContent).toBe('无匹配数据')
  })

  it('disabled 不可打开', async () => {
    const { wrapper } = mountCascader({ disabled: true })
    await wrapper.find('.ev-input__wrapper').trigger('click')
    await flush()
    expect(document.querySelector('.ev-cascader__dropdown')).toBeNull()
  })
})
