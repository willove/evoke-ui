import {
  mount, describe, it, expect, vi,
  EvAiPromptBox,
} from './helpers'

/**
 * EvAiPromptBox — AI 输入台：场景 / 能力 / 模型 / 额度 / 发送与停止 / 附件 / 键盘
 */

const SCENES = [
  { key: 'write', label: '创意写作' },
  { key: 'translate', label: '文本翻译', icon: 'file-list' },
]
const CAPS = [
  { key: 'deep-think', label: '深度思考' },
  { key: 'web', label: '联网搜索' },
]
const MODELS = [
  { key: 'qwen-max', label: 'Qwen3.8-Max' },
  { key: 'glm-5', label: 'GLM-5' },
]

function mountBox(props = {}) {
  return mount(EvAiPromptBox, {
    props: { scenes: SCENES, capabilities: CAPS, models: MODELS, ...props },
    attachTo: document.body,
  })
}

describe('EvAiPromptBox 基础', () => {
  it('输入台结构 + 空文本发送禁用', () => {
    const wrapper = mountBox()
    expect(wrapper.find('.ev-ai-prompt-box__board').exists()).toBe(true)
    expect(wrapper.find('.ev-ai-prompt-box__send').attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('v-model 回传与字数统计', async () => {
    const wrapper = mountBox({ showWordCount: true, maxLength: 100 })
    await wrapper.find('.ev-ai-prompt-box__textarea').setValue('你好')
    expect(wrapper.emitted('update:modelValue')[0][0]).toBe('你好')
    expect(wrapper.find('.ev-ai-prompt-box__word-count').text()).toBe('2/100')
    wrapper.unmount()
  })

  it('maxLength 绑定 textarea maxlength；未传不绑', () => {
    const withLimit = mountBox({ maxLength: 20 })
    expect(withLimit.find('.ev-ai-prompt-box__textarea').attributes('maxlength')).toBe('20')
    withLimit.unmount()
    const noLimit = mountBox()
    expect(noLimit.find('.ev-ai-prompt-box__textarea').attributes('maxlength')).toBeUndefined()
    expect(noLimit.find('.ev-ai-prompt-box__word-count').exists()).toBe(false)
    noLimit.unmount()
  })
})

describe('EvAiPromptBox 场景与能力', () => {
  it('chip 选中 → update:scene + 台内 tag；再点取消；tag × 移除', async () => {
    const wrapper = mountBox()
    const chips = wrapper.findAll('.ev-ai-prompt-box__scene-chip')
    await chips[1].trigger('click')
    expect(wrapper.emitted('update:scene')[0][0]).toBe('translate')
    await wrapper.setProps({ scene: 'translate' })
    expect(wrapper.find('.ev-ai-prompt-box__scene-tag').text()).toContain('文本翻译')
    await wrapper.find('.ev-ai-prompt-box__tag-close').trigger('click')
    expect(wrapper.emitted('update:scene').at(-1)[0]).toBe('')
    await wrapper.setProps({ scene: '' })
    await wrapper.findAll('.ev-ai-prompt-box__scene-chip')[0].trigger('click')
    await wrapper.setProps({ scene: 'write' })
    await wrapper.findAll('.ev-ai-prompt-box__scene-chip')[0].trigger('click')
    expect(wrapper.emitted('update:scene').at(-1)[0]).toBe('')
    wrapper.unmount()
  })

  it('能力开关 aria-pressed 与事件', async () => {
    const wrapper = mountBox()
    const caps = wrapper.findAll('.ev-ai-prompt-box__capability')
    expect(caps[0].attributes('aria-pressed')).toBe('false')
    await caps[0].trigger('click')
    expect(wrapper.emitted('update:activeCapabilities')[0][0]).toEqual(['deep-think'])
    expect(wrapper.emitted('capability-change')[0]).toEqual([['deep-think'], 'deep-think'])
    await wrapper.setProps({ activeCapabilities: ['deep-think'] })
    expect(wrapper.findAll('.ev-ai-prompt-box__capability')[0].attributes('aria-pressed')).toBe('true')
    wrapper.unmount()
  })
})

describe('EvAiPromptBox 模型选择', () => {
  it('pill 展开 / 选择 / 菜单收起', async () => {
    const wrapper = mountBox({ model: 'qwen-max' })
    const pill = wrapper.find('.ev-ai-prompt-box__model-pill')
    expect(pill.text()).toContain('Qwen3.8-Max')
    await pill.trigger('click')
    expect(pill.attributes('aria-expanded')).toBe('true')
    await wrapper.findAll('.ev-ai-prompt-box__model-item')[1].trigger('click')
    expect(wrapper.emitted('update:model')[0][0]).toBe('glm-5')
    expect(wrapper.emitted('model-change')[0][0]).toBe('glm-5')
    expect(wrapper.find('.ev-ai-prompt-box__model-menu').exists()).toBe(false)
    wrapper.unmount()
  })

  it('Esc 关闭菜单', async () => {
    const wrapper = mountBox()
    await wrapper.find('.ev-ai-prompt-box__model-pill').trigger('click')
    await wrapper.find('.ev-ai-prompt-box__textarea').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('.ev-ai-prompt-box__model-menu').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('EvAiPromptBox 发送与停止', () => {
  it('Enter 发送完整上下文并清空', async () => {
    const wrapper = mountBox({
      scene: 'translate',
      activeCapabilities: ['web'],
      model: 'qwen-max',
    })
    const textarea = wrapper.find('.ev-ai-prompt-box__textarea')
    await textarea.setValue('请翻译这段话')
    await textarea.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('send')[0][0]).toEqual({
      text: '请翻译这段话',
      scene: 'translate',
      capabilities: ['web'],
      model: 'qwen-max',
      attachments: [],
    })
    expect(wrapper.find('.ev-ai-prompt-box__textarea').element.value).toBe('')
    wrapper.unmount()
  })

  it('Shift+Enter 不发送', async () => {
    const wrapper = mountBox()
    const textarea = wrapper.find('.ev-ai-prompt-box__textarea')
    await textarea.setValue('a')
    await textarea.trigger('keydown', { key: 'Enter', shiftKey: true })
    expect(wrapper.emitted('send')).toBeUndefined()
    wrapper.unmount()
  })

  it('stoppable + loading：切换停止钮（CSS 方块）并 emit stop', async () => {
    const wrapper = mountBox({ stoppable: true, loading: true })
    const send = wrapper.find('.ev-ai-prompt-box__send')
    expect(send.classes()).toContain('is-stop')
    expect(send.find('.ev-ai-prompt-box__stop-square').exists()).toBe(true)
    await send.trigger('click')
    expect(wrapper.emitted('stop')).toBeTruthy()
    expect(wrapper.emitted('send')).toBeUndefined()
    wrapper.unmount()
  })

  it('附件进入 send 载荷并在发送后清空', async () => {
    const wrapper = mountBox()
    const input = wrapper.find('.ev-ai-prompt-box__file-input')
    const file = new File(['abc'], 'a.txt', { type: 'text/plain' })
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
    await input.trigger('change')
    await wrapper.find('.ev-ai-prompt-box__textarea').setValue('看附件')
    await wrapper.find('.ev-ai-prompt-box__textarea').trigger('keydown', { key: 'Enter' })
    const payload = wrapper.emitted('send')[0][0]
    expect(payload.attachments).toEqual([file])
    expect(wrapper.find('.ev-ai-prompt-box__scene-tag--file').exists()).toBe(false)
    wrapper.unmount()
  })

  it('quota 胶囊点击；showSettings 设置点击', async () => {
    const wrapper = mountBox({ quota: { label: '剩余 20%', percent: 20 }, showSettings: true })
    await wrapper.find('.ev-ai-prompt-box__quota').trigger('click')
    expect(wrapper.emitted('quota-click')).toBeTruthy()
    await wrapper.find('.ev-ai-prompt-box__tool-btn[aria-label="设置"]').trigger('click')
    expect(wrapper.emitted('settings-click')).toBeTruthy()
    wrapper.unmount()
  })
})
