import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import EvTree from '../src/components/tree/index.vue'

const treeData = [
  {
    id: 1, label: '一级 1',
    children: [
      { id: 11, label: '二级 1-1', children: [{ id: 111, label: '三级 1-1-1' }] },
      { id: 12, label: '二级 1-2' },
    ],
  },
  {
    id: 2, label: '一级 2',
    children: [{ id: 21, label: '二级 2-1' }],
  },
]

function mountTree(props = {}, slots = {}) {
  return mount(EvTree, {
    props: { data: treeData, nodeKey: 'id', ...props },
    slots,
  })
}

/** 按 label 定位节点（DOM DFS 顺序，父节点首个 label 即自身） */
function findNodeByLabel(wrapper, label) {
  return wrapper.findAll('.ev-tree-node').find((n) =>
    n.find('.ev-tree-node__label').text() === label
  )
}

/** jsdom 的 getComputedStyle 不随 v-show 重算，直接断言 inline display */
function displayOf(domWrapper) {
  return domWrapper.element.style.display
}

function checkboxOf(wrapper, label) {
  return findNodeByLabel(wrapper, label).find('input.ev-checkbox__original')
}

describe('EvTree 渲染契约', () => {
  it('双 class + 结构 DOM（node/content/expand-icon/label/children）', () => {
    const wrapper = mountTree()
    expect(wrapper.classes()).toContain('ev-tree')
    expect(wrapper.classes()).toContain('ev-tree')
    expect(wrapper.find('.ev-tree-node').exists()).toBe(true)
    expect(wrapper.find('.ev-tree-node__content').exists()).toBe(true)
    expect(wrapper.find('.ev-tree-node__expand-icon').exists()).toBe(true)
    expect(wrapper.find('.ev-tree-node__label').exists()).toBe(true)
    expect(wrapper.find('.ev-tree-node__children').exists()).toBe(true)
  })

  it('全部节点渲染（含未展开的隐藏节点）+ level/indent 缩进', () => {
    const wrapper = mountTree({ defaultExpandAll: true })
    expect(wrapper.findAll('.ev-tree-node').length).toBe(6)
    // 三级节点缩进 = (3-1) * 16
    const deep = findNodeByLabel(wrapper, '三级 1-1-1')
    expect(deep.find('.ev-tree-node__content').element.style.paddingLeft).toBe('32px')
    // 根节点无缩进
    const root = findNodeByLabel(wrapper, '一级 1')
    expect(root.find('.ev-tree-node__content').element.style.paddingLeft).toBe('0px')
  })

  it('叶子节点 expand-icon 带 is-leaf', () => {
    const wrapper = mountTree()
    const leaf = findNodeByLabel(wrapper, '三级 1-1-1')
    expect(leaf.find('.ev-tree-node__expand-icon').classes()).toContain('is-leaf')
  })

  it('空数据渲染 empty-block', () => {
    const wrapper = mountTree()
    wrapper.setProps({ data: [] })
    return new Promise((r) => setTimeout(r, 10)).then(() => {
      expect(wrapper.find('.ev-tree__empty-block').exists()).toBe(true)
      expect(wrapper.find('.ev-tree__empty-text').text()).toBe('暂无数据')
    })
  })

  it('scoped slot 暴露 node（含 data 别名/level）与 data', () => {
    const wrapper = mountTree(
      { defaultExpandAll: true },
      { default: ({ node, data }) => h('span', { class: 'custom-label' }, `${node.level}:${data.label}:${node.data.id}`) }
    )
    const texts = wrapper.findAll('.custom-label').map((n) => n.text())
    expect(texts).toContain('1:一级 1:1')
    expect(texts).toContain('3:三级 1-1-1:111')
  })
})

