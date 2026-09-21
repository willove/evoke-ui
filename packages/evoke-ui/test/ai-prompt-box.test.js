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

// ── 附件投递：拖拽 / 粘贴 / 类型体积校验 ──

const mkFile = (name, type, size = 4) => new File(['xxxx'.repeat(size)], name, { type })

describe('EvAiPromptBox 附件投递', () => {
  const boardSel = '.ev-ai-prompt-box__board'
  const inputSel = '.ev-ai-prompt-box__file-input'
  const taSel = '.ev-ai-prompt-box__textarea'
  const chipSel = '.ev-ai-prompt-box__scene-tag--file'

  it('accept 绑到原生 file input；未传则不绑', () => {
    const w = mountBox({ accept: '.png,.pdf' })
    expect(w.find(inputSel).attributes('accept')).toBe('.png,.pdf')
    const w2 = mountBox()
    expect(w2.find(inputSel).attributes('accept')).toBeUndefined()
    w.unmount(); w2.unmount()
  })

  it('选择文件：通过则 attachment-add(file, item)，类型不符 reject(type)', async () => {
    const w = mountBox({ accept: 'image/*' })
    const el = w.find(inputSel).element
    const good = mkFile('a.png', 'image/png')
    Object.defineProperty(el, 'files', { value: [good], configurable: true })
    await w.find(inputSel).trigger('change')
    const add = w.emitted('attachment-add')
    expect(add[0][0]).toBe(good)
    expect(add[0][1]).toMatchObject({ name: 'a.png', status: 'ready' })
    const bad = mkFile('b.pdf', 'application/pdf')
    Object.defineProperty(el, 'files', { value: [bad], configurable: true })
    await w.find(inputSel).trigger('change')
    const rej = w.emitted('attachment-reject')
    expect(rej[0][0]).toBe(bad)
    expect(rej[0][1]).toBe('type')
    expect(w.findAll(chipSel)).toHaveLength(1)
    w.unmount()
  })

  it('超体积 reject(size)；超数量 reject(limit)', async () => {
    const w = mountBox({ maxFileSize: 2 })
    const el = w.find(inputSel).element
    Object.defineProperty(el, 'files', { value: [mkFile('big.png', 'image/png', 50)], configurable: true })
    await w.find(inputSel).trigger('change')
    expect(w.emitted('attachment-reject')[0][1]).toBe('size')
    w.unmount()

    const w2 = mountBox({ maxAttachments: 1 })
    const el2 = w2.find(inputSel).element
    Object.defineProperty(el2, 'files', { value: [mkFile('a.png', 'image/png'), mkFile('b.png', 'image/png')], configurable: true })
    await w2.find(inputSel).trigger('change')
    expect(w2.emitted('attachment-reject')[0][1]).toBe('limit')
    expect(w2.findAll(chipSel)).toHaveLength(1)
    w2.unmount()
  })

  it('拖拽进入显示遮罩，drop 投递；dragleave 计数不提前收起', async () => {
    const w = mountBox()
    const board = w.find(boardSel)
    await board.trigger('dragenter')
    expect(board.classes()).toContain('is-dragover')
    expect(w.find('.ev-ai-prompt-box__drop-hint').text()).toBe('松开以上传文件')
    await board.trigger('dragenter')
    await board.trigger('dragleave')
    expect(board.classes()).toContain('is-dragover')
    const f = mkFile('d.png', 'image/png')
    await board.trigger('drop', { dataTransfer: { files: [f] } })
    expect(board.classes()).not.toContain('is-dragover')
    expect(w.emitted('attachment-add')[0][0]).toBe(f)
    w.unmount()
  })

  it('粘贴图片入附件；粘贴纯文本不拦默认行为', async () => {
    const w = mountBox()
    const ta = w.find(taSel).element
    const img = mkFile('p.png', 'image/png')
    const ev = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(ev, 'clipboardData', { value: { items: [{ kind: 'file', getAsFile: () => img }] } })
    ta.dispatchEvent(ev)
    await w.vm.$nextTick()
    expect(ev.defaultPrevented).toBe(true)
    expect(w.emitted('attachment-add')[0][0]).toBe(img)

    const ev2 = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(ev2, 'clipboardData', { value: { items: [{ kind: 'string', getAsFile: () => null }] } })
    ta.dispatchEvent(ev2)
    await w.vm.$nextTick()
    expect(ev2.defaultPrevented).toBe(false)
    expect(w.emitted('attachment-add')).toHaveLength(1)
    w.unmount()
  })

  it('allowDrop=false 与 disabled 都拒绝投递', async () => {
    const w = mountBox({ allowDrop: false })
    const board = w.find(boardSel)
    await board.trigger('dragenter')
    expect(board.classes()).not.toContain('is-dragover')
    await board.trigger('drop', { dataTransfer: { files: [mkFile('a.png', 'image/png')] } })
    expect(w.emitted('attachment-add')).toBeUndefined()
    w.unmount()

    const w2 = mountBox({ disabled: true })
    await w2.find(boardSel).trigger('drop', { dataTransfer: { files: [mkFile('a.png', 'image/png')] } })
    expect(w2.emitted('attachment-add')).toBeUndefined()
    w2.unmount()
  })

  it('宿主回写 attachment-add 交出的对象后，chip 显示上传中与失败', async () => {
    // 不碰组件内部状态：宿主拿到的就是投递进列表的那个对象
    const w = mountBox()
    const el = w.find(inputSel).element
    Object.defineProperty(el, 'files', { value: [mkFile('a.png', 'image/png')], configurable: true })
    await w.find(inputSel).trigger('change')
    const item = w.emitted('attachment-add')[0][1]
    item.status = 'uploading'
    item.progress = 42
    await w.vm.$nextTick()
    expect(w.text()).toContain('42%')
    item.status = 'error'
    item.error = '病毒扫描未通过'
    await w.vm.$nextTick()
    expect(w.text()).toContain('病毒扫描未通过')
    expect(w.find(chipSel).classes()).toContain('is-error')
    w.unmount()
  })
})
