import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, defineComponent, h } from 'vue'
import ChatCommandMenu from '../src/components/chatbot/ChatCommandMenu.vue'
import ChatSender from '../src/components/chatbot/ChatSender.vue'
import Chatbot from '../src/components/chatbot/Chatbot.vue'
import { useTriggerMenu } from '../src/composables/useTriggerMenu'
import { chatLabels } from '../src/components/chatbot/labels'

/**
 * 批 K：斜杠命令与 @ 提及
 *
 * 触发边界是这批最该钉的东西——路径里的 `/`、邮箱里的 `@` 都不能误触发。
 * 键盘由宿主经 useTriggerMenu 驱动，弹层只管渲染。
 */

const COMMANDS = [
  { key: 'summarize', label: '/summarize', desc: '总结当前会话', icon: 'file-text' },
  { key: 'translate', label: '/translate', desc: '翻译成英文' },
  { key: 'clear', label: '/clear', desc: '清空上下文' },
]
const PEOPLE = [
  { key: 'u1', label: '@王工', desc: '产品' },
  { key: 'u2', label: '@李工', desc: '研发' },
]

function useMenu(triggers = [{ char: '/', items: COMMANDS }, { char: '@', items: PEOPLE }]) {
  let api
  mount(
    defineComponent({
      setup() {
        api = useTriggerMenu({ triggers })
        return () => h('div')
      },
    }),
  )
  return api
}

describe('useTriggerMenu 触发边界', () => {
  it('行首的 / 触发，光标之后能过滤', () => {
    const m = useMenu()
    m.text.value = '/sum'
    m.caret.value = 4
    expect(m.visible.value).toBe(true)
    expect(m.active.value.char).toBe('/')
    expect(m.query.value).toBe('sum')
    expect(m.items.value.map((i) => i.key)).toEqual(['summarize'])
  })

  it('路径里的 / 不触发（触发符必须在词首）', () => {
    const m = useMenu()
    m.text.value = 'src/components/a.vue'
    m.caret.value = m.text.value.length
    expect(m.visible.value).toBe(false)
  })

  it('邮箱里的 @ 不触发', () => {
    const m = useMenu()
    m.text.value = 'wang@example.com'
    m.caret.value = m.text.value.length
    expect(m.visible.value).toBe(false)
  })

  it('空格后的 @ 触发；词内再打空格就关掉', () => {
    const m = useMenu()
    m.text.value = '请看 @王'
    m.caret.value = m.text.value.length
    expect(m.visible.value).toBe(true)
    expect(m.query.value).toBe('王')
    m.text.value = '请看 @王 工'
    m.caret.value = m.text.value.length
    expect(m.visible.value).toBe(false)
  })

  it('光标退到触发符之前就不触发（用户已经不在写这个词）', () => {
    const m = useMenu()
    m.text.value = '/summarize'
    m.caret.value = 0
    expect(m.visible.value).toBe(false)
  })

  it('换行会终结当前触发词', () => {
    const m = useMenu()
    m.text.value = '/sum\n'
    m.caret.value = m.text.value.length
    expect(m.visible.value).toBe(false)
  })

  it('查询词大小写不敏感，key 与 label 都参与匹配', () => {
    const m = useMenu()
    m.text.value = '/TRANSLATE'
    m.caret.value = m.text.value.length
    expect(m.items.value.map((i) => i.key)).toEqual(['translate'])
  })

  it('无查询词时给全部，受 limit 截断', () => {
    const m = useMenu()
    m.text.value = '/'
    m.caret.value = 1
    expect(m.items.value).toHaveLength(3)
    const capped = useMenu([{ char: '/', items: Array.from({ length: 20 }, (_, i) => ({ key: `c${i}`, label: `/c${i}` })) }])
    capped.text.value = '/'
    capped.caret.value = 1
    expect(capped.items.value).toHaveLength(8)
  })

  it('move 循环移动高亮；reset 归零', () => {
    const m = useMenu()
    m.text.value = '/'
    m.caret.value = 1
    m.move(1)
    expect(m.highlight.value).toBe(1)
    m.move(-1)
    m.move(-1)
    expect(m.highlight.value).toBe(2)
    m.reset()
    expect(m.highlight.value).toBe(0)
  })
})

