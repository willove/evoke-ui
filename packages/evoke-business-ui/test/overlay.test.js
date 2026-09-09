import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, config } from '@vue/test-utils'
import { defineComponent, h, ref, transformVNodeArgs } from 'vue'
import EvDialog from '../src/components/dialog/index.vue'
import { EvMessage } from '../src/components/message'

/** Dialog Harness：v-model 控制 */
const DialogHarness = defineComponent({
  props: ['dialogProps'],
  setup(props) {
    const visible = ref(true)
    return () =>
      h(EvDialog, {
        modelValue: visible.value,
        'onUpdate:modelValue': (v) => (visible.value = v),
        ...props.dialogProps,
      }, () => h('p', '内容'))
  },
})

describe('EvDialog', () => {
  it('双 class + 结构 DOM（overlay/header/body/footer）', async () => {
    const wrapper = mount(DialogHarness, {
      props: { dialogProps: { title: '标题' } },
      attachTo: document.body,
    })
    await new Promise((r) => setTimeout(r))
    const dialog = document.querySelector('.ev-dialog')
    expect(dialog).toBeTruthy()
    expect(dialog.classList.contains('ev-dialog')).toBe(true)
    expect(document.querySelector('.ev-dialog__header')).toBeTruthy()
    expect(document.querySelector('.ev-dialog__title').textContent).toBe('标题')
    expect(document.querySelector('.ev-dialog__body').textContent).toBe('内容')
    wrapper.unmount()
  })

  it('modelValue=false 时不渲染', () => {
    const wrapper = mount(EvDialog, {
      props: { modelValue: false, appendToBody: false },
    })
    expect(wrapper.find('.ev-dialog').exists()).toBe(false)
    wrapper.unmount()
  })

  it('点击关闭按钮 → update:modelValue(false) + close 事件', async () => {
    const wrapper = mount(DialogHarness, {
      props: { dialogProps: { title: 'T' } },
      attachTo: document.body,
    })
    await new Promise((r) => setTimeout(r))
    document.querySelector('.ev-dialog__headerbtn').click()
    await new Promise((r) => setTimeout(r))
    expect(document.querySelector('.ev-dialog')).toBeNull()
    wrapper.unmount()
  })

  it('点击遮罩关闭（close-on-click-modal 默认 true）', async () => {
    const wrapper = mount(DialogHarness, {
      props: { dialogProps: { title: 'T' } },
      attachTo: document.body,
    })
    await new Promise((r) => setTimeout(r))
    const overlay = document.querySelector('.ev-overlay')
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await new Promise((r) => setTimeout(r))
    expect(document.querySelector('.ev-dialog')).toBeNull()
    wrapper.unmount()
  })

  it('close-on-click-modal=false 时遮罩点击不关闭', async () => {
    const wrapper = mount(DialogHarness, {
      props: { dialogProps: { closeOnClickModal: false } },
      attachTo: document.body,
    })
    await new Promise((r) => setTimeout(r))
    document.querySelector('.ev-overlay').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await new Promise((r) => setTimeout(r))
    expect(document.querySelector('.ev-dialog')).toBeTruthy()
    wrapper.unmount()
  })

  it('ESC 关闭（close-on-press-escape 默认 true）', async () => {
    const wrapper = mount(DialogHarness, {
      props: { dialogProps: { title: 'T' } },
      attachTo: document.body,
    })
    await new Promise((r) => setTimeout(r))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await new Promise((r) => setTimeout(r))
    expect(document.querySelector('.ev-dialog')).toBeNull()
    wrapper.unmount()
  })

  it('before-close 钩子可阻止关闭', async () => {
    const wrapper = mount(DialogHarness, {
      props: {
        dialogProps: {
          title: 'T',
          beforeClose: () => {
            /* 不调用 done → 阻止 */
          },
        },
      },
      attachTo: document.body,
    })
    await new Promise((r) => setTimeout(r))
    document.querySelector('.ev-dialog__headerbtn').click()
    await new Promise((r) => setTimeout(r))
    expect(document.querySelector('.ev-dialog')).toBeTruthy()
    wrapper.unmount()
  })

  it('footer 插槽渲染', async () => {
    const wrapper = mount(
      {
        setup() {
          const visible = ref(true)
          return () =>
            h(EvDialog, { modelValue: visible.value, appendToBody: false, 'onUpdate:modelValue': () => {} }, {
              default: () => h('p', 'body'),
              footer: () => h('span', 'footer-slot'),
            })
        },
      },
    )
    expect(wrapper.find('.ev-dialog__footer').text()).toBe('footer-slot')
    wrapper.unmount()
  })

  it('fullscreen 全屏类', () => {
    const wrapper = mount(EvDialog, {
      props: { modelValue: true, appendToBody: false, fullscreen: true },
    })
    expect(wrapper.find('.ev-dialog').classes()).toContain('is-fullscreen')
    wrapper.unmount()
  })

  it('aria-modal 无障碍基线', async () => {
    const wrapper = mount(DialogHarness, {
      props: { dialogProps: {} },
      attachTo: document.body,
    })
    await new Promise((r) => setTimeout(r))
    expect(document.querySelector('.ev-dialog').getAttribute('aria-modal')).toBe('true')
    wrapper.unmount()
  })
})

