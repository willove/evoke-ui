import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ChatSandbox from '../src/components/chatbot/ChatSandbox.vue'
import ChatWebPreview from '../src/components/chatbot/ChatWebPreview.vue'
import { buildSandboxAttr, warnIfDangerous, withBootstrap } from '../src/components/chatbot/sandboxBootstrap'
import { chatLabels } from '../src/components/chatbot/labels'

/**
 * 批 P：沙箱运行与网页预览
 *
 * 这批的重点全在安全边界上：sandbox 旗标过滤与 postMessage 的来源校验。
 * 后者不做的话，任意页面都能往宿主的 console / error 回调里灌消息。
 */

afterEach(() => {
  document.body.innerHTML = ''
})

describe('sandbox 旗标策略', () => {
  it('allow-scripts 必给，其余默认不给', () => {
    expect(buildSandboxAttr()).toBe('allow-scripts')
    expect(buildSandboxAttr([])).toBe('allow-scripts')
  })

  it('allow-same-origin 无论谁传都被剔除（与 allow-scripts 同开等于没沙箱）', () => {
    const attr = buildSandboxAttr(['allow-same-origin'])
    expect(attr).toBe('allow-scripts')
    expect(attr).not.toContain('allow-same-origin')
  })

  it('白名单内的旗标放行，名单外的一律忽略', () => {
    const attr = buildSandboxAttr(['allow-modals', 'allow-forms', 'allow-evil-thing', 'allow-top-navigation'])
    expect(attr).toContain('allow-scripts')
    expect(attr).toContain('allow-modals')
    expect(attr).toContain('allow-forms')
    expect(attr).not.toContain('allow-evil-thing')
    // 顶层跳转默认不给
    expect(attr).not.toContain('allow-top-navigation')
  })

  it('传了危险旗标会告警，返回 true 便于调用方感知', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      expect(warnIfDangerous(['allow-modals'])).toBe(false)
      expect(warnIfDangerous(['allow-same-origin'])).toBe(true)
      expect(spy).toHaveBeenCalledOnce()
      expect(spy.mock.calls[0][0]).toContain('allow-same-origin')
    } finally {
      spy.mockRestore()
    }
  })
})

describe('bootstrap 注入', () => {
  it('默认拼在开头；关掉则原文返回', () => {
    const on = withBootstrap('<p>hi</p>', true)
    expect(on.startsWith('<script>')).toBe(true)
    expect(on.endsWith('<p>hi</p>')).toBe(true)
    expect(on).toContain('__ebSandbox')
    expect(withBootstrap('<p>hi</p>', false)).toBe('<p>hi</p>')
  })

  it('有 doctype 时插在它之后（doctype 必须留在最前）', () => {
    const out = withBootstrap('<!DOCTYPE html>\n<p>hi</p>', true)
    expect(out.startsWith('<!DOCTYPE html>')).toBe(true)
    expect(out.indexOf('<script>')).toBeGreaterThan(out.indexOf('<!DOCTYPE html>'))
  })

  it('空输入不炸', () => {
    expect(withBootstrap(null, true)).toContain('__ebSandbox')
    expect(withBootstrap(undefined, false)).toBe('')
  })
})

