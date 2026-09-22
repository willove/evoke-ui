import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, defineComponent, h, ref } from 'vue'
import EbConfigProvider from '../../evoke-business-ui/src/components/config-provider/index.vue'
import ChatActionbar from '../src/components/chatbot/ChatActionbar.vue'
import ChatMarkdown from '../src/components/chatbot/ChatMarkdown.vue'
import ChatMessage from '../src/components/chatbot/ChatMessage.vue'
import ChatSender from '../src/components/chatbot/ChatSender.vue'
import EbAiPromptBox from '../src/components/ai-prompt-box/index.vue'
import EbAiConsole from '../src/components/ai-console/index.vue'
import { chatLabels, useChatLabels } from '../src/components/chatbot/labels'
import { useChatEngine } from '../src/components/chatbot/useChatEngine'
import { renderChatMarkdown } from '../src/components/chatbot/chatMarkdown'
import { globalLocale } from '../../evoke-business-ui/src/composables/useLocale'
import { zhCN as zhBase, en as enBase, ja } from '../../evoke-business-ui/src/locale'
import chatZhCN from '../src/locale/zh-CN'
import chatEn from '../src/locale/en'

/**
 * 对话家族 i18n（文案随 @wil-works/evoke-chat 走）
 * - 文案只有一份，住在本包语言包里（src/locale/{zh-CN,en}.js）
 * - 语言名由底座定：组件经 useChatLabels() 读 EbConfigProvider 的 locale，
 *   按 name 在自己包里取译文，切语言就地更新
 * - 没译文（或键缺失）的语言停在基准包 zh-CN，不渲染成裸键
 */

const PENDING_KEY_HINT = 'actionbar.copy'

function flatten(obj, prefix = '') {
  const out = new Set()
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (Array.isArray(value)) {
      value.forEach((item, i) => out.add(`${path}[${i}]`))
    } else if (value && typeof value === 'object') {
      for (const p of flatten(value, path)) out.add(p)
    } else {
      out.add(path)
    }
  }
  return out
}

function withLocale(locale) {
  return mount(
    defineComponent({
      components: { EbConfigProvider },
      setup() {
        return () => h(EbConfigProvider, { locale }, { default: () => h(ChatActionbar, { message: { id: 'm1', role: 'assistant', content: 'hi' } }) })
      },
    })
  )
}

afterEach(() => {
  globalLocale.value = zhBase
})

describe('chat 文案与语言包', () => {
  it('en 与 zh-CN 键位同构（首批译文不走暂缺豁免）', () => {
    const base = flatten(chatZhCN)
    const translated = flatten(chatEn)
    const missing = [...base].filter((p) => !translated.has(p))
    const extra = [...translated].filter((p) => !base.has(p))
    expect(missing, `en 缺少: ${missing.join(', ')}`).toEqual([])
    expect(extra, `en 多出: ${extra.join(', ')}`).toEqual([])
  })

  it('英文值真的落到了语言包里，不是照搬中文', () => {
    expect(chatEn.actionbar.copy).toBe('Copy')
    expect(chatEn.message.assistant).toBe('Assistant')
    expect(chatEn.markdown.copyCode).toBe('Copy code')
    // 带参函数同样要走译文包
    expect(chatEn.markdown.citation(2)).toBe('View source 2')
    // AI 输入台 / 工作台也在同一张表里
    expect(chatEn.promptBox.placeholder).not.toBe(chatZhCN.promptBox.placeholder)
    expect(chatEn.console.tip).toBe('AI-generated content is for reference only')
  })

  it('静态 chatLabels 仍是基准包（非组件调用方的兜底）', () => {
    expect(chatLabels.actionbar.copy).toBe(chatZhCN.actionbar.copy)
    expect(chatLabels.actionbar.copy).toBe('复制')
  })

  it('renderChatMarkdown 不传 labels 时用静态基准文案', () => {
    const html = renderChatMarkdown('```js\nconst a = 1;\n```')
    expect(html).toContain(chatZhCN.markdown.copyCode)
  })
})