describe('EvMessage 命令式 API', () => {
  beforeEach(async () => {
    // 防御式清理：清空前序测试可能泄漏的消息 DOM
    vi.useRealTimers()
    EvMessage.closeAll()
    await new Promise((r) => setTimeout(r, 0))
    document.querySelectorAll('.ev-message-container').forEach((el) => el.remove())
    document.querySelectorAll('.ev-message').forEach((el) => el.remove())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('默认 info：双 class + 内容 + 挂载 body', () => {
    EvMessage('普通消息')
    const el = document.querySelector('.ev-message')
    expect(el).toBeTruthy()
    expect(el.classList.contains('ev-message')).toBe(true)
    expect(el.classList.contains('ev-message--info')).toBe(true)
    expect(document.querySelector('.ev-message__content').textContent).toBe('普通消息')
    EvMessage.closeAll()
  })

  it('快捷方法 success/warning/error 类型类', () => {
    EvMessage.success('成功')
    EvMessage.error('失败')
    const els = document.querySelectorAll('.ev-message')
    expect(els[0].classList.contains('ev-message--success')).toBe(true)
    expect(els[1].classList.contains('ev-message--error')).toBe(true)
    EvMessage.closeAll()
  })

  it('堆叠：多实例垂直排布（top 递增）', () => {
    EvMessage('第一条')
    EvMessage('第二条')
    const containers = document.querySelectorAll('.ev-message-container')
    expect(containers.length).toBe(2)
    const top1 = Number(containers[0].style.top.replace('px', ''))
    const top2 = Number(containers[1].style.top.replace('px', ''))
    expect(top2).toBeGreaterThan(top1)
    EvMessage.closeAll()
  })

  it('duration 自动关闭（fake timers）', async () => {
    vi.useFakeTimers()
    EvMessage({ message: '自动关闭', duration: 1000 })
    expect(document.querySelector('.ev-message')).toBeTruthy()
    vi.advanceTimersByTime(1100)
    await vi.runAllTimersAsync()
    // fake timers 下用 microtask flush（不能用真实 setTimeout）
    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(0)
    expect(document.querySelector('.ev-message')).toBeNull()
  })

  it('自然到期销毁后新消息回到顶部 16px（幽灵实例回归）', async () => {
    // 前序 mount() 让 VTU 装了全局 vnode 转换器，后续命令式 render 的 Transition 一律被 stub，
    // afterLeave 永不触发；这里重置转换器，让真实过渡跑通销毁链路
    transformVNodeArgs(undefined)
    // 真实计时器 + jsdom rAF 驱动真实离开过渡（jsdom 无 transition 样式 → Vue 立即完成离开）
    vi.useRealTimers()
    EvMessage({ message: '先出现的', duration: 30 })
    await new Promise((r) => setTimeout(r, 250))
    // 到期销毁必须同步清出 instances，否则新消息的 top 按幽灵实例累加偏移
    expect(document.querySelector('.ev-message-container')).toBeNull()
    expect(EvMessage._instances.length).toBe(0)
    EvMessage('新消息')
    const c = document.querySelector('.ev-message-container')
    expect(c).toBeTruthy()
    expect(c.style.top).toBe('16px')
    EvMessage.closeAll()
    await new Promise((r) => setTimeout(r, 50))
  }, 5000)

  it('duration=0 不自动关闭', async () => {
    vi.useFakeTimers()
    EvMessage({ message: '常驻', duration: 0 })
    vi.advanceTimersByTime(10000)
    await vi.runAllTimersAsync()
    expect(document.querySelector('.ev-message')).toBeTruthy()
    EvMessage.closeAll()
    await vi.runAllTimersAsync()
    await Promise.resolve()
  })

  it('handle.close() 手动关闭单个', async () => {
    const h1 = EvMessage('保留')
    const h2 = EvMessage('关闭我')
    h2.close()
    // 真实离开过渡：DOM 移除在 afterLeave（下一帧），比微任务晚
    await new Promise((r) => setTimeout(r, 50))
    expect(document.querySelector('.ev-message__content').textContent).toBe('保留')
    h1.close()
    await new Promise((r) => setTimeout(r, 50))
    expect(document.querySelector('.ev-message')).toBeNull()
  })

  it('closeAll 清空全部（evoke-ui close 语义）', async () => {
    EvMessage('1')
    EvMessage('2')
    EvMessage('3')
    expect(document.querySelectorAll('.ev-message').length).toBe(3)
    EvMessage.close()
    await new Promise((r) => setTimeout(r, 50))
    expect(document.querySelector('.ev-message')).toBeNull()
  })

  it('grouping：同类型同文案合并（复用实例重置计时）', async () => {
    vi.useFakeTimers()
    EvMessage({ message: '重复', type: 'success', grouping: true, duration: 1000 })
    EvMessage({ message: '重复', type: 'success', grouping: true, duration: 1000 })
    expect(document.querySelectorAll('.ev-message').length).toBe(1)
    vi.advanceTimersByTime(500)
    // 合并后重置计时：再过 600ms（累计 1100ms > 1000ms）仍存活
    EvMessage({ message: '重复', type: 'success', grouping: true, duration: 1000 })
    vi.advanceTimersByTime(600)
    expect(document.querySelectorAll('.ev-message').length).toBe(1)
    EvMessage.closeAll()
    await vi.runAllTimersAsync()
    await Promise.resolve()
  })

  it('showClose 渲染关闭按钮并可点击关闭', async () => {
    EvMessage({ message: '可关闭', showClose: true })
    const btn = document.querySelector('.ev-message__closeBtn')
    expect(btn).toBeTruthy()
    btn.click()
    await new Promise((r) => setTimeout(r, 50))
    expect(document.querySelector('.ev-message')).toBeNull()
  })

  it('onClose 回调触发', async () => {
    const spy = vi.fn()
    const handle = EvMessage({ message: 'x', onClose: spy })
    handle.close()
    await new Promise((r) => setTimeout(r))
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