describe('useTriggerMenu 选中后的文本', () => {
  it('默认把「触发符+查询词」换成 label 加一个空格，光标落在其后', () => {
    const m = useMenu()
    m.text.value = '/sum 这句话'
    m.caret.value = 4
    const out = m.pick(0)
    expect(out.text).toBe('/summarize  这句话')
    expect(out.caret).toBe('/summarize '.length)
  })

  it('自定义 insert 模板', () => {
    const m = useMenu([{ char: '@', items: PEOPLE, insert: (item) => `<${item.label}>` }])
    m.text.value = '@王'
    m.caret.value = 2
    expect(m.pick(0).text).toBe('<@王工> ')
  })

  it('自定义 apply 完全接管改写', () => {
    let seen
    let api
    mount(
      defineComponent({
        setup() {
          api = useTriggerMenu({
            triggers: [{ char: '/', items: COMMANDS }],
            apply: (text, from, to, inserted) => {
              seen = { from, to, inserted }
              return `[命令:${inserted}]`
            },
          })
          return () => h('div')
        },
      }),
    )
    api.text.value = '/clear 后面的字'
    api.caret.value = 6
    // 查询词 clear 已把候选过滤到 1 项
    expect(api.pick(0).text).toBe('[命令:/clear]')
    expect(seen).toEqual({ from: 0, to: 6, inserted: '/clear' })
  })

  it('越界或无效候选取不到，返回 null', () => {
    const m = useMenu()
    m.text.value = '/'
    m.caret.value = 1
    expect(m.pick(99)).toBeNull()
  })
})

describe('ChatCommandMenu', () => {
  it('渲染候选项的 label / desc / icon', () => {
    const w = mount(ChatCommandMenu, { props: { items: COMMANDS, visible: true, title: '命令' } })
    expect(w.find('.eb-chat-command__title').text()).toBe('命令')
    expect(w.findAll('.eb-chat-command__item')).toHaveLength(3)
    expect(w.text()).toContain('总结当前会话')
    expect(w.find('.eb-chat-command__icon').exists()).toBe(true)
    expect(w.attributes('role')).toBe('listbox')
  })

  it('高亮项带 is-highlight 与 aria-selected', () => {
    const w = mount(ChatCommandMenu, { props: { items: COMMANDS, visible: true, highlight: 1 } })
    const items = w.findAll('.eb-chat-command__item')
    expect(items[1].classes()).toContain('is-highlight')
    expect(items[1].attributes('aria-selected')).toBe('true')
    expect(items[0].attributes('aria-selected')).toBe('false')
  })

  it('鼠标移入抛 hover，按下抛 select（用 mousedown 以免抢焦点）', async () => {
    const w = mount(ChatCommandMenu, { props: { items: COMMANDS, visible: true } })
    await w.findAll('.eb-chat-command__item')[2].trigger('mouseenter')
    expect(w.emitted('hover')[0]).toEqual([2])
    await w.findAll('.eb-chat-command__item')[1].trigger('mousedown')
    expect(w.emitted('select')[0]).toEqual([1])
  })

  it('不可见或空列表不渲染', () => {
    expect(mount(ChatCommandMenu, { props: { items: COMMANDS, visible: false } }).find('.eb-chat-command').exists()).toBe(false)
    expect(mount(ChatCommandMenu, { props: { items: [], visible: true } }).find('.eb-chat-command').exists()).toBe(false)
  })

  it('无 title 时用默认 group 文案作为 aria-label', () => {
    const w = mount(ChatCommandMenu, { props: { items: COMMANDS, visible: true } })
    expect(w.attributes('aria-label')).toBe(chatLabels.command.group)
  })

  it('高亮变化时把该项滚进视野', async () => {
    const w = mount(ChatCommandMenu, { props: { items: COMMANDS, visible: true, highlight: 0 }, attachTo: document.body })
    const calls = []
    w.findAll('.eb-chat-command__item').forEach((item) => {
      item.element.scrollIntoView = () => calls.push(item.text())
    })
    await w.setProps({ highlight: 2 })
    await nextTick()
    expect(calls).toHaveLength(1)
    expect(calls[0]).toContain('/clear')
    w.unmount()
  })
})

