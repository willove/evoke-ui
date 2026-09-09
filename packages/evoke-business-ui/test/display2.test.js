import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import EvPagination from '../src/components/pagination/index.vue'
import EvAvatar from '../src/components/avatar/index.vue'
import EvAvatarGroup from '../src/components/avatar/group.vue'
import EvBadge from '../src/components/badge/index.vue'
import EvProgress from '../src/components/progress/index.vue'
import EvEmpty from '../src/components/empty/index.vue'
import EvImageViewer from '../src/components/image-viewer/index.vue'

const PagerHarness = defineComponent({
  props: ['modelValue', 'total', 'pageSize', 'layout'],
  setup(props) {
    const inner = ref(props.modelValue ?? { page: 1, size: 20 })
    return () =>
      h(EvPagination, {
        ...props,
        modelValue: inner.value,
        'onUpdate:modelValue': (v) => (inner.value = v),
      })
  },
})

describe('EvPagination', () => {
  it('双 class + layout 解析渲染 total/pager', () => {
    const wrapper = mount(EvPagination, {
      props: { total: 100, layout: 'total, prev, pager, next' },
    })
    expect(wrapper.classes()).toContain('ev-pagination')
    expect(wrapper.classes()).toContain('ev-pagination')
    expect(wrapper.find('.ev-pagination__total').text()).toContain('100')
    expect(wrapper.find('.btn-prev').exists()).toBe(true)
    expect(wrapper.find('.btn-next').exists()).toBe(true)
    expect(wrapper.findAll('.ev-pager li.number').length).toBeGreaterThan(0)
  })

  it('背景模式默认开启（is-background）', () => {
    expect(mount(EvPagination, { props: { total: 100 } }).classes()).toContain('is-background')
  })

  it('页码点击 → current-change/change + v-model 对象更新', async () => {
    const wrapper = mount(PagerHarness, {
      props: { total: 200, pageSize: 10 },
    })
    await new Promise((r) => setTimeout(r))
    const pager = wrapper.findComponent(EvPagination)
    const page2 = wrapper.findAll('.ev-pager li.number').find((li) => li.text() === '2')
    await page2.trigger('click')
    expect(pager.emitted('current-change')[0]).toEqual([2])
    expect(pager.emitted('change')[0]).toEqual([{ current: 2, pageSize: 10 }])
  })

  it('prev/next 边界禁用', async () => {
    const wrapper = mount(EvPagination, {
      props: { total: 50, pageSize: 10, currentPage: 1 },
    })
    expect(wrapper.find('.btn-prev').classes()).toContain('is-disabled')
    await wrapper.find('.btn-next').trigger('click')
    await new Promise((r) => setTimeout(r))
    expect(wrapper.find('.btn-next').classes('is-disabled')).toBe(false)
  })

  it('jumper 输入跳页', async () => {
    const wrapper = mount(EvPagination, {
      props: { total: 200, pageSize: 10, layout: 'prev, pager, next, jumper' },
    })
    const editor = wrapper.find('.ev-pagination__editor')
    await editor.setValue('3')
    await editor.trigger('change')
    const pager = wrapper.findComponent(EvPagination)
    expect(pager.emitted('current-change')[0]).toEqual([3])
  })

  it('大页数省略（quick prev/next more）', () => {
    const wrapper = mount(EvPagination, {
      props: { total: 1000, pageSize: 10, currentPage: 50 },
    })
    expect(wrapper.findAll('.ev-pager li').length).toBeLessThan(20)
  })
})

describe('EvAvatar', () => {
  it('双 class + 圆形默认', () => {
    const wrapper = mount(EvAvatar, { slots: { default: 'W' } })
    expect(wrapper.classes()).toContain('ev-avatar')
    expect(wrapper.classes()).toContain('ev-avatar')
    expect(wrapper.classes()).toContain('ev-avatar--circle')
    expect(wrapper.text()).toBe('W')
  })

  it('数字 size 转宽高', () => {
    const wrapper = mount(EvAvatar, { props: { size: 56 } })
    expect(wrapper.attributes('style')).toContain('56px')
  })

  it('square 形状', () => {
    expect(mount(EvAvatar, { props: { shape: 'square' } }).classes()).toContain('ev-avatar--square')
  })

  it('src 渲染 img', () => {
    const wrapper = mount(EvAvatar, { props: { src: 'http://x/a.png' } })
    expect(wrapper.find('img').attributes('src')).toBe('http://x/a.png')
  })
})

describe('EvAvatarGroup', () => {
  it('双 class + 叠放子头像 + 组内 size/shape 继承', () => {
    const wrapper = mount(EvAvatarGroup, {
      props: { size: 'large', shape: 'square' },
      slots: {
        default: () => [h(EvAvatar, { key: 1 }, () => 'A'), h(EvAvatar, { key: 2 }, () => 'B')],
      },
    })
    expect(wrapper.classes()).toContain('ev-avatar-group')
    expect(wrapper.classes()).toContain('ev-avatar-group')
    const avatars = wrapper.findAll('.ev-avatar')
    expect(avatars.length).toBe(2)
    expect(avatars[0].classes()).toContain('ev-avatar--large')
    expect(avatars[0].classes()).toContain('ev-avatar--square')
  })

  it('子级显式 size 优先于组', () => {
    const wrapper = mount(EvAvatarGroup, {
      props: { size: 'large' },
      slots: {
        default: () => [h(EvAvatar, { key: 1, size: 'small' }, () => 'A')],
      },
    })
    expect(wrapper.find('.ev-avatar').classes()).toContain('ev-avatar--small')
  })
})

