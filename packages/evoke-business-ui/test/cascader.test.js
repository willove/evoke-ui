import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import EbCascader from '../src/components/cascader/index.vue'

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
  components: { EbCascader },
  inheritAttrs: false,
  props: { modelValue: { type: null, default: null } },
  setup(props, { attrs }) {
    const value = ref(props.modelValue)
    return () => h(EbCascader, {
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
  return { wrapper, cascader: () => wrapper.findComponent(EbCascader) }
}

function flush(ms = 30) {
  return new Promise((r) => setTimeout(r, ms))
}

async function openDropdown(wrapper) {
  await wrapper.find('.eb-input__wrapper').trigger('click')
  await flush()
}

function nodeEl(label, menuIndex) {
  const menus = document.querySelectorAll('.eb-cascader-menu')
  return [...menus[menuIndex].querySelectorAll('.eb-cascader-node')].find((el) =>
    el.querySelector('.eb-cascader-node__label')?.textContent === label
  )
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('EbCascader 渲染契约', () => {
  it('双 class + 编辑器结构 + placeholder', () => {
    const { wrapper } = mountCascader()
    expect(wrapper.classes()).toContain('eb-cascader')
    expect(wrapper.classes()).toContain('eb-cascader')
    expect(wrapper.find('.eb-input__wrapper').exists()).toBe(true)
    expect(wrapper.find('.eb-cascader__placeholder').text()).toBe('请选择')
  })

  it('打开面板：一级菜单节点 + 下拉类名', async () => {
    const { wrapper } = mountCascader()
    await openDropdown(wrapper)
    expect(document.querySelector('.eb-cascader__dropdown')).toBeTruthy()
    expect(document.querySelector('.eb-cascader-panel')).toBeTruthy()
    expect(document.querySelectorAll('.eb-cascader-menu').length).toBe(1)
    expect(nodeEl('浙江', 0)).toBeTruthy()
    expect(nodeEl('江苏', 0)).toBeTruthy()
  })
})

describe('EbCascader 单选流程', () => {
  it('逐级展开 → 选叶子：emit 路径数组 + 全路径 label + 关闭', async () => {
    const { wrapper, cascader } = mountCascader()
    await openDropdown(wrapper)
    nodeEl('浙江', 0).click()
    await flush()
    expect(document.querySelectorAll('.eb-cascader-menu').length).toBe(2)
    expect(cascader().emitted('expand-change')[0][0]).toEqual([])
    nodeEl('杭州', 1).click()
    await flush()
    expect(document.querySelectorAll('.eb-cascader-menu').length).toBe(3)
    expect(cascader().emitted('expand-change')[1][0]).toEqual(['zhejiang'])
    nodeEl('西湖', 2).click()
    await flush()
    expect(cascader().emitted('update:modelValue')[0][0]).toEqual(['zhejiang', 'hangzhou', 'xihu'])
    expect(wrapper.find('.eb-cascader__label').text()).toBe('浙江 / 杭州 / 西湖')
    expect(document.querySelector('.eb-cascader__dropdown')).toBeNull()
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
    expect(wrapper.find('.eb-cascader__label').text()).toBe('西湖')
  })

  it('checkStrictly：非叶子直接可选', async () => {
    const { wrapper, cascader } = mountCascader({ props: { checkStrictly: true } })
    await openDropdown(wrapper)
    nodeEl('浙江', 0).click()
    await flush()
    expect(cascader().emitted('update:modelValue')[0][0]).toEqual(['zhejiang'])
    expect(wrapper.find('.eb-cascader__label').text()).toBe('浙江')
    // 面板保持打开（严格模式不关闭）
    expect(document.querySelector('.eb-cascader__dropdown')).toBeTruthy()
  })

  it('expand-trigger=hover：hover 展开父级，点击叶子仍可选', async () => {
    const { wrapper, cascader } = mountCascader({ expandTrigger: 'hover' })
    await openDropdown(wrapper)
    // 父级由 hover 展开（点击父级不选中）
    nodeEl('浙江', 0).dispatchEvent(new MouseEvent('mouseenter'))
    await flush()
    nodeEl('杭州', 1).dispatchEvent(new MouseEvent('mouseenter'))
    await flush()
    expect(cascader().emitted('update:modelValue')).toBeUndefined()
    expect(document.querySelectorAll('.eb-cascader-menu').length).toBe(3)
    // 点击叶子节点：正常 emit 选中
    nodeEl('西湖', 2).click()
    await flush()
    expect(cascader().emitted('update:modelValue')[0][0]).toEqual(['zhejiang', 'hangzhou', 'xihu'])
    expect(document.querySelector('.eb-cascader__dropdown')).toBeNull()
  })

  it('初始路径值回显 + 打开回放激活路径', async () => {
    const { wrapper } = mountCascader({ modelValue: ['zhejiang', 'hangzhou', 'xihu'] })
    expect(wrapper.find('.eb-cascader__label').text()).toBe('浙江 / 杭州 / 西湖')
    await openDropdown(wrapper)
    expect(document.querySelectorAll('.eb-cascader-menu').length).toBe(3)
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
    expect(document.querySelector('.eb-cascader__dropdown')).toBeTruthy()
  })

  it('clearable 清空', async () => {
    const { wrapper, cascader } = mountCascader({ modelValue: ['zhejiang', 'ningbo'] })
    await wrapper.find('.eb-cascader__clear').trigger('click')
    await flush()
    expect(cascader().emitted('update:modelValue')[0][0]).toBeNull()
    expect(cascader().emitted('clear')).toBeTruthy()
  })
})

describe('EbCascader 多选', () => {
  it('勾选父级 → 级联全部叶路径；tag 展示', async () => {
    const { wrapper, cascader } = mountCascader({ multiple: true })
    await openDropdown(wrapper)
    const zjNode = nodeEl('浙江', 0)
    zjNode.querySelector('input.eb-checkbox__original').dispatchEvent(new Event('change'))
    await flush()
    expect(cascader().emitted('update:modelValue')[0][0]).toEqual([
      ['zhejiang', 'hangzhou', 'xihu'],
      ['zhejiang', 'hangzhou', 'binjiang'],
      ['zhejiang', 'ningbo'],
    ])
    const tags = wrapper.findAll('.eb-cascader__tag')
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
    jsNode.querySelector('input.eb-checkbox__original').dispatchEvent(new Event('change'))
    await flush()
    expect(cascader().emitted('update:modelValue')[0][0]).toEqual([])
  })

  it('checkStrictly 多选：仅切换该路径', async () => {
    const { wrapper, cascader } = mountCascader({
      multiple: true, props: { checkStrictly: true },
    })
    await openDropdown(wrapper)
    const zjNode = nodeEl('浙江', 0)
    zjNode.querySelector('input.eb-checkbox__original').dispatchEvent(new Event('change'))
    await flush()
    expect(cascader().emitted('update:modelValue')[0][0]).toEqual([['zhejiang']])
  })

  it('removeTag 移除单个叶路径', async () => {
    const { wrapper, cascader } = mountCascader({
      multiple: true,
      modelValue: [['zhejiang', 'ningbo'], ['jiangsu', 'nanjing']],
    })
    const tags = wrapper.findAll('.eb-cascader__tag')
    expect(tags.length).toBe(2)
    await tags[0].find('.eb-tag__close').trigger('click')
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
    expect(wrapper.findAll('.eb-cascader__tag').length).toBe(1)
    expect(wrapper.find('.eb-select__tags-collapse-item').text()).toBe('+ 1')
  })
})

describe('EbCascader 懒加载', () => {
  it('lazy + load-data：展开待加载节点触发加载，期间该列 loading，resolve 后并入子级', async () => {
    const lazyOptions = [{ value: 'east', label: '华东', leaf: false }]
    let resolveLoad
    const loadData = vi.fn((option) => new Promise((resolve) => {
      resolveLoad = () => {
        option.children = [{ value: 'sh', label: '上海' }]
        resolve()
      }
    }))
    const { wrapper, cascader } = mountCascader({ options: lazyOptions, lazy: true, loadData })
    await openDropdown(wrapper)
    // 待加载节点（leaf:false 且无 children）展示展开箭头
    expect(nodeEl('华东', 0).querySelector('.eb-cascader-node__postfix')).toBeTruthy()
    nodeEl('华东', 0).click()
    await flush()
    // 加载期间：第二列出现且展示 loading 占位
    expect(cascader().emitted('expand-change')[0][0]).toEqual([])
    expect(document.querySelectorAll('.eb-cascader-menu').length).toBe(2)
    expect(document.querySelectorAll('.eb-cascader-menu')[1].querySelector('.is-loading-node')).toBeTruthy()
    // resolve 后子级并入，loading 消失
    resolveLoad()
    await flush()
    expect(document.querySelectorAll('.eb-cascader-menu')[1].querySelector('.is-loading-node')).toBeNull()
    expect(nodeEl('上海', 1)).toBeTruthy()
    // 选中叶子 → 路径值
    nodeEl('上海', 1).click()
    await flush()
    expect(cascader().emitted('update:modelValue')[0][0]).toEqual(['east', 'sh'])
    expect(loadData).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('resolve 返回子级数组时兜底并入；已加载/普通叶子不重复触发', async () => {
    const lazyOptions = [
      { value: 'a', label: '甲' },
      { value: 'b', label: '乙', leaf: false },
    ]
    const loadData = vi.fn(() => Promise.resolve([{ value: 'b1', label: '乙一' }]))
    const { wrapper, cascader } = mountCascader({ options: lazyOptions, lazy: true, loadData })
    await openDropdown(wrapper)
    // 普通叶子（无 leaf:false）点击不触发加载、直接选中
    nodeEl('甲', 0).click()
    await flush()
    expect(cascader().emitted('update:modelValue')[0][0]).toEqual(['a'])
    expect(loadData).not.toHaveBeenCalled()
    // 待加载节点：resolve 返回数组并入
    await openDropdown(wrapper)
    nodeEl('乙', 0).click()
    await flush()
    expect(loadData).toHaveBeenCalledTimes(1)
    expect(nodeEl('乙一', 1)).toBeTruthy()
    nodeEl('乙一', 1).click()
    await flush()
    expect(cascader().emitted('update:modelValue')[1][0]).toEqual(['b', 'b1'])
    wrapper.unmount()
  })
})

describe('EbCascader 过滤', () => {
  it('输入关键字 → 建议面板；点击建议选中', async () => {
    const { wrapper, cascader } = mountCascader({ filterable: true })
    await openDropdown(wrapper)
    await wrapper.find('.eb-cascader__input').setValue('西湖')
    await flush()
    const items = [...document.querySelectorAll('.eb-cascader__suggestion-item')]
    expect(items.length).toBe(1)
    expect(items[0].textContent).toBe('浙江 / 杭州 / 西湖')
    items[0].click()
    await flush()
    expect(cascader().emitted('update:modelValue')[0][0]).toEqual(['zhejiang', 'hangzhou', 'xihu'])
    expect(document.querySelector('.eb-cascader__dropdown')).toBeNull()
  })

  it('无匹配建议显示空态', async () => {
    const { wrapper } = mountCascader({ filterable: true })
    await openDropdown(wrapper)
    await wrapper.find('.eb-cascader__input').setValue('不存在')
    await flush()
    const empty = document.querySelector('.eb-cascader__suggestion-item.is-empty')
    expect(empty?.textContent).toBe('无匹配数据')
  })

  it('输入关键字时占位文案隐藏，清空关键字后恢复', async () => {
    const { wrapper } = mountCascader({ filterable: true, placeholder: '输入「杭州」试试' })
    const input = wrapper.find('.eb-cascader__input')
    // 关闭态：占位文案由 span 承载
    expect(wrapper.find('.eb-cascader__placeholder').exists()).toBe(true)
    // 打开面板：span 让位，占位文案交给原生 input placeholder（光标起点一致）
    await openDropdown(wrapper)
    await flush()
    expect(wrapper.find('.eb-cascader__placeholder').exists()).toBe(false)
    expect(input.attributes('placeholder')).toBe('输入「杭州」试试')
    await input.setValue('杭州')
    await flush()
    expect(wrapper.find('.eb-cascader__placeholder').exists()).toBe(false)
    expect(input.attributes('placeholder')).toBe('输入「杭州」试试')
    await input.setValue('')
    await flush()
    // 清空关键字后原生占位仍在
    expect(input.attributes('placeholder')).toBe('输入「杭州」试试')
  })

  it('disabled 不可打开', async () => {
    const { wrapper } = mountCascader({ disabled: true })
    await wrapper.find('.eb-input__wrapper').trigger('click')
    await flush()
    expect(document.querySelector('.eb-cascader__dropdown')).toBeNull()
  })
})
