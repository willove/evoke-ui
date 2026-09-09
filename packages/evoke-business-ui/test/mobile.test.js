/**
 * 移动组件四件套 — EvPullRefresh / EvLoadMore / EvActionSheet / EvTabbar
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import EvPullRefresh from '../src/components/pull-refresh/index.vue'
import EvLoadMore from '../src/components/load-more/index.vue'
import EvActionSheet from '../src/components/action-sheet/index.vue'
import EvTabbar from '../src/components/tabbar/index.vue'
import EvTabbarItem from '../src/components/tabbar/item.vue'
import EvNavBar from '../src/components/nav-bar/index.vue'
import { useSafeArea, ensureViewportFit } from '../src/composables/useSafeArea'

/** 派发触摸事件（jsdom 无 Touch 对象，手工挂 touches） */
function touch(el, type, clientY = 0) {
  const e = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(e, 'touches', { value: [{ clientY }] })
  Object.defineProperty(e, 'changedTouches', { value: [{ clientY }] })
  el.dispatchEvent(e)
}

const sleep = (ms = 30) => new Promise((r) => setTimeout(r, ms))

describe('EvPullRefresh', () => {
  it('默认渲染头部提示与内容插槽', () => {
    const wrapper = mount(EvPullRefresh, {
      slots: { default: () => h('div', { class: 'content' }, '列表内容') },
    })
    expect(wrapper.find('.ev-pull-refresh__text').text()).toBe('下拉刷新')
    expect(wrapper.find('.content').text()).toBe('列表内容')
  })

  it('下拉跟手：未到阈值 pulling，过阈值 loosing，松手触发 refresh', async () => {
    const wrapper = mount(EvPullRefresh, { props: { headHeight: 50 } })
    const el = wrapper.find('.ev-pull-refresh').element
    touch(el, 'touchstart', 0)
    touch(el, 'touchmove', 30)
    await nextTick()
    expect(wrapper.find('.ev-pull-refresh__text').text()).toBe('下拉刷新')
    expect(wrapper.find('.ev-pull-refresh__text').classes()).toContain('is-pulling')
    touch(el, 'touchmove', 80)
    await nextTick()
    expect(wrapper.find('.ev-pull-refresh__text').text()).toBe('释放刷新')
    expect(wrapper.find('.ev-pull-refresh__text').classes()).toContain('is-loosing')
    touch(el, 'touchend', 80)
    expect(wrapper.emitted('refresh')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it('向上滑动不触发任何状态', () => {
    const wrapper = mount(EvPullRefresh)
    const el = wrapper.find('.ev-pull-refresh').element
    touch(el, 'touchstart', 100)
    touch(el, 'touchmove', 60)
    expect(wrapper.emitted('refresh')).toBeFalsy()
    expect(wrapper.find('.ev-pull-refresh__text').classes()).not.toContain('is-loosing')
  })

  it('disabled 时手势失效', () => {
    const wrapper = mount(EvPullRefresh, { props: { disabled: true } })
    const el = wrapper.find('.ev-pull-refresh').element
    touch(el, 'touchstart', 0)
    touch(el, 'touchmove', 80)
    touch(el, 'touchend', 80)
    expect(wrapper.emitted('refresh')).toBeFalsy()
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('鼠标拖动等同触摸（桌面/文档演示路径）', () => {
    const wrapper = mount(EvPullRefresh, { props: { headHeight: 50 } })
    const el = wrapper.find('.ev-pull-refresh').element
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientY: 0 }))
    window.dispatchEvent(new MouseEvent('mousemove', { clientY: 80 }))
    window.dispatchEvent(new MouseEvent('mouseup', { clientY: 80 }))
    expect(wrapper.emitted('refresh')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it('modelValue 置 false 后进入成功态并在 successDuration 后收回', async () => {
    const wrapper = mount(EvPullRefresh, { props: { modelValue: true, successDuration: 20 } })
    expect(wrapper.find('.ev-pull-refresh__text').text()).toBe('加载中…')
    expect(wrapper.find('.ev-pull-refresh__spinner').exists()).toBe(true)
    await wrapper.setProps({ modelValue: false })
    expect(wrapper.find('.ev-pull-refresh__text').text()).toBe('刷新成功')
    await sleep(60)
    expect(wrapper.find('.ev-pull-refresh__text').text()).toBe('下拉刷新')
  })

  it('change 事件随状态流转发出', async () => {
    const wrapper = mount(EvPullRefresh, { props: { successDuration: 20 } })
    await wrapper.setProps({ modelValue: true })
    await wrapper.setProps({ modelValue: false })
    await sleep(60)
    const changes = wrapper.emitted('change').map((args) => args[0])
    expect(changes).toContain('loading')
    expect(changes).toContain('success')
    expect(changes[changes.length - 1]).toBe('normal')
  })
})

describe('EvLoadMore', () => {
  it('idle 态展示可点击的加载更多，点击发出 load-more 并置 loading', async () => {
    const wrapper = mount(EvLoadMore)
    expect(wrapper.find('.ev-load-more__text').text()).toBe('加载更多')
    await wrapper.find('.ev-load-more__body').trigger('click')
    expect(wrapper.emitted('load-more')).toBeTruthy()
    expect(wrapper.emitted('update:status')).toEqual([['loading']])
  })

  it('loading 态渲染 spinner 且不可点击', async () => {
    const wrapper = mount(EvLoadMore, { props: { status: 'loading' } })
    expect(wrapper.find('.ev-load-more__spinner').exists()).toBe(true)
    expect(wrapper.find('.ev-load-more__text').text()).toBe('加载中…')
    const body = wrapper.find('.ev-load-more__body')
    expect(body.attributes('disabled')).toBeDefined()
    await body.trigger('click')
    expect(wrapper.emitted('load-more')).toBeFalsy()
  })

  it('noMore 态展示没有更多了且不可触发', async () => {
    const wrapper = mount(EvLoadMore, { props: { status: 'noMore' } })
    expect(wrapper.find('.ev-load-more__text').text()).toBe('没有更多了')
    expect(wrapper.find('.ev-load-more').classes()).toContain('is-noMore')
    await wrapper.find('.ev-load-more__body').trigger('click')
    expect(wrapper.emitted('load-more')).toBeFalsy()
  })

  it('error 态点击重试', async () => {
    const wrapper = mount(EvLoadMore, { props: { status: 'error' } })
    expect(wrapper.find('.ev-load-more__text').text()).toBe('加载失败，点击重试')
    await wrapper.find('.ev-load-more__body').trigger('click')
    expect(wrapper.emitted('update:status')).toEqual([['loading']])
    expect(wrapper.emitted('load-more')).toBeTruthy()
  })

  it('自定义状态文案与插槽', () => {
    const wrapper = mount(EvLoadMore, {
      props: { status: 'noMore', noMoreText: '到底了' },
      slots: { default: ({ status }) => h('span', `S:${status}`) },
    })
    expect(wrapper.find('.ev-load-more').text()).toContain('S:noMore')
    expect(wrapper.find('.ev-load-more').text()).not.toContain('到底了')
  })
})

const SheetHarness = defineComponent({
  props: { modelValue: Boolean },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const actions = [
      { name: '转发审批' },
      { name: '编辑单据', subname: '进入全屏编辑' },
      { name: '撤回单据', color: '#f54a45' },
      { name: '不可用项', disabled: true },
    ]
    return () =>
      h(EvActionSheet, {
        modelValue: props.modelValue,
        'onUpdate:modelValue': (v) => emit('update:modelValue', v),
        actions,
      })
  },
})

describe('EvActionSheet', () => {
  it('打开渲染动作列表与取消栏，subname 与禁用项正确', async () => {
    const wrapper = mount(SheetHarness, { props: { modelValue: true }, attachTo: document.body })
    await sleep(30)
    const items = document.querySelectorAll('.ev-action-sheet__item')
    expect(items.length).toBe(4)
    expect(items[1].querySelector('.ev-action-sheet__subname').textContent).toBe('进入全屏编辑')
    expect(items[3].classList.contains('is-disabled')).toBe(true)
    expect(document.querySelector('.ev-action-sheet__cancel').textContent).toBe('取消')
    wrapper.unmount()
  })

  it('点选动作发出 select 并关闭', async () => {
    const wrapper = mount(SheetHarness, { props: { modelValue: true }, attachTo: document.body })
    await sleep(30)
    document.querySelectorAll('.ev-action-sheet__item')[0].click()
    await sleep(30)
    const selects = wrapper.findComponent(EvActionSheet).emitted('select')
    expect(selects[0][0].name).toBe('转发审批')
    expect(selects[0][1]).toBe(0)
    expect(wrapper.findComponent(EvActionSheet).emitted('update:modelValue').at(-1)).toEqual([false])
    wrapper.unmount()
  })

  it('禁用项点击不发出 select', async () => {
    const wrapper = mount(SheetHarness, { props: { modelValue: true }, attachTo: document.body })
    await sleep(30)
    document.querySelectorAll('.ev-action-sheet__item')[3].click()
    await sleep(30)
    expect(wrapper.findComponent(EvActionSheet).emitted('select')).toBeFalsy()
    wrapper.unmount()
  })

  it('取消栏发出 cancel 并关闭', async () => {
    const wrapper = mount(SheetHarness, { props: { modelValue: true }, attachTo: document.body })
    await sleep(30)
    document.querySelector('.ev-action-sheet__cancel').click()
    await sleep(30)
    const sheet = wrapper.findComponent(EvActionSheet)
    expect(sheet.emitted('cancel')).toBeTruthy()
    expect(sheet.emitted('update:modelValue').at(-1)).toEqual([false])
    wrapper.unmount()
  })

  it('before-close 拦截关闭', async () => {
    let allowed = false
    const wrapper = mount({
      setup() {
        const visible = ref(true)
        return () =>
          h(EvActionSheet, {
            modelValue: visible.value,
            'onUpdate:modelValue': (v) => (visible.value = v),
            actions: [{ name: '动作' }],
            beforeClose: (done) => allowed && done(),
          })
      },
    }, { attachTo: document.body })
    await sleep(30)
    document.querySelector('.ev-action-sheet__cancel').click()
    await sleep(30)
    expect(document.querySelector('.ev-action-sheet')).toBeTruthy()
    allowed = true
    document.querySelector('.ev-action-sheet__cancel').click()
    await sleep(30)
    expect(document.querySelector('.ev-action-sheet')).toBeNull()
    wrapper.unmount()
  })
})

const TabbarHarness = defineComponent({
  props: { modelValue: { type: [String, Number], default: 'home' } },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    return () =>
      h(EvTabbar, {
        modelValue: props.modelValue,
        'onUpdate:modelValue': (v) => emit('update:modelValue', v),
        onChange: (v) => emit('change', v),
      }, () => [
        h(EvTabbarItem, { name: 'home' }, { default: () => '首页' }),
        h(EvTabbarItem, { name: 'order', badge: 6 }, { default: () => '订单' }),
        h(EvTabbarItem, { dot: true, disabled: true }, { default: () => '消息' }),
      ])
  },
})

describe('EvTabbar', () => {
  it('渲染全部页签，默认激活项与 badge/dot', () => {
    const wrapper = mount(TabbarHarness, { attachTo: document.body })
    const items = wrapper.findAll('.ev-tabbar-item')
    expect(items.length).toBe(3)
    expect(items[0].classes()).toContain('is-active')
    expect(items[1].find('.ev-tabbar-item__badge').text()).toBe('6')
    expect(items[2].find('.ev-tabbar-item__dot').exists()).toBe(true)
    wrapper.unmount()
  })

  it('点击页签发出 change 与 v-model 更新', async () => {
    const wrapper = mount(TabbarHarness, { props: { modelValue: 'home' }, attachTo: document.body })
    await wrapper.findAll('.ev-tabbar-item')[1].trigger('click')
    expect(wrapper.emitted('change')).toEqual([['order']])
    expect(wrapper.emitted('update:modelValue')).toEqual([['order']])
    wrapper.unmount()
  })

  it('disabled 页签不可切换', async () => {
    const wrapper = mount(TabbarHarness, { props: { modelValue: 'home' }, attachTo: document.body })
    await wrapper.findAll('.ev-tabbar-item')[2].trigger('click')
    expect(wrapper.emitted('change')).toBeFalsy()
    expect(wrapper.findAll('.ev-tabbar-item')[2].classes()).toContain('is-disabled')
    wrapper.unmount()
  })

  it('未设 name 的页签按索引作为标识', async () => {
    const wrapper = mount({
      setup() {
        const active = ref(0)
        return () =>
          h(EvTabbar, {
            modelValue: active.value,
            'onUpdate:modelValue': (v) => (active.value = v),
          }, () => [
            h(EvTabbarItem, null, { default: () => '甲' }),
            h(EvTabbarItem, null, { default: () => '乙' }),
          ])
      },
    }, { attachTo: document.body })
    await wrapper.findAll('.ev-tabbar-item')[1].trigger('click')
    await sleep(10)
    const items = wrapper.findAll('.ev-tabbar-item')
    expect(items[0].classes()).not.toContain('is-active')
    expect(items[1].classes()).toContain('is-active')
    wrapper.unmount()
  })
})

describe('useSafeArea / ensureViewportFit', () => {
  it('ensureViewportFit 补写 viewport-fit=cover 且幂等', () => {
    const first = ensureViewportFit()
    const meta = document.querySelector('meta[name="viewport"]')
    expect(meta).toBeTruthy()
    expect(meta.getAttribute('content')).toContain('viewport-fit=cover')
    const second = ensureViewportFit()
    expect([first, second]).toEqual([true, false])
  })

  it('useSafeArea 返回响应式 insets（jsdom 无安全区，恒为 0）', async () => {
    let captured = null
    const Harness = defineComponent({
      setup() {
        captured = useSafeArea()
        return () => h('div')
      },
    })
    const wrapper = mount(Harness, { attachTo: document.body })
    await nextTick()
    expect(captured).toBeTruthy()
    expect(captured.top).toBe(0)
    expect(captured.bottom).toBe(0)
    expect(captured.left).toBe(0)
    expect(captured.right).toBe(0)
    wrapper.unmount()
  })
})

describe('EvNavBar', () => {
  it('渲染居中标题、返回箭头与左右文案', () => {
    const wrapper = mount(EvNavBar, {
      props: { title: '商品详情', leftArrow: true, leftText: '返回', rightText: '客服' },
    })
    expect(wrapper.find('.ev-nav-bar__title').text()).toBe('商品详情')
    expect(wrapper.find('.ev-nav-bar__side.is-left svg').exists()).toBe(true)
    expect(wrapper.find('.ev-nav-bar__side.is-left .ev-nav-bar__text').text()).toBe('返回')
    expect(wrapper.find('.ev-nav-bar__side.is-right .ev-nav-bar__text').text()).toBe('客服')
    expect(wrapper.classes()).toContain('is-bordered')
  })

  it('点击左右热区触发 click-left / click-right', async () => {
    const wrapper = mount(EvNavBar, { props: { title: 'T' } })
    await wrapper.find('.ev-nav-bar__side.is-left').trigger('click')
    await wrapper.find('.ev-nav-bar__side.is-right').trigger('click')
    expect(wrapper.emitted('click-left')).toHaveLength(1)
    expect(wrapper.emitted('click-right')).toHaveLength(1)
  })

  it('fixed + placeholder 生成等高占位，非 fixed 不渲染', () => {
    const plain = mount(EvNavBar, { props: { title: 'T' } })
    expect(plain.find('.ev-nav-bar__placeholder').exists()).toBe(false)
    const fixed = mount(EvNavBar, { props: { title: 'T', fixed: true, placeholder: true } })
    expect(fixed.find('.ev-nav-bar__inner').classes()).toContain('is-fixed')
    expect(fixed.find('.ev-nav-bar__placeholder').exists()).toBe(true)
  })

  it('title 插槽替换默认标题', () => {
    const wrapper = mount(EvNavBar, {
      props: { title: '默认' },
      slots: { title: () => h('span', { class: 'custom-title' }, '自定义标题') },
    })
    expect(wrapper.find('.custom-title').text()).toBe('自定义标题')
    expect(wrapper.find('.ev-nav-bar__title').text()).toBe('自定义标题')
  })
})