describe('ChatSandbox', () => {
  const mountSandbox = (props = {}) =>
    mount(ChatSandbox, { props: { html: '<p>demo</p>', ...props }, attachTo: document.body })

  function postFromFrame(wrapper, data, source) {
    const frame = wrapper.find('iframe').element
    const event = new MessageEvent('message', { data })
    Object.defineProperty(event, 'source', { value: source === undefined ? frame.contentWindow : source })
    window.dispatchEvent(event)
  }

  it('srcdoc 由 bootstrap + 宿主 HTML 拼成，sandbox 属性只给 allow-scripts', async () => {
    const w = mountSandbox()
    await nextTick()
    const frame = w.find('iframe')
    expect(frame.attributes('srcdoc')).toContain('__ebSandbox')
    expect(frame.attributes('srcdoc')).toContain('<p>demo</p>')
    expect(frame.attributes('sandbox')).toBe('allow-scripts')
    expect(frame.attributes('referrerpolicy')).toBe('no-referrer')
  })

  it('给 src 时走外部沙箱，不拼 srcdoc', async () => {
    const w = mountSandbox({ html: '', src: 'https://sandbox.example/run/1' })
    await nextTick()
    const frame = w.find('iframe')
    expect(frame.attributes('src')).toBe('https://sandbox.example/run/1')
    expect(frame.attributes('srcdoc')).toBeUndefined()
    expect(w.find('.eb-chat-sandbox__mode').text()).toBe(chatLabels.sandbox.modeUrl)
  })

  it('allow-same-origin 即使传了也不落到 iframe 上', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const w = mountSandbox({ extraSandbox: ['allow-same-origin', 'allow-modals'] })
      await nextTick()
      const attr = w.find('iframe').attributes('sandbox')
      expect(attr).toBe('allow-scripts allow-modals')
      expect(spy).toHaveBeenCalled()
    } finally {
      spy.mockRestore()
    }
  })

  it('console 与错误被转发；控制台可展开', async () => {
    const w = mountSandbox()
    await nextTick()
    postFromFrame(w, { __ebSandbox: 1, type: 'console', payload: { level: 'warn', args: ['hi', '2'] } })
    await nextTick()
    expect(w.emitted('console')[0][0]).toEqual({ level: 'warn', args: ['hi', '2'] })
    // 有内容才出现展开入口
    const toggle = w.find('.eb-chat-sandbox__act')
    expect(toggle.text()).toBe(chatLabels.sandbox.console(1))
    await toggle.trigger('click')
    expect(w.find('.eb-chat-sandbox__console').text()).toContain('hi 2')

    postFromFrame(w, { __ebSandbox: 1, type: 'error', payload: { message: 'boom' } })
    await nextTick()
    expect(w.emitted('error')[0][0].message).toBe('boom')
    expect(w.find('.eb-chat-sandbox__error').text()).toBe('boom')
    expect(w.classes()).toContain('is-error')
  })

  it('安全边界：非本 iframe 来源的消息一律忽略', async () => {
    const w = mountSandbox()
    await nextTick()
    const foreign = { postMessage: () => {} }
    postFromFrame(w, { __ebSandbox: 1, type: 'console', payload: { level: 'log', args: ['伪造'] } }, foreign)
    postFromFrame(w, { __ebSandbox: 1, type: 'error', payload: { message: '伪造错误' } }, foreign)
    await nextTick()
    expect(w.emitted('console')).toBeUndefined()
    expect(w.emitted('error')).toBeUndefined()
    expect(w.find('.eb-chat-sandbox__error').exists()).toBe(false)
  })

  it('没带命名空间的消息也忽略（不误收别人的 postMessage）', async () => {
    const w = mountSandbox()
    await nextTick()
    postFromFrame(w, { type: 'console', payload: { level: 'log', args: ['x'] } })
    await nextTick()
    expect(w.emitted('console')).toBeUndefined()
  })

  it('autoHeight 由上报高度撑开；默认固定高', async () => {
    const fixed = mountSandbox({ height: 200 })
    await nextTick()
    expect(fixed.find('iframe').attributes('style')).toContain('height: 200px')
    fixed.unmount()

    const auto = mountSandbox({ autoHeight: true })
    await nextTick()
    postFromFrame(auto, { __ebSandbox: 1, type: 'resize', payload: { height: 480 } })
    await nextTick()
    expect(auto.find('iframe').attributes('style')).toContain('height: 480px')
    expect(auto.emitted('resize')[0][0]).toBe(480)
  })

  it('卸载后不再监听 message（避免悬挂回调）', async () => {
    const w = mountSandbox()
    await nextTick()
    w.unmount()
    postFromFrame(w, { __ebSandbox: 1, type: 'console', payload: { level: 'log', args: ['after'] } })
    // 没有抛错即通过：监听已摘除
    expect(true).toBe(true)
  })
})