describe('EvBadge', () => {
  it('双 class + value 渲染 + fixed 定位', () => {
    const wrapper = mount(EvBadge, {
      props: { value: 12 },
      slots: { default: '<button>b</button>' },
    })
    expect(wrapper.classes()).toContain('ev-badge')
    expect(wrapper.classes()).toContain('ev-badge')
    const content = wrapper.find('.ev-badge__content')
    expect(content.classes()).toContain('is-fixed')
    expect(content.text()).toBe('12')
  })

  it('max 溢出显示 N+', () => {
    const wrapper = mount(EvBadge, { props: { value: 200, max: 99 } })
    expect(wrapper.find('.ev-badge__content').text()).toBe('99+')
  })

  it('is-dot 模式', () => {
    const wrapper = mount(EvBadge, { props: { isDot: true } })
    expect(wrapper.find('.ev-badge__content').classes()).toContain('is-dot')
  })

  it('type 变体色', () => {
    expect(
      mount(EvBadge, { props: { value: 1, type: 'success' } }).find('.ev-badge__content').classes()
    ).toContain('ev-badge__content--success')
  })
})

describe('EvProgress', () => {
  it('双 class + line 进度宽度', () => {
    const wrapper = mount(EvProgress, { props: { percentage: 60 } })
    expect(wrapper.classes()).toContain('ev-progress')
    expect(wrapper.classes()).toContain('ev-progress')
    expect(wrapper.find('.ev-progress-bar__inner').attributes('style')).toContain('60%')
    expect(wrapper.find('.ev-progress__text').text()).toBe('60%')
  })

  it('status 变体', () => {
    const wrapper = mount(EvProgress, { props: { percentage: 100, status: 'success' } })
    expect(wrapper.find('.ev-progress-bar__inner').classes()).toContain('is-success')
  })

  it('text-inside', () => {
    const wrapper = mount(EvProgress, {
      props: { percentage: 50, textInside: true },
    })
    expect(wrapper.find('.ev-progress-bar__innerText').text()).toBe('50%')
    expect(wrapper.classes()).toContain('is-text-inside')
  })

  it('circle 类型渲染 svg', () => {
    const wrapper = mount(EvProgress, {
      props: { percentage: 30, type: 'circle' },
    })
    expect(wrapper.classes()).toContain('ev-progress--circle')
    expect(wrapper.find('svg circle.ev-progress-circle__path').exists()).toBe(true)
  })
})

describe('EvEmpty', () => {
  it('双 class + 默认描述文案（locale）', () => {
    const wrapper = mount(EvEmpty)
    expect(wrapper.classes()).toContain('ev-empty')
    expect(wrapper.classes()).toContain('ev-empty')
    expect(wrapper.find('.ev-empty__description').text()).toBe('暂无数据')
  })

  it('自定义描述与底部插槽', () => {
    const wrapper = mount(EvEmpty, {
      props: { description: '暂无订单' },
      slots: { default: '<button>去下单</button>' },
    })
    expect(wrapper.find('.ev-empty__description').text()).toBe('暂无订单')
    expect(wrapper.find('.ev-empty__bottom button').exists()).toBe(true)
  })
})

const ViewerHarness = defineComponent({
  props: ['urls'],
  setup(props) {
    const visible = ref(true)
    return () =>
      h(EvImageViewer, {
        modelValue: visible.value,
        'onUpdate:modelValue': (v) => (visible.value = v),
        urlList: props.urls,
      })
  },
})

describe('EvImageViewer', () => {
  it('渲染遮罩 + 图片 + 关闭按钮', async () => {
    const wrapper = mount(ViewerHarness, {
      props: { urls: ['http://a/1.png', 'http://a/2.png'] },
      attachTo: document.body,
    })
    await new Promise((r) => setTimeout(r, 30))
    expect(document.querySelector('.ev-image-viewer__wrapper')).toBeTruthy()
    expect(document.querySelector('.ev-image-viewer__img')).toBeTruthy()
    expect(document.querySelector('.ev-image-viewer__counter').textContent).toContain('1 / 2')
    wrapper.unmount()
  })

  it('ESC 关闭', async () => {
    const wrapper = mount(ViewerHarness, {
      props: { urls: ['http://a/1.png'] },
      attachTo: document.body,
    })
    await new Promise((r) => setTimeout(r, 30))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await new Promise((r) => setTimeout(r, 30))
    expect(document.querySelector('.ev-image-viewer__wrapper')).toBeNull()
    wrapper.unmount()
  })

  it('next/prev 切换（switch 事件）', async () => {
    const wrapper = mount(ViewerHarness, {
      props: { urls: ['http://a/1.png', 'http://a/2.png'] },
      attachTo: document.body,
    })
    await new Promise((r) => setTimeout(r, 30))
    document.querySelector('.ev-image-viewer__next').click()
    await new Promise((r) => setTimeout(r, 30))
    expect(document.querySelector('.ev-image-viewer__counter').textContent).toContain('2 / 2')
    wrapper.unmount()
  })
})
