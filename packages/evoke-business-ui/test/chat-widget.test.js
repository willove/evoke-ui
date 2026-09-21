import { describe, it, expect, afterEach } from 'vitest'
import { mount, enableAutoUnmount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import ChatWidget from '../src/components/chatbot/ChatWidget.vue'
import { chatLabels } from '../src/components/chatbot/labels'
import { setPlatform } from '../src/composables/usePlatform'

/**
 * 批 E：EbChatWidget 浮动挂件
 *
 * 移动端交给 EbDrawer（btt），桌面端是右下角浮层——两套形态共用同一份开关状态。
 */

// 一条用例抛错就会跳过 unmount，泄漏的实例带着 teleport 残留污染后续用例。
// 自动卸载先注册，确保它在本文件的清理之前跑。
enableAutoUnmount(afterEach)
afterEach(() => {
  setPlatform('auto')
  document.body.innerHTML = ''
})

// 默认 appendToBody:false 让内容内联渲染：teleport 到 body 的节点不在
// wrapper 子树里，w.find 一律搜不到。teleport 行为单列一条用 document 验。
const mountWidget = (props = {}, slots = {}) =>
  mount(ChatWidget, { props: { title: '智能助手', appendToBody: false, ...props }, slots, attachTo: document.body })

describe('EbChatWidget 桌面浮层', () => {
  it('默认收起：只有 launcher，没有面板', () => {
    const w = mountWidget({}, { default: '<div class="probe-content">内容</div>' })
    expect(w.find('.eb-chat-widget__panel').exists()).toBe(false)
    expect(w.find('.eb-float-button').exists()).toBe(true)
    expect(w.find('.probe-content').exists()).toBe(false)
    w.unmount()
  })

  it('展开后渲染面板：dialog 语义 + 标题 + 关闭钮', async () => {
    const w = mountWidget({ modelValue: true }, { default: '<div class="probe-content">内容</div>' })
    await nextTick()
    const panel = w.find('.eb-chat-widget__panel')
    expect(panel.exists()).toBe(true)
    expect(panel.attributes('role')).toBe('dialog')
    expect(panel.attributes('aria-modal')).toBe('true')
    expect(panel.attributes('aria-label')).toBe('智能助手')
    expect(w.find('.eb-chat-widget__header').text()).toContain('智能助手')
    expect(w.find('.probe-content').exists()).toBe(true)
    w.unmount()
  })

  it('launcher 点击切换开合；open / close 在受控值真的翻转时成对触发', async () => {
    // open/close 表示状态迁移而非意图，所以要用真的 v-model 宿主来测
    const host = mount(
      {
        components: { ChatWidget },
        template: '<chat-widget v-model="open" :append-to-body="false" title="T"><div class="probe-content">内容</div></chat-widget>',
        data: () => ({ open: false }),
      },
      { attachTo: document.body },
    )
    const widget = host.findComponent(ChatWidget)
    await host.find('.eb-float-button').trigger('click')
    await nextTick()
    expect(host.vm.open).toBe(true)
    expect(widget.emitted('open')).toHaveLength(1)
    expect(host.find('.eb-chat-widget__panel').exists()).toBe(true)

    await host.find('.eb-chat-widget__close').trigger('click')
    await nextTick()
    expect(host.vm.open).toBe(false)
    expect(widget.emitted('close')).toHaveLength(1)
    expect(host.find('.eb-chat-widget__panel').exists()).toBe(false)
  })

  it('受控方不接 update 时面板不展开（事件表达状态迁移，不是意图）', async () => {
    const w = mountWidget({ modelValue: false })
    await w.find('.eb-float-button').trigger('click')
    expect(w.emitted('update:modelValue').at(-1)).toEqual([true])
    expect(w.find('.eb-chat-widget__panel').exists()).toBe(false)
  })

  it('placement 决定贴边类名；width/height 落到内联样式', async () => {
    const w = mountWidget({ modelValue: true, placement: 'bottom-left', width: 420, height: '70vh' })
    await nextTick()
    const root = w.find('.eb-chat-widget')
    expect(root.classes()).toContain('is-bottom-left')
    const style = w.find('.eb-chat-widget__panel').attributes('style')
    expect(style).toContain('width: 420px')
    expect(style).toContain('height: 70vh')
    w.unmount()
  })

  it('launcher 插槽可整块替换', async () => {
    const w = mountWidget({}, { launcher: '<button class="my-launcher">问我</button>' })
    expect(w.find('.my-launcher').text()).toBe('问我')
    expect(w.find('.eb-float-button').exists()).toBe(false)
    w.unmount()
  })

  it('badge 透传到 launcher；tooltip 随开合切换文案', async () => {
    const w = mountWidget({ badge: 3 })
    expect(w.find('.eb-float-button').attributes('aria-label')).toBe(chatLabels.widget.expand)
    w.unmount()
    const opened = mountWidget({ modelValue: true, launcherTooltip: '有问题点我' })
    await nextTick()
    expect(opened.find('.eb-float-button').attributes('aria-label')).toBe('有问题点我')
    opened.unmount()
  })
})

describe('EbChatWidget 挂载位置', () => {
  it('默认 teleport 到 body（脱离宿主 overflow / z-index 上下文）', async () => {
    const w = mount(ChatWidget, { props: { title: 'T', modelValue: true }, attachTo: document.body })
    await nextTick()
    expect(document.querySelector('.eb-chat-widget__panel')).toBeTruthy()
    expect(w.find('.eb-chat-widget__panel').exists()).toBe(false)
    w.unmount()
  })
})

describe('EbChatWidget 合规声明门', () => {
  it('给了 disclaimer 且未同意：先显示声明，内容不渲染', async () => {
    const w = mountWidget(
      { modelValue: true, disclaimer: '本助手输出仅供参考，请勿作为唯一决策依据。' },
      { default: '<div class="probe-content">内容</div>' },
    )
    await nextTick()
    expect(w.find('.eb-chat-widget__consent-text').text()).toContain('请勿作为唯一决策依据')
    expect(w.find('.probe-content').exists()).toBe(false)
    w.unmount()
  })

  it('同意后渲染内容并 emit consent', async () => {
    const w = mountWidget(
      { modelValue: true, disclaimer: '声明' },
      { default: '<div class="probe-content">内容</div>' },
    )
    await nextTick()
    await w.find('.eb-chat-widget__consent-btn').trigger('click')
    expect(w.emitted('consent')).toHaveLength(1)
    await nextTick()
    expect(w.find('.probe-content').exists()).toBe(true)
    expect(w.find('.eb-chat-widget__consent').exists()).toBe(false)
    w.unmount()
  })

  it('defaultConsented 跳过声明门；无 disclaimer 不出现门', async () => {
    const w = mountWidget(
      { modelValue: true, disclaimer: '声明', defaultConsented: true },
      { default: '<div class="probe-content">内容</div>' },
    )
    await nextTick()
    expect(w.find('.eb-chat-widget__consent').exists()).toBe(false)
    expect(w.find('.probe-content').exists()).toBe(true)
    w.unmount()

    const plain = mountWidget({ modelValue: true }, { default: '<div class="probe-content">内容</div>' })
    await nextTick()
    expect(plain.find('.eb-chat-widget__consent').exists()).toBe(false)
    plain.unmount()
  })

  it('disclaimer-actions 插槽可替换同意按钮（由宿主接 slot prop 上的 accept）', async () => {
    // 替换掉默认按钮后，同意动作要由宿主自己接——组件把 accept 作为 slot prop 交出
    const w = mountWidget(
      { modelValue: true, disclaimer: '声明' },
      {
        default: '<div class="probe-content">内容</div>',
        'disclaimer-actions': (scope) =>
          h('button', { class: 'my-agree', onClick: () => scope.accept() }, '我同意'),
      },
    )
    await nextTick()
    expect(w.find('.eb-chat-widget__consent-btn').exists()).toBe(false)
    await w.find('.my-agree').trigger('click')
    expect(w.emitted('consent')).toHaveLength(1)
    await nextTick()
    expect(w.find('.probe-content').exists()).toBe(true)
  })

  it('slot 里不接 accept 时不会误触发同意（动作归宿主，组件不代劳）', async () => {
    const w = mountWidget(
      { modelValue: true, disclaimer: '声明' },
      {
        default: '<div class="probe-content">内容</div>',
        'disclaimer-actions': '<button class="my-agree">我同意</button>',
      },
    )
    await nextTick()
    await w.find('.my-agree').trigger('click')
    expect(w.emitted('consent')).toBeUndefined()
    expect(w.find('.probe-content').exists()).toBe(false)
  })
})

describe('EbChatWidget 窄屏形态', () => {
  it('移动端且 mobileMode=drawer 时走 Drawer（btt），不渲染桌面浮层', async () => {
    setPlatform('mobile')
    const w = mountWidget({ modelValue: true }, { default: '<div class="probe-content">内容</div>' })
    await nextTick()
    expect(w.findComponent({ name: 'EbDrawer' }).exists()).toBe(true)
    expect(w.find('.eb-chat-widget__panel').exists()).toBe(false)
    expect(w.find('.probe-content').exists()).toBe(true)
    w.unmount()
  })

  it('mobileMode=panel 时移动端仍用浮层（窄屏自适应场景）', async () => {
    setPlatform('mobile')
    const w = mountWidget({ modelValue: true, mobileMode: 'panel' }, { default: '<div class="probe-content">内容</div>' })
    await nextTick()
    expect(w.findComponent({ name: 'EbDrawer' }).exists()).toBe(false)
    expect(w.find('.eb-chat-widget__panel').exists()).toBe(true)
    w.unmount()
  })

  it('桌面端不渲染 Drawer', async () => {
    const w = mountWidget({ modelValue: true })
    await nextTick()
    expect(w.findComponent({ name: 'EbDrawer' }).exists()).toBe(false)
    w.unmount()
  })
})
