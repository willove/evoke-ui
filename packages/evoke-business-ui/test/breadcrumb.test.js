import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EbBreadcrumb from '../src/components/breadcrumb/index.vue'
import EbBreadcrumbItem from '../src/components/breadcrumb/item.vue'
import EbLink from '../src/components/link/index.vue'
import EbText from '../src/components/text/index.vue'
import EbCollapse from '../src/components/collapse/index.vue'
import EbCollapseItem from '../src/components/collapse/item.vue'
import EbDescriptions from '../src/components/descriptions/index.vue'
import EbDescriptionsItem from '../src/components/descriptions/item.vue'
import EbSteps from '../src/components/steps/index.vue'
import EbStep from '../src/components/steps/item.vue'

describe('EbBreadcrumb', () => {
  it('双 class + aria 标签', () => {
    const wrapper = mount(EbBreadcrumb)
    expect(wrapper.classes()).toContain('eb-breadcrumb')
    expect(wrapper.classes()).toContain('eb-breadcrumb')
    expect(wrapper.attributes('aria-label')).toBe('Breadcrumb')
  })

  it('插槽子项：非最后一项渲染分隔符，最后一项不渲染', async () => {
    const wrapper = mount({
      components: { EbBreadcrumb, EbBreadcrumbItem },
      template: `
        <eb-breadcrumb>
          <eb-breadcrumb-item>首页</eb-breadcrumb-item>
          <eb-breadcrumb-item to="/list">列表</eb-breadcrumb-item>
          <eb-breadcrumb-item>详情</eb-breadcrumb-item>
        </eb-breadcrumb>
      `,
    })
    await wrapper.vm.$nextTick()
    const items = wrapper.findAll('.eb-breadcrumb__item')
    expect(items).toHaveLength(3)
    const separators = wrapper.findAll('.eb-breadcrumb__separator')
    expect(separators).toHaveLength(2)
    expect(separators[0].text()).toBe('/')
    expect(items[1].find('.eb-breadcrumb__inner').classes()).toContain('is-link')
  })

  it('items 配置数组渲染', async () => {
    const wrapper = mount(EbBreadcrumb, {
      props: {
        items: [
          { label: '首页' },
          { label: '列表', to: '/list' },
        ],
      },
    })
    await wrapper.vm.$nextTick()
    const inners = wrapper.findAll('.eb-breadcrumb__inner')
    expect(inners).toHaveLength(2)
    expect(inners[0].text()).toContain('首页')
    expect(inners[1].classes()).toContain('is-link')
  })

  it('separator 自定义', async () => {
    const wrapper = mount({
      components: { EbBreadcrumb, EbBreadcrumbItem },
      template: `
        <eb-breadcrumb separator="-">
          <eb-breadcrumb-item>a</eb-breadcrumb-item>
          <eb-breadcrumb-item>b</eb-breadcrumb-item>
        </eb-breadcrumb>
      `,
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.eb-breadcrumb__separator').text()).toBe('-')
  })

  it('to + 无 router：http 链接降级不抛错，无 to 点击无效', async () => {
    const wrapper = mount(EbBreadcrumbItem)
    await wrapper.find('.eb-breadcrumb__inner').trigger('click')
    expect(wrapper.find('.eb-breadcrumb__inner').classes()).not.toContain('is-link')
  })
})

describe('EbLink', () => {
  it('双 class + type 修饰类', () => {
    const wrapper = mount(EbLink, { slots: { default: '链接' } })
    expect(wrapper.classes()).toContain('eb-link')
    expect(wrapper.classes()).toContain('eb-link')
    expect(wrapper.classes()).toContain('eb-link--default')
    expect(wrapper.text()).toBe('链接')
    expect(mount(EbLink, { props: { type: 'primary' } }).classes()).toContain('eb-link--primary')
    expect(mount(EbLink, { props: { type: 'error' } }).classes()).toContain('eb-link--danger')
  })

  it('underline 默认 always，布尔入参映射新语义', () => {
    expect(mount(EbLink).classes()).toContain('is-underline')
    expect(mount(EbLink, { props: { underline: true } }).classes()).toContain('is-underline')
    expect(mount(EbLink, { props: { underline: false } }).classes()).not.toContain('is-underline')
    expect(mount(EbLink, { props: { underline: 'never' } }).classes()).not.toContain('is-underline')
  })

  it('disabled 阻止点击且不触发 click', async () => {
    const wrapper = mount(EbLink, { props: { disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
    expect(wrapper.classes()).toContain('is-disabled')
  })

  it('href/target 透传 + click 事件', async () => {
    const wrapper = mount(EbLink, { props: { href: 'https://example.com', target: '_blank' }, slots: { default: 'x' } })
    expect(wrapper.attributes('href')).toBe('https://example.com')
    expect(wrapper.attributes('target')).toBe('_blank')
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('安全回归：target="_blank" 自动补 rel="noopener noreferrer"', () => {
    const blank = mount(EbLink, { props: { href: 'https://example.com', target: '_blank' } })
    expect(blank.attributes('rel')).toBe('noopener noreferrer')
    // 非 _blank 与禁用态不注入 rel
    expect(mount(EbLink, { props: { href: '/a' } }).attributes('rel')).toBeUndefined()
    expect(mount(EbLink, { props: { href: 'https://example.com', target: '_blank', disabled: true } }).attributes('rel')).toBeUndefined()
  })

  it('icon 渲染', () => {
    const wrapper = mount(EbLink, { props: { icon: 'search' } })
    expect(wrapper.find('.eb-icon, .eb-iconfont').exists()).toBe(true)
  })

  it('原生 a 标签语义', () => {
    expect(mount(EbLink).element.tagName).toBe('A')
  })
})

describe('EbText', () => {
  it('双 class + 默认 tag span', () => {
    const wrapper = mount(EbText, { slots: { default: '文本' } })
    expect(wrapper.classes()).toContain('eb-text')
    expect(wrapper.classes()).toContain('eb-text')
    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.text()).toBe('文本')
  })

  it('type/size/truncated/tag', () => {
    const wrapper = mount(EbText, { props: { type: 'primary', size: 'large', truncated: true, tag: 'p' } })
    expect(wrapper.classes()).toContain('eb-text--primary')
    expect(wrapper.classes()).toContain('eb-text--large')
    expect(wrapper.classes()).toContain('is-truncated')
    expect(wrapper.element.tagName).toBe('P')
  })

  it('error 映射为 danger（语义对齐）', () => {
    expect(mount(EbText, { props: { type: 'error' } }).classes()).toContain('eb-text--danger')
  })
})

describe('EbCollapse', () => {
  const mountCollapse = (props = {}) =>
    mount({
      components: { EbCollapse, EbCollapseItem },
      template: `
        <eb-collapse v-bind="props">
          <eb-collapse-item title="A" name="a">内容A</eb-collapse-item>
          <eb-collapse-item title="B" name="b">内容B</eb-collapse-item>
        </eb-collapse>
      `,
      setup() {
        return { props }
      },
    })

  it('双 class + 结构类', () => {
    const wrapper = mountCollapse()
    expect(wrapper.find('.eb-collapse').classes()).toContain('eb-collapse')
    expect(wrapper.findAll('.eb-collapse-item')).toHaveLength(2)
    expect(wrapper.findAll('.eb-collapse-item__header')).toHaveLength(2)
    expect(wrapper.find('.eb-collapse-item__content').exists()).toBe(true)
  })

  it('默认全收起；点击展开并 emit update:modelValue/change', async () => {
    const wrapper = mountCollapse()
    expect(wrapper.find('.eb-collapse-item.is-active').exists()).toBe(false)
    await wrapper.findAll('.eb-collapse-item__header')[0].trigger('click')
    expect(wrapper.findComponent(EbCollapse).emitted('update:modelValue')).toEqual([[['a']]])
    expect(wrapper.findComponent(EbCollapse).emitted('change')).toEqual([[['a']]])
    // 受控前本地状态已生效（非受控用法）
    expect(wrapper.find('.eb-collapse-item.is-active').exists()).toBe(true)
  })

  it('aria-expanded 与按钮语义', () => {
    const header = mountCollapse().findAll('.eb-collapse-item__header')[0]
    expect(header.element.tagName).toBe('BUTTON')
    expect(header.attributes('aria-expanded')).toBe('false')
  })

  it('受控 modelValue 初始化展开', () => {
    const wrapper = mountCollapse({ modelValue: ['b'] })
    const active = wrapper.findAll('.eb-collapse-item')
    expect(active[1].classes()).toContain('is-active')
    expect(active[0].classes()).not.toContain('is-active')
  })

  it('accordion 模式互斥且 payload 为单值', async () => {
    const wrapper = mountCollapse({ accordion: true })
    const headers = wrapper.findAll('.eb-collapse-item__header')
    await headers[0].trigger('click')
    expect(wrapper.findComponent(EbCollapse).emitted('update:modelValue')).toEqual([['a']])
    await headers[1].trigger('click')
    expect(wrapper.findComponent(EbCollapse).emitted('update:modelValue')).toEqual([['a'], ['b']])
    const active = wrapper.findAll('.eb-collapse-item.is-active')
    expect(active).toHaveLength(1)
  })

  it('disabled 项点击无效', async () => {
    const wrapper = mount({
      components: { EbCollapse, EbCollapseItem },
      template: `
        <eb-collapse>
          <eb-collapse-item title="A" name="a" disabled>内容A</eb-collapse-item>
        </eb-collapse>
      `,
    })
    await wrapper.find('.eb-collapse-item__header').trigger('click')
    expect(wrapper.findComponent(EbCollapse).emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.find('.eb-collapse-item').classes()).toContain('is-disabled')
  })

  it('title 插槽', () => {
    const wrapper = mount({
      components: { EbCollapse, EbCollapseItem },
      template: `
        <eb-collapse>
          <eb-collapse-item name="a"><template #title>标题X</template>内容</eb-collapse-item>
        </eb-collapse>
      `,
    })
    expect(wrapper.find('.eb-collapse-item__header').text()).toContain('标题X')
  })
})

describe('EbDescriptions', () => {
  it('双 class + header 结构', () => {
    const wrapper = mount(EbDescriptions, { props: { title: '详情', extra: '操作' } })
    expect(wrapper.classes()).toContain('eb-descriptions')
    expect(wrapper.classes()).toContain('eb-descriptions')
    expect(wrapper.find('.eb-descriptions__title').text()).toBe('详情')
    expect(wrapper.find('.eb-descriptions__extra').text()).toBe('操作')
  })

  it('无 title/extra 时不渲染 header', () => {
    expect(mount(EbDescriptions).find('.eb-descriptions__header').exists()).toBe(false)
  })

  it('label + 默认插槽渲染（item vnode 收集）', () => {
    const wrapper = mount({
      components: { EbDescriptions, EbDescriptionsItem },
      template: `
        <eb-descriptions>
          <eb-descriptions-item label="姓名">张三</eb-descriptions-item>
          <eb-descriptions-item label="电话">13800000000</eb-descriptions-item>
        </eb-descriptions>
      `,
    })
    const labels = wrapper.findAll('.eb-descriptions__label')
    const contents = wrapper.findAll('.eb-descriptions__content')
    expect(labels).toHaveLength(2)
    expect(contents).toHaveLength(2)
    expect(labels[0].text()).toBe('姓名')
    expect(contents[0].text()).toBe('张三')
  })

  it('horizontal：column 分行 + span 合并 + 末行补齐', () => {
    const wrapper = mount({
      components: { EbDescriptions, EbDescriptionsItem },
      template: `
        <eb-descriptions :column="2">
          <eb-descriptions-item label="A" :span="2">1</eb-descriptions-item>
          <eb-descriptions-item label="B">2</eb-descriptions-item>
          <eb-descriptions-item label="C">3</eb-descriptions-item>
        </eb-descriptions>
      `,
    })
    const rows = wrapper.findAll('tbody tr')
    // span=2 占满一行，B/C 一行 → 2 行
    expect(rows).toHaveLength(2)
    const firstRowTds = rows[0].findAll('.eb-descriptions__content')
    // A 的 content colspan = 2*2-1 = 3
    expect(firstRowTds[0].attributes('colspan')).toBe('3')
  })

  it('border 变体类', () => {
    const wrapper = mount({
      components: { EbDescriptions, EbDescriptionsItem },
      template: `
        <eb-descriptions border>
          <eb-descriptions-item label="A">1</eb-descriptions-item>
        </eb-descriptions>
      `,
    })
    expect(wrapper.classes()).toContain('is-bordered')
    expect(wrapper.find('.eb-descriptions__table').classes()).toContain('is-bordered')
  })

  it('vertical：label/content 两个 tbody', () => {
    const wrapper = mount({
      components: { EbDescriptions, EbDescriptionsItem },
      template: `
        <eb-descriptions direction="vertical" :column="2">
          <eb-descriptions-item label="A">1</eb-descriptions-item>
          <eb-descriptions-item label="B">2</eb-descriptions-item>
        </eb-descriptions>
      `,
    })
    expect(wrapper.findAll('.eb-descriptions__body-label')).toHaveLength(1)
    expect(wrapper.findAll('.eb-descriptions__body-content')).toHaveLength(1)
    expect(wrapper.findAll('.eb-descriptions__label')).toHaveLength(2)
    expect(wrapper.findAll('.eb-descriptions__content')).toHaveLength(2)
  })

  it('size 修饰类', () => {
    expect(mount(EbDescriptions, { props: { size: 'small' } }).classes()).toContain('eb-descriptions--small')
    expect(mount(EbDescriptions, { props: { size: 'large' } }).classes()).toContain('eb-descriptions--large')
  })
})

describe('EbSteps', () => {
  const mountSteps = (props = {}) =>
    mount({
      components: { EbSteps, EbStep },
      template: `
        <eb-steps v-bind="props">
          <eb-step title="步骤1" description="d1" />
          <eb-step title="步骤2" />
          <eb-step title="步骤3" />
        </eb-steps>
      `,
      setup() {
        return { props }
      },
    })

  it('双 class + 结构类', async () => {
    const wrapper = mountSteps()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.eb-steps').classes()).toContain('eb-steps')
    expect(wrapper.find('.eb-steps').classes()).toContain('is-horizontal')
    expect(wrapper.findAll('.eb-step')).toHaveLength(3)
    expect(wrapper.findAll('.eb-step__head')).toHaveLength(3)
    expect(wrapper.findAll('.eb-step__line')).toHaveLength(3)
  })

  it('active 状态分布：finish/process/wait', async () => {
    const wrapper = mountSteps({ active: 1 })
    await wrapper.vm.$nextTick()
    const steps = wrapper.findAll('.eb-step')
    expect(steps[0].classes()).toContain('is-finish')
    expect(steps[1].classes()).toContain('is-process')
    expect(steps[2].classes()).toContain('is-wait')
  })

  it('processStatus/finishStatus 自定义', async () => {
    const wrapper = mountSteps({ active: 1, processStatus: 'error', finishStatus: 'success' })
    await wrapper.vm.$nextTick()
    const steps = wrapper.findAll('.eb-step')
    expect(steps[0].classes()).toContain('is-success')
    expect(steps[1].classes()).toContain('is-error')
  })

  it('status prop 显式覆盖', async () => {
    const wrapper = mount({
      components: { EbSteps, EbStep },
      template: `
        <eb-steps :active="0">
          <eb-step title="A" status="error" />
        </eb-steps>
      `,
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.eb-step').classes()).toContain('is-error')
  })

  it('title/description 渲染 + 序号', async () => {
    const wrapper = mountSteps({ active: 0 })
    await wrapper.vm.$nextTick()
    const titles = wrapper.findAll('.eb-step__title')
    expect(titles[0].text()).toBe('步骤1')
    expect(wrapper.find('.eb-step__description').text()).toBe('d1')
    expect(wrapper.find('.eb-step__icon-inner').text()).toBe('1')
  })

  it('simple 模式：无 line、类切换', async () => {
    const wrapper = mountSteps({ simple: true })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.eb-steps').classes()).toContain('is-simple')
    expect(wrapper.find('.eb-step__line').exists()).toBe(false)
    expect(wrapper.find('.eb-step').classes()).toContain('is-simple')
  })

  it('vertical 方向类', async () => {
    const wrapper = mountSteps({ direction: 'vertical' })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.eb-steps').classes()).toContain('is-vertical')
    expect(wrapper.find('.eb-step').classes()).toContain('is-vertical')
  })

  it('align-center 类', async () => {
    const wrapper = mountSteps({ alignCenter: true })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.eb-step').classes()).toContain('is-center')
  })
})