describe('EvTree 展开交互', () => {
  it('默认收起：子级 v-show 隐藏；点击展开 + node-expand 事件', async () => {
    const wrapper = mountTree()
    const root = findNodeByLabel(wrapper, '一级 1')
    expect(root.classes()).not.toContain('is-expanded')
    expect(displayOf(root.find('.ev-tree-node__children'))).toBe('none')

    await root.find('.ev-tree-node__content').trigger('click')
    expect(root.classes()).toContain('is-expanded')
    expect(displayOf(root.find('.ev-tree-node__children'))).toBe('')
    expect(wrapper.emitted('node-expand')[0][0]).toMatchObject({ id: 1 })

    await root.find('.ev-tree-node__content').trigger('click')
    expect(root.classes()).not.toContain('is-expanded')
    expect(wrapper.emitted('node-collapse')[0][0]).toMatchObject({ id: 1 })
  })

  it('点击箭头图标独立展开（expand-on-click-node=false 时内容点击不展开）', async () => {
    const wrapper = mountTree({ expandOnClickNode: false })
    const root = findNodeByLabel(wrapper, '一级 1')
    await root.find('.ev-tree-node__content').trigger('click')
    expect(root.classes()).not.toContain('is-expanded')
    await root.find('.ev-tree-node__expand-icon').trigger('click')
    expect(root.classes()).toContain('is-expanded')
  })

  it('defaultExpandedKeys 初始展开', () => {
    const wrapper = mountTree({ defaultExpandedKeys: [1] })
    expect(findNodeByLabel(wrapper, '一级 1').classes()).toContain('is-expanded')
  })

  it('accordion 手风琴：同级展开互斥', async () => {
    const wrapper = mountTree({ accordion: true })
    const n1 = findNodeByLabel(wrapper, '一级 1')
    const n2 = findNodeByLabel(wrapper, '一级 2')
    await n1.find('.ev-tree-node__content').trigger('click')
    expect(n1.classes()).toContain('is-expanded')
    await n2.find('.ev-tree-node__content').trigger('click')
    expect(n2.classes()).toContain('is-expanded')
    expect(n1.classes()).not.toContain('is-expanded')
  })
})

describe('EvTree 复选级联', () => {
  it('勾选父级 → 全部后代勾选；check 事件携带 checkedKeys', async () => {
    const wrapper = mountTree({ showCheckbox: true })
    await checkboxOf(wrapper, '一级 1').trigger('change')
    expect(wrapper.vm.getCheckedKeys().sort((a, b) => a - b)).toEqual([1, 11, 12, 111])
    const checkEvt = wrapper.emitted('check')[0][1]
    expect(checkEvt.checkedKeys.length).toBe(4)
    expect(checkEvt.checkedNodes.map((n) => n.id).sort((a, b) => a - b)).toEqual([1, 11, 12, 111])
  })

  it('取消部分子级 → 父级变半选（halfCheckedKeys）', async () => {
    const wrapper = mountTree({ showCheckbox: true })
    await checkboxOf(wrapper, '一级 1').trigger('change')
    await checkboxOf(wrapper, '二级 1-2').trigger('change')
    expect(wrapper.vm.getCheckedKeys().sort((a, b) => a - b)).toEqual([11, 111])
    expect(wrapper.vm.getHalfCheckedKeys()).toEqual([1])
    expect(findNodeByLabel(wrapper, '一级 1').find('.ev-checkbox').classes()).toContain('is-indeterminate')
  })

  it('check-change 事件与 checkOnClickNode', async () => {
    const wrapper = mountTree({ showCheckbox: true, checkOnClickNode: true })
    await findNodeByLabel(wrapper, '一级 2').find('.ev-tree-node__content').trigger('click')
    expect(wrapper.vm.getCheckedKeys().sort((a, b) => a - b)).toEqual([2, 21])
    expect(wrapper.emitted('check-change')[0]).toMatchObject([{ id: 2 }, true])
  })

  it('checkStrictly 严格模式不级联', async () => {
    const wrapper = mountTree({ showCheckbox: true, checkStrictly: true })
    await checkboxOf(wrapper, '一级 1').trigger('change')
    expect(wrapper.vm.getCheckedKeys()).toEqual([1])
    expect(wrapper.vm.getHalfCheckedKeys()).toEqual([])
  })

  it('defaultCheckedKeys 初始勾选并级联', () => {
    const wrapper = mountTree({ showCheckbox: true, defaultCheckedKeys: [11] })
    expect(wrapper.vm.getCheckedKeys().sort((a, b) => a - b)).toEqual([11, 111])
    expect(wrapper.vm.getHalfCheckedKeys()).toEqual([1])
  })

  it('disabled 节点不可勾选', async () => {
    const disabledData = [
      { id: 1, label: '禁用项', disabled: true },
      { id: 2, label: '可用项' },
    ]
    const wrapper = mount(EvTree, {
      props: { data: disabledData, nodeKey: 'id', showCheckbox: true },
    })
    const dis = findNodeByLabel(wrapper, '禁用项')
    expect(dis.classes()).toContain('is-disabled')
    await dis.find('input.ev-checkbox__original').trigger('change')
    expect(wrapper.vm.getCheckedKeys()).toEqual([])
  })
})

