import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EbAiPromptBox from '../src/components/ai-prompt-box/index.vue'

/**
 * AI 输入台：场景 chips / 能力开关 / 模型 pill / 额度 / 发送与停止 / 附件 / 键盘
 */

const SCENES = [
  { key: 'write', label: '创意写作', icon: 'edit' },
  { key: 'translate', label: '文本翻译', icon: 'file-list' },
]
const CAPS = [
  { key: 'deep-think', label: '深度思考', icon: 'brain' },
  { key: 'web', label: '联网搜索', icon: 'global' },
]
const MODELS = [
  { key: 'qwen-max', label: 'Qwen3.8-Max' },
  { key: 'glm-5', label: 'GLM-5' },
]

function mountBox(props = {}) {
  return mount(EbAiPromptBox, {
    props: {
      scenes: SCENES,
      capabilities: CAPS,
      models: MODELS,
      ...props,
    },
    attachTo: document.body,
  })
}

async function flush(wrapper, ms = 20) {
  await new Promise((r) => setTimeout(r, ms))
  return wrapper
}

describe('EbAiPromptBox 基础', () => {
  it('textarea 渲染 + 空文本时发送钮禁用', () => {
    const wrapper = mountBox()
    expect(wrapper.find('.eb-ai-prompt-box__board').exists()).toBe(true)
    expect(wrapper.find('.eb-ai-prompt-box__send').attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('v-model 双向与字数统计', async () => {
    const wrapper = mountBox({ showWordCount: true, maxLength: 100 })
    const textarea = wrapper.find('.eb-ai-prompt-box__textarea')
    await textarea.setValue('你好')
    expect(wrapper.emitted('update:modelValue')[0][0]).toBe('你好')
    expect(wrapper.find('.eb-ai-prompt-box__word-count').text()).toBe('2/100')
    wrapper.unmount()
  })
})

describe('EbAiPromptBox 场景', () => {
  it('chips 渲染；点击选中 → update:scene + 台内 tag', async () => {
    const wrapper = mountBox()
    const chips = wrapper.findAll('.eb-ai-prompt-box__scene-chip')
    expect(chips.length).toBe(2)
    await chips[1].trigger('click')
    expect(wrapper.emitted('update:scene')[0][0]).toBe('translate')
    expect(wrapper.emitted('scene-change')[0][0]).toBe('translate')
    await wrapper.setProps({ scene: 'translate' })
    expect(wrapper.find('.eb-ai-prompt-box__scene-tag').text()).toContain('文本翻译')
    wrapper.unmount()
  })

  it('点击已选 chip 取消；tag × 移除', async () => {
    const wrapper = mountBox({ scene: 'write' })
    await wrapper.find('.eb-ai-prompt-box__scene-tag .eb-ai-prompt-box__scene-tag-close').trigger('click')
    expect(wrapper.emitted('update:scene')[0][0]).toBe('')
    await wrapper.setProps({ scene: '' })
    await wrapper.findAll('.eb-ai-prompt-box__scene-chip')[0].trigger('click')
    await wrapper.setProps({ scene: 'write' })
    // 再点同一个 chip → 取消
    await wrapper.findAll('.eb-ai-prompt-box__scene-chip')[0].trigger('click')
    expect(wrapper.emitted('update:scene').at(-1)[0]).toBe('')
    wrapper.unmount()
  })
})

describe('EbAiPromptBox 能力开关', () => {
  it('点击切换 aria-pressed 与事件', async () => {
    const wrapper = mountBox()
    const caps = wrapper.findAll('.eb-ai-prompt-box__capability')
    expect(caps[0].attributes('aria-pressed')).toBe('false')
    await caps[0].trigger('click')
    expect(wrapper.emitted('update:activeCapabilities')[0][0]).toEqual(['deep-think'])
    expect(wrapper.emitted('capability-change')[0]).toEqual([['deep-think'], 'deep-think'])
    await wrapper.setProps({ activeCapabilities: ['deep-think'] })
    expect(wrapper.findAll('.eb-ai-prompt-box__capability')[0].attributes('aria-pressed')).toBe('true')
    wrapper.unmount()
  })
})

describe('EbAiPromptBox 模型选择', () => {
  it('pill 渲染当前模型；点击展开菜单（aria-expanded）', async () => {
    const wrapper = mountBox({ model: 'qwen-max' })
    const pill = wrapper.find('.eb-ai-prompt-box__model-pill')
    expect(pill.text()).toContain('Qwen3.8-Max')
    expect(pill.attributes('aria-expanded')).toBe('false')
    await pill.trigger('click')
    expect(pill.attributes('aria-expanded')).toBe('true')
    expect(wrapper.findAll('.eb-ai-prompt-box__model-item').length).toBe(2)
    wrapper.unmount()
  })

  it('选模型 → update:model + model-change，菜单收起', async () => {
    const wrapper = mountBox({ model: 'qwen-max' })
    await wrapper.find('.eb-ai-prompt-box__model-pill').trigger('click')
    await wrapper.findAll('.eb-ai-prompt-box__model-item')[1].trigger('click')
    expect(wrapper.emitted('update:model')[0][0]).toBe('glm-5')
    expect(wrapper.emitted('model-change')[0][0]).toBe('glm-5')
    expect(wrapper.find('.eb-ai-prompt-box__model-menu').exists()).toBe(false)
    wrapper.unmount()
  })

  it('Esc 关闭模型菜单', async () => {
    const wrapper = mountBox()
    await wrapper.find('.eb-ai-prompt-box__model-pill').trigger('click')
    expect(wrapper.find('.eb-ai-prompt-box__model-menu').exists()).toBe(true)
    await wrapper.find('.eb-ai-prompt-box__textarea').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('.eb-ai-prompt-box__model-menu').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('EbAiPromptBox 发送与停止', () => {
  it('Enter 发送完整上下文并清空输入', async () => {
    const onSend = vi.fn()
    const wrapper = mountBox({
      scene: 'translate',
      activeCapabilities: ['web'],
      model: 'qwen-max',
      onSend,
    })
    const textarea = wrapper.find('.eb-ai-prompt-box__textarea')
    await textarea.setValue('请翻译这段话')
    await textarea.trigger('keydown', { key: 'Enter' })
    const payload = wrapper.emitted('send')[0][0]
    expect(payload).toEqual({
      text: '请翻译这段话',
      scene: 'translate',
      capabilities: ['web'],
      model: 'qwen-max',
      attachments: [],
    })
    expect(wrapper.find('.eb-ai-prompt-box__textarea').element.value).toBe('')
    wrapper.unmount()
  })

  it('Shift+Enter 不发送', async () => {
    const wrapper = mountBox()
    const textarea = wrapper.find('.eb-ai-prompt-box__textarea')
    await textarea.setValue('a')
    await textarea.trigger('keydown', { key: 'Enter', shiftKey: true })
    expect(wrapper.emitted('send')).toBeUndefined()
    wrapper.unmount()
  })

  it('stoppable + loading：按钮切换为停止，点击 emit stop', async () => {
    const wrapper = mountBox({ stoppable: true, loading: true })
    const send = wrapper.find('.eb-ai-prompt-box__send')
    expect(send.classes()).toContain('is-stop')
    await send.trigger('click')
    expect(wrapper.emitted('stop')).toBeTruthy()
    expect(wrapper.emitted('send')).toBeUndefined()
    wrapper.unmount()
  })

  it('loading 且非 stoppable：发送被拦', async () => {
    const wrapper = mountBox({ loading: true })
    const textarea = wrapper.find('.eb-ai-prompt-box__textarea')
    await textarea.setValue('x')
    await textarea.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('send')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('EbAiPromptBox 额度与其他', () => {
  it('quota 字符串渲染 + 点击事件；对象形态取 label', async () => {
    const wrapper = mountBox({ quota: '剩余免费额度：100%' })
    await wrapper.find('.eb-ai-prompt-box__quota').trigger('click')
    expect(wrapper.emitted('quota-click')).toBeTruthy()
    wrapper.unmount()

    const w2 = mountBox({ quota: { label: '剩余 20%', percent: 20 } })
    expect(w2.find('.eb-ai-prompt-box__quota').text()).toContain('剩余 20%')
    w2.unmount()
  })

  it('附件选择渲染 tag 并进入 send 载荷', async () => {
    const wrapper = mountBox()
    const input = wrapper.find('.eb-ai-prompt-box__file-input')
    const file = new File(['abc'], '说明.txt', { type: 'text/plain' })
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
    await input.trigger('change')
    await flush(wrapper)
    expect(wrapper.find('.eb-ai-prompt-box__file-tag').text()).toContain('说明.txt')
    const textarea = wrapper.find('.eb-ai-prompt-box__textarea')
    await textarea.setValue('看附件')
    await textarea.trigger('keydown', { key: 'Enter' })
    const payload = wrapper.emitted('send')[0][0]
    expect(payload.attachments).toEqual([file])
    // 发送后附件清空
    expect(wrapper.find('.eb-ai-prompt-box__file-tag').exists()).toBe(false)
    wrapper.unmount()
  })

  it('disabled：工具钮与发送均不可用', async () => {
    const wrapper = mountBox({ disabled: true })
    expect(wrapper.find('.eb-ai-prompt-box__board').classes()).toContain('is-disabled')
    expect(wrapper.find('.eb-ai-prompt-box__send').attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('showSettings：设置按钮 emit settings-click', async () => {
    const wrapper = mountBox({ showSettings: true })
    await wrapper.find('.eb-ai-prompt-box__tool-btn[aria-label="设置"]').trigger('click')
    expect(wrapper.emitted('settings-click')).toBeTruthy()
    wrapper.unmount()
  })
})
