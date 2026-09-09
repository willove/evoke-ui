import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EvBreadcrumb from '../src/components/breadcrumb/index.vue'
import EvBreadcrumbItem from '../src/components/breadcrumb/item.vue'
import EvLink from '../src/components/link/index.vue'
import EvText from '../src/components/text/index.vue'
import EvCollapse from '../src/components/collapse/index.vue'
import EvCollapseItem from '../src/components/collapse/item.vue'
import EvDescriptions from '../src/components/descriptions/index.vue'
import EvDescriptionsItem from '../src/components/descriptions/item.vue'
import EvSteps from '../src/components/steps/index.vue'
import EvStep from '../src/components/steps/item.vue'

describe('EvBreadcrumb', () => {
  it('双 class + aria 标签', () => {
    const wrapper = mount(EvBreadcrumb)
    expect(wrapper.classes()).toContain('ev-breadcrumb')
    expect(wrapper.classes()).toContain('ev-breadcrumb')
    expect(wrapper.attributes('aria-label')).toBe('Breadcrumb')
  })

  it('插槽子项：非最后一项渲染分隔符，最后一项不渲染', async () => {
    const wrapper = mount({
      components: { EvBreadcrumb, EvBreadcrumbItem },
      template: `
        <ev-breadcrumb>
          <ev-breadcrumb-item>首页</ev-breadcrumb-item>
          <ev-breadcrumb-item to="/list">列表</ev-breadcrumb-item>
          <ev-breadcrumb-item>详情</ev-breadcrumb-item>
        </ev-breadcrumb>
      `,
    })
    await wrapper.vm.$nextTick()
    const items = wrapper.findAll('.ev-breadcrumb__item')
    expect(items).toHaveLength(3)
    const separators = wrapper.findAll('.ev-breadcrumb__separator')
    expect(separators).toHaveLength(2)
    expect(separators[0].text()).toBe('/')
    expect(items[1].find('.ev-breadcrumb__inner').classes()).toContain('is-link')
  })

  it('evoke-ui 兼容：items 配置数组渲染', async () => {
    const wrapper = mount(EvBreadcrumb, {
      props: {
        items: [
          { label: '首页' },
          { label: '列表', to: '/list' },
        ],
      },
    })
    await wrapper.vm.$nextTick()
    const inners = wrapper.findAll('.ev-breadcrumb__inner')
    expect(inners).toHaveLength(2)
    expect(inners[0].text()).toContain('首页')
    expect(inners[1].classes()).toContain('is-link')
  })

  it('separator 自定义', async () => {
    const wrapper = mount({
      components: { EvBreadcrumb, EvBreadcrumbItem },
      template: `
        <ev-breadcrumb separator="-">
          <ev-breadcrumb-item>a</ev-breadcrumb-item>
          <ev-breadcrumb-item>b</ev-breadcrumb-item>
        </ev-breadcrumb>
      `,
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ev-breadcrumb__separator').text()).toBe('-')
  })

  it('to + 无 router：http 链接降级不抛错，无 to 点击无效', async () => {
    const wrapper = mount(EvBreadcrumbItem)
    await wrapper.find('.ev-breadcrumb__inner').trigger('click')
    expect(wrapper.find('.ev-breadcrumb__inner').classes()).not.toContain('is-link')
  })
})

describe('EvLink', () => {
  it('双 class + type 修饰类', () => {
    const wrapper = mount(EvLink, { slots: { default: '链接' } })
    expect(wrapper.classes()).toContain('ev-link')
    expect(wrapper.classes()).toContain('ev-link')
    expect(wrapper.classes()).toContain('ev-link--default')
    expect(wrapper.text()).toBe('链接')
    expect(mount(EvLink, { props: { type: 'primary' } }).classes()).toContain('ev-link--primary')
    expect(mount(EvLink, { props: { type: 'error' } }).classes()).toContain('ev-link--danger')
  })

  it('underline 默认 always，布尔入参映射新语义', () => {
    expect(mount(EvLink).classes()).toContain('is-underline')
    expect(mount(EvLink, { props: { underline: true } }).classes()).toContain('is-underline')
    expect(mount(EvLink, { props: { underline: false } }).classes()).not.toContain('is-underline')
    expect(mount(EvLink, { props: { underline: 'never' } }).classes()).not.toContain('is-underline')
  })

  it('disabled 阻止点击且不触发 click', async () => {
    const wrapper = mount(EvLink, { props: { disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
    expect(wrapper.classes()).toContain('is-disabled')
  })

  it('href/target 透传 + click 事件', async () => {
    const wrapper = mount(EvLink, { props: { href: 'https://example.com', target: '_blank' }, slots: { default: 'x' } })
    expect(wrapper.attributes('href')).toBe('https://example.com')
    expect(wrapper.attributes('target')).toBe('_blank')
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('icon 渲染', () => {
    const wrapper = mount(EvLink, { props: { icon: 'search' } })
    expect(wrapper.find('.ev-icon, .ev-iconfont').exists()).toBe(true)
  })

  it('原生 a 标签语义', () => {
    expect(mount(EvLink).element.tagName).toBe('A')
  })
})

describe('EvText', () => {
  it('双 class + 默认 tag span', () => {
    const wrapper = mount(EvText, { slots: { default: '文本' } })
    expect(wrapper.classes()).toContain('ev-text')
    expect(wrapper.classes()).toContain('ev-text')
    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.text()).toBe('文本')
  })

  it('type/size/truncated/tag', () => {
    const wrapper = mount(EvText, { props: { type: 'primary', size: 'large', truncated: true, tag: 'p' } })
    expect(wrapper.classes()).toContain('ev-text--primary')
    expect(wrapper.classes()).toContain('ev-text--large')
    expect(wrapper.classes()).toContain('is-truncated')
    expect(wrapper.element.tagName).toBe('P')
  })

  it('error 映射为 danger（语义对齐）', () => {
    expect(mount(EvText, { props: { type: 'error' } }).classes()).toContain('ev-text--danger')
  })
})

describe('EvCollapse', () => {
  const mountCollapse = (props = {}) =>
    mount({
      components: { EvCollapse, EvCollapseItem },
      template: `
        <ev-collapse v-bind="props">
          <ev-collapse-item title="A" name="a">内容A</ev-collapse-item>
          <ev-collapse-item title="B" name="b">内容B</ev-collapse-item>
        </ev-collapse>
      `,
      setup() {
        return { props }
      },
    })

  it('双 class + 结构类', () => {
    const wrapper = mountCollapse()
    expect(wrapper.find('.ev-collapse').classes()).toContain('ev-collapse')
    expect(wrapper.findAll('.ev-collapse-item')).toHaveLength(2)
    expect(wrapper.findAll('.ev-collapse-item__header')).toHaveLength(2)
    expect(wrapper.find('.ev-collapse-item__content').exists()).toBe(true)
  })

  it('默认全收起；点击展开并 emit update:modelValue/change', async () => {
    const wrapper = mountCollapse()
    expect(wrapper.find('.ev-collapse-item.is-active').exists()).toBe(false)
    await wrapper.findAll('.ev-collapse-item__header')[0].trigger('click')
    expect(wrapper.findComponent(EvCollapse).emitted('update:modelValue')).toEqual([[['a']]])
    expect(wrapper.findComponent(EvCollapse).emitted('change')).toEqual([[['a']]])
    // 受控前本地状态已生效（非受控用法）
    expect(wrapper.find('.ev-collapse-item.is-active').exists()).toBe(true)
  })

  it('aria-expanded 与按钮语义', () => {
    const header = mountCollapse().findAll('.ev-collapse-item__header')[0]
    expect(header.element.tagName).toBe('BUTTON')
    expect(header.attributes('aria-expanded')).toBe('false')
  })

  it('受控 modelValue 初始化展开', () => {
    const wrapper = mountCollapse({ modelValue: ['b'] })
    const active = wrapper.findAll('.ev-collapse-item')
    expect(active[1].classes()).toContain('is-active')
    expect(active[0].classes()).not.toContain('is-active')
  })

  it('accordion 模式互斥且 payload 为单值', async () => {
    const wrapper = mountCollapse({ accordion: true })
    const headers = wrapper.findAll('.ev-collapse-item__header')
    await headers[0].trigger('click')
    expect(wrapper.findComponent(EvCollapse).emitted('update:modelValue')).toEqual([['a']])
    await headers[1].trigger('click')
    expect(wrapper.findComponent(EvCollapse).emitted('update:modelValue')).toEqual([['a'], ['b']])
    const active = wrapper.findAll('.ev-collapse-item.is-active')
    expect(active).toHaveLength(1)
  })

  it('disabled 项点击无效', async () => {
    const wrapper = mount({
      components: { EvCollapse, EvCollapseItem },
      template: `
        <ev-collapse>
          <ev-collapse-item title="A" name="a" disabled>内容A</ev-collapse-item>
        </ev-collapse>
      `,
    })
    await wrapper.find('.ev-collapse-item__header').trigger('click')
    expect(wrapper.findComponent(EvCollapse).emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.find('.ev-collapse-item').classes()).toContain('is-disabled')
  })

  it('title 插槽', () => {
    const wrapper = mount({
      components: { EvCollapse, EvCollapseItem },
      template: `
        <ev-collapse>
          <ev-collapse-item name="a"><template #title>标题X</template>内容</ev-collapse-item>
        </ev-collapse>
      `,
    })
    expect(wrapper.find('.ev-collapse-item__header').text()).toContain('标题X')
  })
})

describe('EvDescriptions', () => {
  it('双 class + header 结构', () => {
    const wrapper = mount(EvDescriptions, { props: { title: '详情', extra: '操作' } })
    expect(wrapper.classes()).toContain('ev-descriptions')
    expect(wrapper.classes()).toContain('ev-descriptions')
    expect(wrapper.find('.ev-descriptions__title').text()).toBe('详情')
    expect(wrapper.find('.ev-descriptions__extra').text()).toBe('操作')
  })

  it('无 title/extra 时不渲染 header', () => {
    expect(mount(EvDescriptions).find('.ev-descriptions__header').exists()).toBe(false)
  })

  it('label + 默认插槽渲染（item vnode 收集）', () => {
    const wrapper = mount({
      components: { EvDescriptions, EvDescriptionsItem },
      template: `
        <ev-descriptions>
          <ev-descriptions-item label="姓名">张三</ev-descriptions-item>
          <ev-descriptions-item label="电话">13800000000</ev-descriptions-item>
        </ev-descriptions>
      `,
    })
    const labels = wrapper.findAll('.ev-descriptions__label')
    const contents = wrapper.findAll('.ev-descriptions__content')
    expect(labels).toHaveLength(2)
    expect(contents).toHaveLength(2)
    expect(labels[0].text()).toBe('姓名')
    expect(contents[0].text()).toBe('张三')
  })

  it('horizontal：column 分行 + span 合并 + 末行补齐', () => {
    const wrapper = mount({
      components: { EvDescriptions, EvDescriptionsItem },
      template: `
        <ev-descriptions :column="2">
          <ev-descriptions-item label="A" :span="2">1</ev-descriptions-item>
          <ev-descriptions-item label="B">2</ev-descriptions-item>
          <ev-descriptions-item label="C">3</ev-descriptions-item>
        </ev-descriptions>
      `,
    })
    const rows = wrapper.findAll('tbody tr')
    // span=2 占满一行，B/C 一行 → 2 行
    expect(rows).toHaveLength(2)
    const firstRowTds = rows[0].findAll('.ev-descriptions__content')
    // A 的 content colspan = 2*2-1 = 3
    expect(firstRowTds[0].attributes('colspan')).toBe('3')
  })

  it('border 变体类', () => {
    const wrapper = mount({
      components: { EvDescriptions, EvDescriptionsItem },
      template: `
        <ev-descriptions border>
          <ev-descriptions-item label="A">1</ev-descriptions-item>
        </ev-descriptions>
      `,
    })
    expect(wrapper.classes()).toContain('is-bordered')
    expect(wrapper.find('.ev-descriptions__table').classes()).toContain('is-bordered')
  })

  it('vertical：label/content 两个 tbody', () => {
    const wrapper = mount({
      components: { EvDescriptions, EvDescriptionsItem },
      template: `
        <ev-descriptions direction="vertical" :column="2">
          <ev-descriptions-item label="A">1</ev-descriptions-item>
          <ev-descriptions-item label="B">2</ev-descriptions-item>
        </ev-descriptions>
      `,
    })
    expect(wrapper.findAll('.ev-descriptions__body-label')).toHaveLength(1)
    expect(wrapper.findAll('.ev-descriptions__body-content')).toHaveLength(1)
    expect(wrapper.findAll('.ev-descriptions__label')).toHaveLength(2)
    expect(wrapper.findAll('.ev-descriptions__content')).toHaveLength(2)
  })

  it('size 修饰类', () => {
    expect(mount(EvDescriptions, { props: { size: 'small' } }).classes()).toContain('ev-descriptions--small')
    expect(mount(EvDescriptions, { props: { size: 'large' } }).classes()).toContain('ev-descriptions--large')
  })
})

describe('EvSteps', () => {
  const mountSteps = (props = {}) =>
    mount({
      components: { EvSteps, EvStep },
      template: `
        <ev-steps v-bind="props">
          <ev-step title="步骤1" description="d1" />
          <ev-step title="步骤2" />
          <ev-step title="步骤3" />
        </ev-steps>
      `,
      setup() {
        return { props }
      },
    })

  it('双 class + 结构类', async () => {
    const wrapper = mountSteps()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ev-steps').classes()).toContain('ev-steps')
    expect(wrapper.find('.ev-steps').classes()).toContain('is-horizontal')
    expect(wrapper.findAll('.ev-step')).toHaveLength(3)
    expect(wrapper.findAll('.ev-step__head')).toHaveLength(3)
    expect(wrapper.findAll('.ev-step__line')).toHaveLength(3)
  })

  it('active 状态分布：finish/process/wait', async () => {
    const wrapper = mountSteps({ active: 1 })
    await wrapper.vm.$nextTick()
    const steps = wrapper.findAll('.ev-step')
    expect(steps[0].classes()).toContain('is-finish')
    expect(steps[1].classes()).toContain('is-process')
    expect(steps[2].classes()).toContain('is-wait')
  })

  it('processStatus/finishStatus 自定义', async () => {
    const wrapper = mountSteps({ active: 1, processStatus: 'error', finishStatus: 'success' })
    await wrapper.vm.$nextTick()
    const steps = wrapper.findAll('.ev-step')
    expect(steps[0].classes()).toContain('is-success')
    expect(steps[1].classes()).toContain('is-error')
  })

  it('status prop 显式覆盖', async () => {
    const wrapper = mount({
      components: { EvSteps, EvStep },
      template: `
        <ev-steps :active="0">
          <ev-step title="A" status="error" />
        </ev-steps>
      `,
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ev-step').classes()).toContain('is-error')
  })

  it('title/description 渲染 + 序号', async () => {
    const wrapper = mountSteps({ active: 0 })
    await wrapper.vm.$nextTick()
    const titles = wrapper.findAll('.ev-step__title')
    expect(titles[0].text()).toBe('步骤1')
    expect(wrapper.find('.ev-step__description').text()).toBe('d1')
    expect(wrapper.find('.ev-step__icon-inner').text()).toBe('1')
  })

  it('simple 模式：无 line、类切换', async () => {
    const wrapper = mountSteps({ simple: true })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ev-steps').classes()).toContain('is-simple')
    expect(wrapper.find('.ev-step__line').exists()).toBe(false)
    expect(wrapper.find('.ev-step').classes()).toContain('is-simple')
  })

  it('vertical 方向类', async () => {
    const wrapper = mountSteps({ direction: 'vertical' })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ev-steps').classes()).toContain('is-vertical')
    expect(wrapper.find('.ev-step').classes()).toContain('is-vertical')
  })

  it('align-center 类', async () => {
    const wrapper = mountSteps({ alignCenter: true })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ev-step').classes()).toContain('is-center')
  })
})