describe('EvTree 过滤', () => {
  it('filter 命中节点保留祖先链，未命中隐藏；过滤态自动展开', async () => {
    const wrapper = mountTree({
      filterNodeMethod: (value, data) => data.label.includes(value),
    })
    wrapper.vm.filter('三级')
    await new Promise((r) => setTimeout(r, 10))
    const labels = wrapper.findAll('.ev-tree-node__label').map((n) => n.text())
    expect(labels).toContain('三级 1-1-1')
    expect(labels).toContain('一级 1')
    expect(labels).toContain('二级 1-1')
    expect(labels).not.toContain('一级 2')
    expect(labels).not.toContain('二级 1-2')
    // 未展开节点在过滤态可见（子级容器 display 置空）
    expect(displayOf(findNodeByLabel(wrapper, '一级 1').find('.ev-tree-node__children'))).toBe('')
  })

  it('无匹配时显示空态', async () => {
    const wrapper = mountTree({
      filterNodeMethod: (value, data) => data.label.includes(value),
    })
    wrapper.vm.filter('不存在')
    await new Promise((r) => setTimeout(r, 10))
    expect(wrapper.find('.ev-tree__empty-block').exists()).toBe(true)
  })
})

describe('EvTree 高亮当前节点', () => {
  it('点击节点 is-current + current-change', async () => {
    const wrapper = mountTree({ highlightCurrent: true })
    const n2 = findNodeByLabel(wrapper, '一级 2')
    await n2.find('.ev-tree-node__content').trigger('click')
    expect(n2.classes()).toContain('is-current')
    expect(wrapper.vm.getCurrentKey()).toBe(2)
    expect(wrapper.vm.getCurrentNode().data.id).toBe(2)
    expect(wrapper.emitted('current-change')[0][0]).toMatchObject({ id: 2 })
    expect(wrapper.emitted('node-click')[0][0]).toMatchObject({ id: 2 })
  })

  it('setCurrentKey 程序化切换', async () => {
    const wrapper = mountTree({ highlightCurrent: true })
    wrapper.vm.setCurrentKey(2)
    await new Promise((r) => setTimeout(r, 10))
    expect(findNodeByLabel(wrapper, '一级 2').classes()).toContain('is-current')
  })
})

