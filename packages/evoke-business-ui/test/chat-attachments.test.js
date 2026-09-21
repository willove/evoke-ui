import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ChatSender from '../src/components/chatbot/ChatSender.vue'
import ChatAttachments from '../src/components/chatbot/ChatAttachments.vue'
import Chatbot from '../src/components/chatbot/Chatbot.vue'
import { matchesAccept, validateAttachment, formatBytes } from '../src/components/chatbot/utils'
import { chatLabels } from '../src/components/chatbot/labels'

/**
 * 附件投递：accept / 体积校验、拖拽与粘贴、上传态渲染
 */

// size 要真的反映到 File.size 上，否则体积校验的用例是空跑
const file = (name, type, size = 1024) => new File(['x'.repeat(size)], name, { type })

describe('accept 与体积校验', () => {
  it('.ext / mime/* / 精确 mime 三种写法都认', () => {
    const png = file('a.png', 'image/png')
    expect(matchesAccept(png, '.png')).toBe(true)
    expect(matchesAccept(png, '.PNG')).toBe(true)
    expect(matchesAccept(png, 'image/*')).toBe(true)
    expect(matchesAccept(png, 'image/png')).toBe(true)
    expect(matchesAccept(png, 'application/pdf')).toBe(false)
    expect(matchesAccept(png, 'image/jpeg, .png')).toBe(true)
    expect(matchesAccept(png, '')).toBe(true)
  })

  it('validateAttachment 给出可路由的原因', () => {
    const big = file('a.png', 'image/png', 5000)
    expect(validateAttachment(big, {})).toBeNull()
    expect(validateAttachment(big, { maxFileSize: 1000 })).toBe('size')
    expect(validateAttachment(big, { accept: 'application/pdf' })).toBe('type')
    expect(validateAttachment(null, {})).toBe('empty')
  })

  it('formatBytes 三档与非法值', () => {
    expect(formatBytes(0)).toBe('')
    expect(formatBytes(-1)).toBe('')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB')
  })
})

describe('ChatSender 文件投递', () => {
  const pickFileInput = (w) => w.find('.eb-chat-sender__file-input')

  it('选择文件走校验：通过则 attachment-add，类型不符则 reject(type)', async () => {
    const w = mount(ChatSender, { props: { modelValue: '', accept: 'image/*' } })
    const input = pickFileInput(w).element
    const good = file('a.png', 'image/png')
    Object.defineProperty(input, 'files', { value: [good], configurable: true })
    await pickFileInput(w).trigger('change')
    expect(w.emitted('attachment-add')[0][0]).toBe(good)
    // 第二发是错的类型
    const bad = file('b.pdf', 'application/pdf')
    Object.defineProperty(input, 'files', { value: [bad], configurable: true })
    await pickFileInput(w).trigger('change')
    const rej = w.emitted('attachment-reject')
    expect(rej[0][0]).toBe(bad)
    expect(rej[0][1]).toBe('type')
    expect(w.findAll('.eb-chat-attachments__item')).toHaveLength(1)
  })

  it('超体积 reject(size)，超数量 reject(limit)', async () => {
    const w = mount(ChatSender, { props: { modelValue: '', maxFileSize: 100, maxAttachments: 1 } })
    const input = pickFileInput(w).element
    Object.defineProperty(input, 'files', { value: [file('big.png', 'image/png', 9999)], configurable: true })
    await pickFileInput(w).trigger('change')
    expect(w.emitted('attachment-reject')[0][1]).toBe('size')

    const w2 = mount(ChatSender, { props: { modelValue: '', maxAttachments: 1 } })
    const input2 = pickFileInput(w2).element
    Object.defineProperty(input2, 'files', { value: [file('a.png', 'image/png'), file('b.png', 'image/png')], configurable: true })
    await pickFileInput(w2).trigger('change')
    expect(w2.emitted('attachment-reject')[0][1]).toBe('limit')
    expect(w2.findAll('.eb-chat-attachments__item')).toHaveLength(1)
  })

  it('accept 同步绑到原生 file input', () => {
    const w = mount(ChatSender, { props: { modelValue: '', accept: '.png,.pdf' } })
    expect(pickFileInput(w).attributes('accept')).toBe('.png,.pdf')
    const w2 = mount(ChatSender, { props: { modelValue: '' } })
    expect(pickFileInput(w2).attributes('accept')).toBeUndefined()
  })

  it('拖拽进入显示投放提示，drop 投递并复位', async () => {
    const w = mount(ChatSender, { props: { modelValue: '' } })
    const root = w.find('.eb-chat-sender')
    await root.trigger('dragenter')
    expect(root.classes()).toContain('is-dragover')
    expect(w.find('.eb-chat-sender__drop-hint').text()).toBe(chatLabels.sender.dropHint)
    const f = file('dropped.png', 'image/png')
    await root.trigger('drop', { dataTransfer: { files: [f] } })
    expect(root.classes()).not.toContain('is-dragover')
    expect(w.emitted('attachment-add')[0][0]).toBe(f)
  })

  it('dragleave 计数：子元素冒泡上来的 leave 不提前收起提示', async () => {
    const w = mount(ChatSender, { props: { modelValue: '' } })
    const root = w.find('.eb-chat-sender')
    await root.trigger('dragenter')
    await root.trigger('dragenter')
    await root.trigger('dragleave')
    expect(root.classes()).toContain('is-dragover')
    await root.trigger('dragleave')
    expect(root.classes()).not.toContain('is-dragover')
  })

  it('粘贴图片入附件；粘贴纯文本不拦默认行为', async () => {
    const w = mount(ChatSender, { props: { modelValue: '' } })
    const img = file('paste.png', 'image/png')
    const items = [{ kind: 'file', getAsFile: () => img }]
    const ev = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(ev, 'clipboardData', { value: { items } })
    w.find('.eb-chat-sender__textarea').element.dispatchEvent(ev)
    await nextTick()
    expect(ev.defaultPrevented).toBe(true)
    expect(w.emitted('attachment-add')[0][0]).toBe(img)

    const ev2 = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(ev2, 'clipboardData', { value: { items: [{ kind: 'string', getAsFile: () => null }] } })
    w.find('.eb-chat-sender__textarea').element.dispatchEvent(ev2)
    await nextTick()
    expect(ev2.defaultPrevented).toBe(false)
    expect(w.emitted('attachment-add')).toHaveLength(1)
  })

  it('allowDrop=false 时拖拽与粘贴都不生效', async () => {
    const w = mount(ChatSender, { props: { modelValue: '', allowDrop: false } })
    const root = w.find('.eb-chat-sender')
    await root.trigger('dragenter')
    expect(root.classes()).not.toContain('is-dragover')
    await root.trigger('drop', { dataTransfer: { files: [file('a.png', 'image/png')] } })
    expect(w.emitted('attachment-add')).toBeUndefined()
  })

  it('disabled 时拒绝投递', async () => {
    const w = mount(ChatSender, { props: { modelValue: '', disabled: true } })
    await w.find('.eb-chat-sender').trigger('drop', { dataTransfer: { files: [file('a.png', 'image/png')] } })
    expect(w.emitted('attachment-add')).toBeUndefined()
  })

  it('移除附件后图片预览回填不会写进已脱离的附件', async () => {
    const w = mount(ChatSender, { props: { modelValue: '' } })
    const input = pickFileInput(w).element
    Object.defineProperty(input, 'files', { value: [file('a.png', 'image/png')], configurable: true })
    await pickFileInput(w).trigger('change')
    await w.find('.eb-chat-attachments__remove').trigger('click')
    expect(w.findAll('.eb-chat-attachments__item')).toHaveLength(0)
    await new Promise((r) => setTimeout(r, 30))
    expect(w.findAll('.eb-chat-attachments__item')).toHaveLength(0)
  })
})

