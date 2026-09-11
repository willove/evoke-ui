import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import EbPagination from '../src/components/pagination/index.vue'
import EbAvatar from '../src/components/avatar/index.vue'
import EbAvatarGroup from '../src/components/avatar/group.vue'
import EbBadge from '../src/components/badge/index.vue'
import EbProgress from '../src/components/progress/index.vue'
import EbEmpty from '../src/components/empty/index.vue'
import EbImageViewer from '../src/components/image-viewer/index.vue'

const PagerHarness = defineComponent({
  props: ['modelValue', 'total', 'pageSize', 'layout'],
  setup(props) {
    const inner = ref(props.modelValue ?? { page: 1, size: 20 })
    return () =>
      h(EbPagination, {
        ...props,
        modelValue: inner.value,
        'onUpdate:modelValue': (v) => (inner.value = v),
      })
  },
})

describe('EbPagination', () => {
  it('双 class + layout 解析渲染 total/pager', () => {
    const wrapper = mount(EbPagination, {
      props: { total: 100, layout: 'total, prev, pager, next' },
    })
    expect(wrapper.classes()).toContain('eb-pagination')
    expect(wrapper.classes()).toContain('eb-pagination')
    expect(wrapper.find('.eb-pagination__total').text()).toContain('100')
    expect(wrapper.find('.btn-prev').exists()).toBe(true)
    expect(wrapper.find('.btn-next').exists()).toBe(true)
    expect(wrapper.findAll('.eb-pager li.number').length).toBeGreaterThan(0)
  })

  it('背景模式默认开启（is-background）', () => {
    expect(mount(EbPagination, { props: { total: 100 } }).classes()).toContain('is-background')
  })

  it('页码点击 → current-change/change + v-model 对象更新', async () => {
    const wrapper = mount(PagerHarness, {
      props: { total: 200, pageSize: 10 },
    })
    await new Promise((r) => setTimeout(r))
    const pager = wrapper.findComponent(EbPagination)
    const page2 = wrapper.findAll('.eb-pager li.number').find((li) => li.text() === '2')
    await page2.trigger('click')
    expect(pager.emitted('current-change')[0]).toEqual([2])
    expect(pager.emitted('change')[0]).toEqual([{ current: 2, pageSize: 10 }])
  })

  it('prev/next 边界禁用', async () => {
    const wrapper = mount(EbPagination, {
      props: { total: 50, pageSize: 10, currentPage: 1 },
    })
    expect(wrapper.find('.btn-prev').classes()).toContain('is-disabled')
    await wrapper.find('.btn-next').trigger('click')
    await new Promise((r) => setTimeout(r))
    expect(wrapper.find('.btn-next').classes('is-disabled')).toBe(false)
  })

  it('jumper 输入跳页', async () => {
    const wrapper = mount(EbPagination, {
      props: { total: 200, pageSize: 10, layout: 'prev, pager, next, jumper' },
    })
    const editor = wrapper.find('.eb-pagination__editor')
    await editor.setValue('3')
    await editor.trigger('change')
    const pager = wrapper.findComponent(EbPagination)
    expect(pager.emitted('current-change')[0]).toEqual([3])
  })

  it('大页数省略（quick prev/next more）', () => {
    const wrapper = mount(EbPagination, {
      props: { total: 1000, pageSize: 10, currentPage: 50 },
    })
    expect(wrapper.findAll('.eb-pager li').length).toBeLessThan(20)
  })
})

describe('EbAvatar', () => {
  it('双 class + 圆形默认', () => {
    const wrapper = mount(EbAvatar, { slots: { default: 'W' } })
    expect(wrapper.classes()).toContain('eb-avatar')
    expect(wrapper.classes()).toContain('eb-avatar')
    expect(wrapper.classes()).toContain('eb-avatar--circle')
    expect(wrapper.text()).toBe('W')
  })

  it('数字 size 转宽高', () => {
    const wrapper = mount(EbAvatar, { props: { size: 56 } })
    expect(wrapper.attributes('style')).toContain('56px')
  })

  it('square 形状', () => {
    expect(mount(EbAvatar, { props: { shape: 'square' } }).classes()).toContain('eb-avatar--square')
  })

  it('src 渲染 img', () => {
    const wrapper = mount(EbAvatar, { props: { src: 'http://x/a.png' } })
    expect(wrapper.find('img').attributes('src')).toBe('http://x/a.png')
  })
})

describe('EbAvatarGroup', () => {
  it('双 class + 叠放子头像 + 组内 size/shape 继承', () => {
    const wrapper = mount(EbAvatarGroup, {
      props: { size: 'large', shape: 'square' },
      slots: {
        default: () => [h(EbAvatar, { key: 1 }, () => 'A'), h(EbAvatar, { key: 2 }, () => 'B')],
      },
    })
    expect(wrapper.classes()).toContain('eb-avatar-group')
    expect(wrapper.classes()).toContain('eb-avatar-group')
    const avatars = wrapper.findAll('.eb-avatar')
    expect(avatars.length).toBe(2)
    expect(avatars[0].classes()).toContain('eb-avatar--large')
    expect(avatars[0].classes()).toContain('eb-avatar--square')
  })

  it('子级显式 size 优先于组', () => {
    const wrapper = mount(EbAvatarGroup, {
      props: { size: 'large' },
      slots: {
        default: () => [h(EbAvatar, { key: 1, size: 'small' }, () => 'A')],
      },
    })
    expect(wrapper.find('.eb-avatar').classes()).toContain('eb-avatar--small')
  })
})

