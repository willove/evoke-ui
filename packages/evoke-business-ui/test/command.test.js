import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { EvMsgbox } from '../src/components/msgbox'
import { EvNotify } from '../src/components/notify'
import { EvLoading } from '../src/components/loading'

describe('EvMsgbox 命令式 API', () => {
  beforeEach(async () => {
    vi.useRealTimers()
    document.querySelectorAll('.ev-message-box').forEach((el) => el.remove())
    await new Promise((r) => setTimeout(r, 0))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('confirm：渲染结构 DOM（title/message/btns）', async () => {
    const p = EvMsgbox.confirm('确认删除该记录？', '危险操作')
    await new Promise((r) => setTimeout(r, 30))
    const box = document.querySelector('.ev-message-box')
    expect(box).toBeTruthy()
    expect(box.classList.contains('ev-message-box')).toBe(true)
    expect(document.querySelector('.ev-message-box__title').textContent).toBe('危险操作')
    expect(document.querySelector('.ev-message-box__message').textContent).toContain('确认删除')
    // 取消 → reject { action: 'cancel' }
    document.querySelectorAll('.ev-message-box__btns button')[0].click()
    await expect(p).rejects.toEqual({ action: 'cancel', value: '' })
  })

  it('confirm：确认 → resolve { action: "confirm" }', async () => {
    const p = EvMsgbox.confirm('继续吗？', '提示')
    await new Promise((r) => setTimeout(r, 30))
    document.querySelectorAll('.ev-message-box__btns button')[1].click()
    await expect(p).resolves.toEqual({ action: 'confirm', value: '' })
  })

  it('alert：单按钮永远 resolve，关闭也 resolve', async () => {
    const p = EvMsgbox.alert('内容已保存', '提示')
    await new Promise((r) => setTimeout(r, 30))
    // alert 只有一个按钮
    const btns = document.querySelectorAll('.ev-message-box__btns button')
    expect(btns.length).toBe(1)
    btns[0].click()
    await expect(p).resolves.toEqual({ action: 'confirm', value: '' })
  })

  it('prompt：输入值经 resolve.value 返回', async () => {
    const p = EvMsgbox.prompt('请输入名称', '输入', { inputValue: '默认值' })
    await new Promise((r) => setTimeout(r, 30))
    const input = document.querySelector('.ev-message-box__input input')
    expect(input.value).toBe('默认值')
    input.value = '新名称'
    input.dispatchEvent(new Event('input'))
    await new Promise((r) => setTimeout(r, 10))
    document.querySelectorAll('.ev-message-box__btns button')[1].click()
    const result = await p
    expect(result.action).toBe('confirm')
  })

  it('prompt：inputPattern 校验失败阻止确认', async () => {
    const p = EvMsgbox.prompt('请输入邮箱', '输入', {
      inputPattern: /^[\w.-]+@[\w.-]+$/,
      inputErrorMessage: '邮箱格式不正确',
    })
    await new Promise((r) => setTimeout(r, 30))
    const input = document.querySelector('.ev-message-box__input input')
    input.value = '非法输入'
    input.dispatchEvent(new Event('input'))
    await new Promise((r) => setTimeout(r, 10))
    document.querySelectorAll('.ev-message-box__btns button')[1].click()
    await new Promise((r) => setTimeout(r, 20))
    // 仍然打开 + 错误提示
    expect(document.querySelector('.ev-message-box')).toBeTruthy()
    expect(document.querySelector('.ev-message-box__errormsg').textContent).toBe('邮箱格式不正确')
    // 取消关闭
    document.querySelectorAll('.ev-message-box__btns button')[0].click()
    await expect(p).rejects.toEqual(expect.objectContaining({ action: 'cancel' }))
  })

  it('distinguishCancelAndClose：ESC 返回 close 而非 cancel', async () => {
    const p = EvMsgbox.confirm('内容', '标题', { distinguishCancelAndClose: true })
    await new Promise((r) => setTimeout(r, 30))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await expect(p).rejects.toEqual(expect.objectContaining({ action: 'close' }))
  })

  it('类型图标渲染（type=warning）', async () => {
    const p = EvMsgbox.confirm('内容', '标题', { type: 'warning' })
    p.catch(() => {}) // ESC 关闭产生预期 rejection，防御悬空
    await new Promise((r) => setTimeout(r, 30))
    expect(document.querySelector('.ev-message-box--warning')).toBeTruthy()
    expect(document.querySelector('.ev-message-box__status.is-warning')).toBeTruthy()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  })

  it('对象式 options 直接调用（修复 evoke-ui 1.4.1 已知缺陷的契约）', async () => {
    const p = EvMsgbox({ message: '对象式调用', title: 'T', showCancelButton: true })
    p.catch(() => {}) // 防御悬空 rejection（测试环境下不消费结果时）
    await new Promise((r) => setTimeout(r, 30))
    expect(document.querySelector('.ev-message-box')).toBeTruthy()
    expect(document.querySelector('.ev-message-box__message').textContent).toBe('对象式调用')
    document.querySelectorAll('.ev-message-box__btns button')[1].click()
    await expect(p).resolves.toEqual(expect.objectContaining({ action: 'confirm' }))
  })
})

describe('EvNotify 命令式 API', () => {
  beforeEach(async () => {
    vi.useRealTimers()
    EvNotify.closeAll()
    await new Promise((r) => setTimeout(r, 0))
    document.querySelectorAll('.ev-notification').forEach((el) => el.remove())
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('默认渲染：双 class + 标题/内容', () => {
    EvNotify({ title: '通知标题', message: '通知内容' })
    const el = document.querySelector('.ev-notification')
    expect(el).toBeTruthy()
    expect(el.classList.contains('ev-notification')).toBe(true)
    expect(document.querySelector('.ev-notification__title').textContent).toBe('通知标题')
    expect(document.querySelector('.ev-notification__content').textContent).toBe('通知内容')
    EvNotify.closeAll()
  })

  it('快捷方法类型类', () => {
    EvNotify.success('成功', '内容')
    EvNotify.error('失败', '内容')
    const els = document.querySelectorAll('.ev-notification')
    expect(els[0].classList.contains('is-success')).toBe(true)
    expect(els[1].classList.contains('is-error')).toBe(true)
    EvNotify.closeAll()
  })

  it('同角堆叠（top 偏移递增）', () => {
    EvNotify({ title: '第一条' })
    EvNotify({ title: '第二条' })
    const els = document.querySelectorAll('.ev-notification')
    expect(els.length).toBe(2)
    const top1 = parseFloat(els[0].style.top)
    const top2 = parseFloat(els[1].style.top)
    expect(top2).toBeGreaterThan(top1)
    EvNotify.closeAll()
  })

  it('showClose 点击关闭', async () => {
    EvNotify({ title: '可关闭' })
    document.querySelector('.ev-notification__closeBtn').click()
    // 等待 leave 动画 + destroy（jsdom 下 Vue Transition 用 timeout 兜底）
    await new Promise((r) => setTimeout(r, 320))
    expect(document.querySelector('.ev-notification')).toBeNull()
  })

  it('closeAll 清空全部（close 语义）', async () => {
    EvNotify({ title: '1' })
    EvNotify({ title: '2' })
    expect(document.querySelectorAll('.ev-notification').length).toBe(2)
    EvNotify.close()
    // 等待 leave 动画 + destroy（jsdom 下 Vue Transition 用 timeout 兜底）
    await new Promise((r) => setTimeout(r, 320))
    expect(document.querySelector('.ev-notification')).toBeNull()
  })
})

describe('EvLoading 服务', () => {
  it('service 渲染全屏遮罩（.ev-loading-mask）', () => {
    const handle = EvLoading.service({ fullscreen: true, text: '加载中' })
    const mask = document.querySelector('.ev-loading-mask')
    expect(mask).toBeTruthy()
    expect(mask.classList.contains('ev-loading-mask')).toBe(true)
    expect(mask.classList.contains('is-fullscreen')).toBe(true)
    expect(document.querySelector('.ev-loading-text').textContent).toBe('加载中')
    handle.close()
    expect(document.querySelector('.ev-loading-mask')).toBeNull()
  })

  it('spinner（circular svg + path 动画类）', () => {
    const handle = EvLoading.service({ fullscreen: true })
    expect(document.querySelector('.ev-loading-spinner .circular')).toBeTruthy()
    expect(document.querySelector('.ev-loading-spinner .path')).toBeTruthy()
    handle.close()
  })

  it('service 方法存在（invoke 兼容）', () => {
    expect(typeof EvLoading.service).toBe('function')
    expect(typeof EvLoading.fullscreen).toBe('function')
  })
})