describe('组件取文案：随 locale 走', () => {
  it('全局 locale 切到 en：已挂载组件就地改文案', async () => {
    const wrapper = mount(ChatActionbar, { props: { message: { id: 'm1', role: 'assistant', content: 'hi' } } })
    const copyBtn = () => wrapper.findAll('.eb-chat-actionbar__btn')[0]
    expect(copyBtn().attributes('aria-label')).toBe('复制')

    globalLocale.value = enBase
    await nextTick()
    expect(copyBtn().attributes('aria-label')).toBe('Copy')

    wrapper.unmount()
  })

  it('EbConfigProvider locale 只作用于子树，不动全局', () => {
    const scoped = withLocale(enBase)
    expect(scoped.findAll('.eb-chat-actionbar__btn')[0].attributes('aria-label')).toBe('Copy')
    scoped.unmount()

    const bare = mount(ChatActionbar, { props: { message: { id: 'm1', role: 'assistant', content: 'hi' } } })
    expect(bare.findAll('.eb-chat-actionbar__btn')[0].attributes('aria-label')).toBe('复制')
    bare.unmount()
  })

  it('缺 chat 的语言包（ja）回退中文，不出现裸键', () => {
    const wrapper = withLocale(ja)
    const label = wrapper.findAll('.eb-chat-actionbar__btn')[0].attributes('aria-label')
    expect(label).toBe('复制')
    expect(label).not.toContain(PENDING_KEY_HINT)
    wrapper.unmount()
  })

  it('默认显示名随语言切换（我 / AI助手 → You / Assistant）', async () => {
    const wrapper = mount(ChatMessage, {
      props: { message: { id: 'm1', role: 'assistant', content: 'hi', status: 'done' } },
    })
    expect(wrapper.find('.eb-chat-message__name').text()).toBe('AI助手')

    globalLocale.value = enBase
    await nextTick()
    expect(wrapper.find('.eb-chat-message__name').text()).toBe('Assistant')
    // 头像取首字，跟着显示名走
    expect(wrapper.find('.eb-chat-message__avatar').text()).toBe('A')
    wrapper.unmount()
  })

  it('宿主显式传的名字优先于译文', () => {
    const wrapper = mount(ChatMessage, {
      props: { message: { id: 'm1', role: 'assistant', content: 'hi', status: 'done' }, assistantName: '小助手' },
    })
    expect(wrapper.find('.eb-chat-message__name').text()).toBe('小助手')
    wrapper.unmount()
  })

  it('输入区占位文案随 locale；宿主传值优先', () => {
    const scoped = mount(
      defineComponent({
        components: { EbConfigProvider },
        setup: () => () => h(EbConfigProvider, { locale: enBase }, { default: () => h(ChatSender) }),
      })
    )
    expect(scoped.find('textarea').attributes('placeholder')).toBe(chatEn.sender.placeholder)
    scoped.unmount()

    const named = mount(ChatSender, { props: { placeholder: '跟我说点什么' } })
    expect(named.find('textarea').attributes('placeholder')).toBe('跟我说点什么')
    named.unmount()
  })

  it('烘进 HTML 的文案（代码块复制条）跟着重渲染', async () => {
    const locale = ref(zhBase)
    const wrapper = mount(
      defineComponent({
        components: { EbConfigProvider },
        setup: () => () =>
          h(EbConfigProvider, { locale: locale.value }, { default: () => h(ChatMarkdown, { content: '```js\nconst a = 1;\n```' }) }),
      })
    )
    const barText = () => wrapper.find('.eb-chat-code__copy-text').text()
    expect(barText()).toBe('复制代码')

    locale.value = enBase
    await nextTick()
    expect(barText()).toBe('Copy code')
    wrapper.unmount()
  })

  it('useChatLabels 返回响应式引用：切语言后同一引用读到新值', async () => {
    let labels = null
    const Probe = defineComponent({
      setup() {
        labels = useChatLabels()
        return () => null
      },
    })
    const wrapper = mount(Probe)
    expect(labels.actionbar.copy).toBe('复制')

    globalLocale.value = enBase
    await nextTick()
    expect(labels.actionbar.copy).toBe('Copy')

    wrapper.unmount()
  })

  it('EbAiPromptBox：按钮与占位随 language 走，宿主传值优先', () => {
    const scoped = mount(
      defineComponent({
        components: { EbConfigProvider },
        setup: () => () => h(EbConfigProvider, { locale: enBase }, { default: () => h(EbAiPromptBox, { scenes: [{ key: 's1', label: 'S1' }], showSettings: true }) }),
      })
    )
    expect(scoped.find('textarea').attributes('placeholder')).toBe(chatEn.promptBox.placeholder)
    const labelsOf = (sel) => scoped.findAll(sel).map((n) => n.attributes('aria-label'))
    expect(labelsOf('.eb-ai-prompt-box__tool-btn')).toContain('Add attachment')
    expect(labelsOf('.eb-ai-prompt-box__tool-btn')).toContain('Settings')
    expect(labelsOf('.eb-ai-prompt-box__send')).toEqual(['Send'])
    expect(scoped.find('.eb-ai-prompt-box__scenes').attributes('aria-label')).toBe('Scenes')
    scoped.unmount()

    const named = mount(EbAiPromptBox, { props: { placeholder: '写点什么' } })
    expect(named.find('textarea').attributes('placeholder')).toBe('写点什么')
    named.unmount()
  })

  it('EbAiConsole：底部提示与默认显示名随 language 走', () => {
    const scoped = mount(
      defineComponent({
        components: { EbConfigProvider },
        setup() {
          const engine = useChatEngine({
            initialMessages: [{ id: 'm1', role: 'assistant', content: 'hi', status: 'done', createdAt: 1 }],
          })
          return () =>
            h(EbConfigProvider, { locale: enBase }, { default: () => h(EbAiConsole, { engine }) })
        },
      })
    )
    expect(scoped.find('.eb-ai-console__tip').text()).toBe(chatEn.console.tip)
    expect(scoped.find('.eb-chat-message__name').text()).toBe('Assistant')
    expect(scoped.find('textarea').attributes('placeholder')).toBe(chatEn.promptBox.placeholder)
    scoped.unmount()
  })
})
