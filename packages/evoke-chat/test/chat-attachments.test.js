import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ChatSender from '../src/components/chatbot/ChatSender.vue'
import ChatAttachments from '../src/components/chatbot/ChatAttachments.vue'
import Chatbot from '../src/components/chatbot/Chatbot.vue'
import ChatQueue from '../src/components/chatbot/ChatQueue.vue'
import { matchesAccept, validateAttachment, formatBytes } from '../src/components/chatbot/utils'
import { chatLabels } from '../src/components/chatbot/labels'
import { fileIconFor, fileKindFor, fileIconToneFor } from '../src/components/chatbot/fileIcons'
import EbIcon from '../../evoke-business-ui/src/components/icon/index.vue'

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

describe('ChatSender 宿主回写附件状态', () => {
  it('attachment-add 交出的是响应式代理：宿主改 status / progress 能驱动 chip', async () => {
    // 曾因把闭包里的原始对象 emit 出去而静默失效——数组里存的是代理，
    // 改原始对象不触发任何更新，等于这条 API 白给
    const w = mount(ChatSender, { props: { modelValue: '' } })
    const input = w.find('.eb-chat-sender__file-input').element
    Object.defineProperty(input, 'files', { value: [file('a.png', 'image/png')], configurable: true })
    await w.find('.eb-chat-sender__file-input').trigger('change')
    const item = w.emitted('attachment-add')[0][1]
    item.status = 'uploading'
    item.progress = 42
    await nextTick()
    expect(w.find('[role="progressbar"]').exists()).toBe(true)
    expect(w.find('.eb-chat-attachments__bar-fill').attributes('style')).toContain('width: 42%')
    item.status = 'error'
    item.error = '扫描未通过'
    await nextTick()
    expect(w.find('.eb-chat-attachments__error').text()).toBe('扫描未通过')
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

// ── 生成中的输入排队（UI 侧） ──

describe('ChatSender queueable', () => {
  it('未开 queueable：生成中拦下（回归钉）', async () => {
    const w = mount(ChatSender, { props: { modelValue: '排队问题', loading: true } })
    await w.find('.eb-chat-sender__textarea').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('send')).toBeUndefined()
    expect(w.find('.eb-chat-sender__send-btn').attributes('disabled')).toBeDefined()
  })

  it('开了 queueable：生成中照常发出，由宿主交给引擎排队', async () => {
    const w = mount(ChatSender, { props: { modelValue: '排队问题', loading: true, stoppable: true, queueable: true } })
    await w.find('.eb-chat-sender__textarea').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('send')[0][0]).toBe('排队问题')
  })

  it('queueable 与 stoppable 互不干扰：停止钮仍可点、点了抛 stop 而不是发送', async () => {
    const w = mount(ChatSender, { props: { modelValue: '', loading: true, stoppable: true, queueable: true } })
    const btn = w.find('.eb-chat-sender__send-btn')
    expect(btn.classes()).toContain('is-stop')
    await btn.trigger('click')
    expect(w.emitted('stop')).toHaveLength(1)
    expect(w.emitted('send')).toBeUndefined()
  })
})

describe('ChatQueue', () => {
  const ITEMS = [
    { id: 'q1', content: '第二个问题' },
    { id: 'q2', content: '', attachments: [{ name: 'a.png' }] },
  ]

  it('空队列不渲染', () => {
    expect(mount(ChatQueue, { props: { items: [] } }).find('.eb-chat-queue').exists()).toBe(false)
  })

  it('逐条显示并标序号；仅附件的条目不空着', () => {
    const w = mount(ChatQueue, { props: { items: ITEMS } })
    expect(w.find('.eb-chat-queue__lead').text()).toContain('2 条排队')
    const items = w.findAll('.eb-chat-queue__item')
    expect(items[0].text()).toContain('第二个问题')
    expect(items[1].text()).toContain(chatLabels.queue.attachmentOnly)
    expect(items[0].find('.eb-chat-queue__index').text()).toBe('1')
  })

  it('移除单条与清空各自抛出', async () => {
    const w = mount(ChatQueue, { props: { items: ITEMS } })
    await w.findAll('.eb-chat-queue__remove')[1].trigger('click')
    expect(w.emitted('remove')[0]).toEqual(['q2'])
    await w.find('.eb-chat-queue__clear').trigger('click')
    expect(w.emitted('clear')).toHaveLength(1)
  })
})

describe('附件图标接在组件上（不是只测纯函数）', () => {
  it('卡片渲染的图标名来自后缀映射，而不是写死的通用图标', () => {
    const w = mount(ChatAttachments, {
      props: {
        attachments: [
          { id: 'f1', name: '季度报表.pdf' },
          { id: 'f2', name: 'main.ts' },
          { id: 'f3', name: '素材包.zip' },
          { id: 'f4', name: '无后缀' },
        ],
      },
    })
    // 直接读传给 EbIcon 的 name：DOM 里只剩解析后的 svg，名字当面拿才准
    const names = w.findAllComponents(EbIcon).map((n) => n.props('name'))
    expect(names).toEqual(['file-pdf', 'file-code', 'file-zip', 'document'])
    w.unmount()
  })
})

describe('附件图标的染色开关', () => {
  const files = [
    { id: 'f1', name: '季度报表.pdf' },
    { id: 'f2', name: 'main.ts' },
    { id: 'f3', name: '无后缀' },
  ]

  it('默认按类型染色：图标容器带 is-tone-* 类', () => {
    const w = mount(ChatAttachments, { props: { attachments: files } })
    const classes = w.findAll('.eb-chat-attachments__icon').map((n) => n.classes().find((c) => c.startsWith('is-tone-')) ?? '')
    expect(classes).toEqual(['is-tone-danger', 'is-tone-primary', ''])
    w.unmount()
  })

  it('colored=false 时一律不染色（统一跟随正文色）', () => {
    const w = mount(ChatAttachments, { props: { attachments: files, colored: false } })
    const tones = w.findAll('.eb-chat-attachments__icon').map((n) => n.classes().filter((c) => c.startsWith('is-tone-')))
    expect(tones.flat()).toEqual([])
    w.unmount()
  })
})

describe('附件图标按后缀匹配', () => {
  it('常见后缀各有专用图标（大小写不敏感）', () => {
    expect(fileIconFor({ name: '季度报表.pdf' })).toBe('file-pdf')
    expect(fileIconFor({ name: 'data.XLSX' })).toBe('file-excel')
    expect(fileIconFor({ name: '会议纪要.docx' })).toBe('file-word')
    expect(fileIconFor({ name: '方案.pptx' })).toBe('file-ppt')
    expect(fileIconFor({ name: 'src.tar' })).toBe('file-zip')
    expect(fileIconFor({ name: 'main.ts' })).toBe('file-code')
    expect(fileIconFor({ name: 'photo.png' })).toBe('file-image')
    expect(fileIconFor({ name: '录音.mp3' })).toBe('file-music')
    expect(fileIconFor({ name: '演示.mp4' })).toBe('file-video')
    expect(fileIconFor({ name: '说明.txt' })).toBe('file-text')
  })

  it('没有后缀时退 MIME 大类；都没有给通用文档图标', () => {
    expect(fileIconFor({ name: 'noext', type: 'image/jpeg' })).toBe('file-image')
    expect(fileIconFor({ name: 'noext', type: 'application/pdf' })).toBe('file-pdf')
    expect(fileIconFor({ name: 'noext', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })).toBe('file-excel')
    expect(fileIconFor({ name: '在制品' })).toBe('document')
    expect(fileIconFor(null)).toBe('document')
  })

  it('类型色调：office/media 各自一色，未知类型不染色', () => {
    expect(fileIconToneFor({ name: '报表.pdf' })).toBe('danger')
    expect(fileIconToneFor({ name: 'a.docx' })).toBe('primary')
    expect(fileIconToneFor({ name: 'a.xlsx' })).toBe('success')
    expect(fileIconToneFor({ name: 'a.pptx' })).toBe('warning')
    expect(fileIconToneFor({ name: 'a.zip' })).toBe('info')
    expect(fileIconToneFor({ name: 'a.png' })).toBe('success')
    expect(fileIconToneFor({ name: 'a.mp4' })).toBe('danger')
    expect(fileIconToneFor({ name: 'a.ts' })).toBe('primary')
    // 认不出的类型不染色（跟随正文色），不做无意义的猜测
    expect(fileIconToneFor({ name: '在制品' })).toBe('')
    expect(fileKindFor({ name: '在制品' })).toBe('file')
  })

  it('后缀优先于 MIME：MIME 缺失或写错也能认对', () => {
    expect(fileIconFor({ name: '报表.pdf', type: '' })).toBe('file-pdf')
    expect(fileIconFor({ name: '报表.pdf', type: 'application/octet-stream' })).toBe('file-pdf')
  })
})