describe('ChatSender 让出键盘', () => {
  it('menuOpen 时 Enter 不发送、改抛 menu-key', async () => {
    const w = mount(ChatSender, { props: { modelValue: '/sum', menuOpen: true } })
    const ta = w.find('.eb-chat-sender__textarea')
    await ta.trigger('keydown', { key: 'Enter' })
    expect(w.emitted('send')).toBeUndefined()
    expect(w.emitted('menu-key')[0]).toEqual(['enter'])
  })

  it('menuOpen 时方向键与 Esc 也归弹层，且不被当成发送', async () => {
    const w = mount(ChatSender, { props: { modelValue: '/s', menuOpen: true } })
    const ta = w.find('.eb-chat-sender__textarea')
    await ta.trigger('keydown', { key: 'ArrowDown' })
    await ta.trigger('keydown', { key: 'ArrowUp' })
    await ta.trigger('keydown', { key: 'Escape' })
    expect(w.emitted('menu-key').map((e) => e[0])).toEqual(['down', 'up', 'escape'])
  })

  it('menuOpen=false 时 Enter 照常发送（回归钉）', async () => {
    const w = mount(ChatSender, { props: { modelValue: '/sum' } })
    await w.find('.eb-chat-sender__textarea').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('send')[0][0]).toBe('/sum')
  })

  it('菜单开着时组合键仍能换行（Shift+Enter 不在让出之列）', async () => {
    const w = mount(ChatSender, { props: { modelValue: 'a', menuOpen: true } })
    await w.find('.eb-chat-sender__textarea').trigger('keydown', { key: 'Enter', shiftKey: true })
    expect(w.emitted('menu-key')).toBeUndefined()
    expect(w.emitted('send')).toBeUndefined()
  })

  it('IME 组字优先于弹层：组字中的 Enter 什么都不做', async () => {
    const w = mount(ChatSender, { props: { modelValue: 'a', menuOpen: true } })
    await w.find('.eb-chat-sender__textarea').trigger('keydown', { key: 'Enter', isComposing: true })
    expect(w.emitted('menu-key')).toBeUndefined()
    expect(w.emitted('send')).toBeUndefined()
  })

  it('输入与点击抛 caret-change；setCaret 能把光标放回去', async () => {
    const w = mount(ChatSender, { props: { modelValue: '' } })
    const ta = w.find('.eb-chat-sender__textarea')
    await ta.setValue('/su')
    expect(w.emitted('caret-change')).toBeTruthy()
    const calls = []
    ta.element.setSelectionRange = (a, b) => calls.push([a, b])
    w.vm.setCaret(3)
    expect(calls[0]).toEqual([3, 3])
    // 越界请求被夹到文本长度
    w.vm.setCaret(99)
    expect(calls[1]).toEqual([3, 3])
  })
})

describe('Chatbot 弹层槽位与事件透传', () => {
  it('sender-menu 槽位渲染在输入区上方，menu-key / caret-change 上抛', async () => {
    const w = mount(Chatbot, {
      props: { modelValue: [], showTip: false, menuOpen: true },
      slots: { 'sender-menu': '<div class="my-menu">命令</div>' },
    })
    expect(w.find('.my-menu').exists()).toBe(true)
    const ta = w.find('.eb-chat-sender__textarea')
    await ta.trigger('keydown', { key: 'Enter' })
    expect(w.emitted('menu-key')[0]).toEqual(['enter'])
    expect(w.emitted('send')).toBeUndefined()
  })
})