describe('ChatAttachments 上传态', () => {
  it('uploading 渲染进度条并夹取 0-100', () => {
    const w = mount(ChatAttachments, {
      props: { attachments: [{ id: '1', name: 'a.png', status: 'uploading', progress: 140 }] },
    })
    const bar = w.find('[role="progressbar"]')
    expect(bar.exists()).toBe(true)
    // 读屏值与视觉宽度同源，不能一个夹取一个不夹
    expect(bar.attributes('aria-valuenow')).toBe('100')
    expect(w.find('.eb-chat-attachments__bar-fill').attributes('style')).toContain('width: 100%')
    expect(w.find('.eb-chat-attachments__item').classes()).toContain('is-uploading')
  })

  it('progress 非法值归零，不产出 NaN 宽度', () => {
    const w = mount(ChatAttachments, {
      props: { attachments: [{ id: '1', name: 'a.png', status: 'uploading', progress: 'abc' }] },
    })
    expect(w.find('.eb-chat-attachments__bar-fill').attributes('style')).toContain('width: 0%')
  })

  it('error 显示失败文案，done 显示已上传', () => {
    const err = mount(ChatAttachments, {
      props: { attachments: [{ id: '1', name: 'a.png', status: 'error', error: '病毒扫描未通过' }] },
    })
    expect(err.find('.eb-chat-attachments__error').text()).toBe('病毒扫描未通过')
    expect(err.find('.eb-chat-attachments__item').classes()).toContain('is-error')
    const bare = mount(ChatAttachments, { props: { attachments: [{ id: '1', name: 'a.png', status: 'error' }] } })
    expect(bare.find('.eb-chat-attachments__error').text()).toBe(chatLabels.attachments.failed)
    const done = mount(ChatAttachments, {
      props: { attachments: [{ id: '1', name: 'a.png', status: 'done', progress: 100 }] },
    })
    expect(done.find('.eb-chat-attachments__done').text()).toBe(chatLabels.attachments.done)
  })

  it('无 status 的宿主附件（历史消息）不渲染任何状态位', () => {
    const w = mount(ChatAttachments, { props: { attachments: [{ id: '1', name: 'a.png', size: 2048 }] } })
    expect(w.find('[role="progressbar"]').exists()).toBe(false)
    expect(w.find('.eb-chat-attachments__error').exists()).toBe(false)
    expect(w.text()).toContain('2.0 KB')
  })
})

describe('Chatbot 投递透传', () => {
  it('accept / maxFileSize 传到 ChatSender，reject 带 (file, reason) 上抛', async () => {
    const w = mount(Chatbot, {
      props: { modelValue: [], showTip: false, accept: 'image/*', maxFileSize: 10 },
    })
    const sender = w.findComponent(ChatSender)
    expect(sender.props('accept')).toBe('image/*')
    expect(sender.props('maxFileSize')).toBe(10)
    const input = w.find('.eb-chat-sender__file-input').element
    const bad = file('b.pdf', 'application/pdf')
    Object.defineProperty(input, 'files', { value: [bad], configurable: true })
    await w.find('.eb-chat-sender__file-input').trigger('change')
    const rej = w.emitted('attachment-reject')
    expect(rej[0][0]).toBe(bad)
    expect(rej[0][1]).toBe('type')
  })
})