describe('EbBadge', () => {
  it('双 class + value 渲染 + fixed 定位', () => {
    const wrapper = mount(EbBadge, {
      props: { value: 12 },
      slots: { default: '<button>b</button>' },
    })
    expect(wrapper.classes()).toContain('eb-badge')
    expect(wrapper.classes()).toContain('eb-badge')
    const content = wrapper.find('.eb-badge__content')
    expect(content.classes()).toContain('is-fixed')
    expect(content.text()).toBe('12')
  })

  it('max 溢出显示 N+', () => {
    const wrapper = mount(EbBadge, { props: { value: 200, max: 99 } })
    expect(wrapper.find('.eb-badge__content').text()).toBe('99+')
  })

  it('is-dot 模式', () => {
    const wrapper = mount(EbBadge, { props: { isDot: true } })
    expect(wrapper.find('.eb-badge__content').classes()).toContain('is-dot')
  })

  it('type 变体色', () => {
    expect(
      mount(EbBadge, { props: { value: 1, type: 'success' } }).find('.eb-badge__content').classes()
    ).toContain('eb-badge__content--success')
  })
})

describe('EbProgress', () => {
  it('双 class + line 进度宽度', () => {
    const wrapper = mount(EbProgress, { props: { percentage: 60 } })
    expect(wrapper.classes()).toContain('eb-progress')
    expect(wrapper.classes()).toContain('eb-progress')
    expect(wrapper.find('.eb-progress-bar__inner').attributes('style')).toContain('60%')
    expect(wrapper.find('.eb-progress__text').text()).toBe('60%')
  })

  it('status 变体', () => {
    const wrapper = mount(EbProgress, { props: { percentage: 100, status: 'success' } })
    expect(wrapper.find('.eb-progress-bar__inner').classes()).toContain('is-success')
  })

  it('text-inside', () => {
    const wrapper = mount(EbProgress, {
      props: { percentage: 50, textInside: true },
    })
    expect(wrapper.find('.eb-progress-bar__innerText').text()).toBe('50%')
    expect(wrapper.classes()).toContain('is-text-inside')
  })

  it('circle 类型渲染 svg', () => {
    const wrapper = mount(EbProgress, {
      props: { percentage: 30, type: 'circle' },
    })
    expect(wrapper.classes()).toContain('eb-progress--circle')
    expect(wrapper.find('svg circle.eb-progress-circle__path').exists()).toBe(true)
  })
})

describe('EbEmpty', () => {
  it('双 class + 默认描述文案（locale）', () => {
    const wrapper = mount(EbEmpty)
    expect(wrapper.classes()).toContain('eb-empty')
    expect(wrapper.classes()).toContain('eb-empty')
    expect(wrapper.find('.eb-empty__description').text()).toBe('暂无数据')
  })

  it('自定义描述与底部插槽', () => {
    const wrapper = mount(EbEmpty, {
      props: { description: '暂无订单' },
      slots: { default: '<button>去下单</button>' },
    })
    expect(wrapper.find('.eb-empty__description').text()).toBe('暂无订单')
    expect(wrapper.find('.eb-empty__bottom button').exists()).toBe(true)
  })
})

const ViewerHarness = defineComponent({
  props: ['urls'],
  setup(props) {
    const visible = ref(true)
    return () =>
      h(EbImageViewer, {
        modelValue: visible.value,
        'onUpdate:modelValue': (v) => (visible.value = v),
        urlList: props.urls,
      })
  },
})

describe('EbImageViewer', () => {
  it('渲染遮罩 + 图片 + 关闭按钮', async () => {
    const wrapper = mount(ViewerHarness, {
      props: { urls: ['http://a/1.png', 'http://a/2.png'] },
      attachTo: document.body,
    })
    await new Promise((r) => setTimeout(r, 30))
    expect(document.querySelector('.eb-image-viewer__wrapper')).toBeTruthy()
    expect(document.querySelector('.eb-image-viewer__img')).toBeTruthy()
    expect(document.querySelector('.eb-image-viewer__counter').textContent).toContain('1 / 2')
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
    expect(document.querySelector('.eb-image-viewer__wrapper')).toBeNull()
    wrapper.unmount()
  })

  it('next/prev 切换（switch 事件）', async () => {
    const wrapper = mount(ViewerHarness, {
      props: { urls: ['http://a/1.png', 'http://a/2.png'] },
      attachTo: document.body,
    })
    await new Promise((r) => setTimeout(r, 30))
    document.querySelector('.eb-image-viewer__next').click()
    await new Promise((r) => setTimeout(r, 30))
    expect(document.querySelector('.eb-image-viewer__counter').textContent).toContain('2 / 2')
    wrapper.unmount()
  })
})