describe('EvTree expose API', () => {
  it('getNode 返回节点（data 别名/level/isLeaf）', () => {
    const wrapper = mountTree()
    const node = wrapper.vm.getNode(11)
    expect(node.data.label).toBe('二级 1-1')
    expect(node.raw.label).toBe('二级 1-1')
    expect(node.level).toBe(2)
    expect(node.isLeaf).toBe(false)
    expect(wrapper.vm.getNode(999)).toBeNull()
  })

  it('setCheckedKeys / setChecked / getCheckedNodes(leafOnly)', async () => {
    const wrapper = mountTree({ showCheckbox: true })
    wrapper.vm.setCheckedKeys([21])
    await new Promise((r) => setTimeout(r, 10))
    // 非严格模式：唯一子级勾选 → 父级（2）自动全选
    expect(wrapper.vm.getCheckedKeys()).toEqual([21, 2])
    expect(wrapper.vm.getHalfCheckedKeys()).toEqual([])
    expect(wrapper.vm.getCheckedNodes().map((n) => n.id).sort((a, b) => a - b)).toEqual([2, 21])

    wrapper.vm.setChecked(1, true)
    await new Promise((r) => setTimeout(r, 10))
    expect(wrapper.vm.getCheckedKeys().sort((a, b) => a - b)).toEqual([1, 2, 11, 12, 21, 111])
    // leafOnly 只返回叶子
    expect(wrapper.vm.getCheckedKeys(true).sort((a, b) => a - b)).toEqual([12, 21, 111])
    expect(wrapper.vm.getCheckedNodes(true).map((n) => n.id).sort((a, b) => a - b)).toEqual([12, 21, 111])

    wrapper.vm.setChecked(1, false)
    await new Promise((r) => setTimeout(r, 10))
    expect(wrapper.vm.getCheckedKeys()).toEqual([21, 2])
  })
})

describe('EvTree lazy 加载', () => {
  function mountLazy(load) {
    return mount(EvTree, {
      props: { lazy: true, load, nodeKey: 'id', data: [] },
    })
  }

  it('挂载时加载根级（虚拟根 level 0 / data null）', async () => {
    const loadCalls = []
    const wrapper = mountLazy((node, resolve) => {
      loadCalls.push({ level: node.level, data: node.data })
      resolve([
        { id: 1, label: 'lazy-1', isLeaf: false },
        { id: 2, label: 'lazy-2', isLeaf: true },
      ])
    })
    await new Promise((r) => setTimeout(r, 10))
    expect(loadCalls[0].level).toBe(0)
    expect(loadCalls[0].data).toBeNull()
    const labels = wrapper.findAll('.ev-tree-node__label').map((n) => n.text())
    expect(labels).toEqual(['lazy-1', 'lazy-2'])
  })

  it('展开未加载节点触发 load，resolve 后渲染子级', async () => {
    const wrapper = mountLazy((node, resolve) => {
      if (node.level === 0) {
        resolve([{ id: 1, label: 'lazy-1', isLeaf: false }])
      } else {
        resolve([{ id: 11, label: 'lazy-1-1', isLeaf: true }])
      }
    })
    await new Promise((r) => setTimeout(r, 10))
    const n1 = findNodeByLabel(wrapper, 'lazy-1')
    expect(n1.find('.ev-tree-node__expand-icon').classes()).not.toContain('is-leaf')
    await n1.find('.ev-tree-node__expand-icon').trigger('click')
    await new Promise((r) => setTimeout(r, 10))
    expect(findNodeByLabel(wrapper, 'lazy-1-1')).toBeTruthy()
    expect(n1.classes()).toContain('is-expanded')
  })

  it('isLeaf 标记的节点不触发 load、不可展开', async () => {
    const loadSpy = vi.fn((node, resolve) => {
      resolve([{ id: 1, label: 'lazy-1', isLeaf: true }])
    })
    const wrapper = mountLazy(loadSpy)
    await new Promise((r) => setTimeout(r, 10))
    const n1 = findNodeByLabel(wrapper, 'lazy-1')
    expect(n1.find('.ev-tree-node__expand-icon').classes()).toContain('is-leaf')
    await n1.find('.ev-tree-node__content').trigger('click')
    await new Promise((r) => setTimeout(r, 10))
    expect(loadSpy).toHaveBeenCalledTimes(1) // 仅根级一次
  })
})