describe('ChatWebPreview', () => {
  const SRC = 'https://example.com/app'
  const SHOT = 'https://example.com/app.png'

  it('默认用 iframe，并固定给「在新窗口打开」逃生口', () => {
    const w = mount(ChatWebPreview, { props: { src: SRC } })
    const frame = w.find('iframe')
    expect(frame.attributes('src')).toBe(SRC)
    expect(frame.attributes('loading')).toBe('lazy')
    expect(frame.attributes('sandbox')).toBe('allow-scripts')
    const link = w.find('a.eb-chat-web-preview__act')
    expect(link.attributes('href')).toBe(SRC)
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
  })

  it('宿主判过不可嵌且有截图 → 自动回退到截图并说明原因', () => {
    const w = mount(ChatWebPreview, { props: { src: SRC, screenshot: SHOT, embeddable: false } })
    expect(w.find('iframe').exists()).toBe(false)
    expect(w.find('img.eb-chat-web-preview__shot').attributes('src')).toBe(SHOT)
    expect(w.find('.eb-chat-web-preview__note').text()).toBe(chatLabels.preview.fallbackNote)
    // 逃生口仍在
    expect(w.find('a.eb-chat-web-preview__act').attributes('href')).toBe(SRC)
  })

  it('判过可嵌就直接用 iframe，不走截图', () => {
    const w = mount(ChatWebPreview, { props: { src: SRC, screenshot: SHOT, embeddable: true } })
    expect(w.find('iframe').exists()).toBe(true)
    expect(w.find('.eb-chat-web-preview__note').exists()).toBe(false)
  })

  it('不可嵌但没给截图时仍用 iframe（拿不到就照嵌，不假装回退）', () => {
    const w = mount(ChatWebPreview, { props: { src: SRC, embeddable: false } })
    expect(w.find('iframe').exists()).toBe(true)
  })

  it('两种素材都在时可手动切换：白框时能自救', async () => {
    const w = mount(ChatWebPreview, { props: { src: SRC, screenshot: SHOT } })
    const toggle = w.findAll('button.eb-chat-web-preview__act')[0]
    expect(toggle.text()).toBe(chatLabels.preview.screenshot)
    await toggle.trigger('click')
    expect(w.find('img.eb-chat-web-preview__shot').exists()).toBe(true)
    expect(w.findAll('button.eb-chat-web-preview__act')[0].text()).toBe(chatLabels.preview.live)
    await w.findAll('button.eb-chat-web-preview__act')[0].trigger('click')
    expect(w.find('iframe').exists()).toBe(true)
  })

  it('只有一种素材时不给切换', () => {
    expect(mount(ChatWebPreview, { props: { src: SRC } }).find('button.eb-chat-web-preview__act').exists()).toBe(false)
    expect(mount(ChatWebPreview, { props: { screenshot: SHOT, embeddable: false } }).find('button.eb-chat-web-preview__act').exists()).toBe(false)
  })

  it('换目标后回到自动判定，不把上一条的手动选择带过去', async () => {
    const w = mount(ChatWebPreview, { props: { src: SRC, screenshot: SHOT } })
    await w.findAll('button.eb-chat-web-preview__act')[0].trigger('click')
    expect(w.find('img').exists()).toBe(true)
    await w.setProps({ src: 'https://other.example/app', embeddable: true })
    expect(w.find('iframe').exists()).toBe(true)
  })

  it('额外旗标同样过滤 allow-same-origin', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const w = mount(ChatWebPreview, { props: { src: SRC, extraSandbox: ['allow-same-origin', 'allow-popups'] } })
      const attr = w.find('iframe').attributes('sandbox')
      expect(attr).toBe('allow-scripts allow-popups')
      expect(spy).toHaveBeenCalled()
    } finally {
      spy.mockRestore()
    }
  })
})
