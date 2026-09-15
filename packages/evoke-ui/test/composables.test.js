import { mount, describe, it, expect, vi, defineComponent, ref } from './helpers'
import { useScrollProgress } from '../src/composables/useScrollProgress'
import { onInView } from '../src/composables/useInView'
import { useUncontrolled } from '../src/composables/useUncontrolled'
import { useCopy } from '../src/composables/useCopy'
import { getScrollParent, getScrollTop } from '../src/utils/scroll'
import { REVEAL_TYPES } from '../src/directives/reveal'

// —— 测试基建 ——

// jsdom 的 IntersectionObserver 存缺因版本而异；reveal 模块在加载期捕获它，
// 因此用 resetModules + 动态 import 保证走定分支
function makeFakeIO() {
  class FakeIO {
    constructor(cb, options) {
      this.cb = cb
      this.options = options
      FakeIO.instances.push(this)
    }
    observe(el) { (this.observed ??= []).push(el) }
    unobserve(el) { (this.unobserved ??= []).push(el) }
  }
  FakeIO.instances = []
  return FakeIO
}

function withGlobal(IO, fn) {
  const saved = globalThis.IntersectionObserver
  if (IO) globalThis.IntersectionObserver = IO
  else delete globalThis.IntersectionObserver
  vi.resetModules()
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      if (saved !== undefined) globalThis.IntersectionObserver = saved
      else delete globalThis.IntersectionObserver
      vi.resetModules()
    })
}

// —— useScrollProgress ——

// jsdom getBoundingClientRect 恒 0，按场景桩定；innerHeight 用 jsdom 默认 768
function mountProgress(rect, options = {}) {
  const api = {}
  const Harness = defineComponent({
    setup() {
      const el = ref(null)
      Object.assign(api, useScrollProgress(el, options))
      return { el }
    },
    template: '<div ref="el" class="target"></div>',
  })
  const wrapper = mount(Harness)
  wrapper.find('.target').element.getBoundingClientRect = () => rect
  return { wrapper, api }
}

async function scrollOnce(wrapper) {
  window.dispatchEvent(new Event('scroll'))
  await new Promise((r) => requestAnimationFrame(r))
  await wrapper.vm.$nextTick()
}

describe('useScrollProgress', () => {
  it('元素穿过视口折算 0..1，越过两端钳制', async () => {
    const rect = { top: 0, height: 1536 } // span = 1536 − 768 = 768
    const { wrapper, api } = mountProgress(rect)
    await scrollOnce(wrapper)
    expect(api.progress.value).toBe(0)

    rect.top = -384 // 384 / 768
    await scrollOnce(wrapper)
    expect(api.progress.value).toBe(0.5)

    rect.top = -99999
    await scrollOnce(wrapper)
    expect(api.progress.value).toBe(1)
  })

  it('上滚回溯：进度随 top 增大而回退', async () => {
    const rect = { top: -768, height: 1536 }
    const { wrapper, api } = mountProgress(rect)
    await scrollOnce(wrapper)
    expect(api.progress.value).toBe(1)

    rect.top = -230.4
    await scrollOnce(wrapper)
    expect(api.progress.value).toBeCloseTo(0.3, 5)
  })

  it('可钉长度 ≤ 0（元素矮于视口）进度钉 0', async () => {
    const rect = { top: -9999, height: 500 }
    const { wrapper, api } = mountProgress(rect)
    await scrollOnce(wrapper)
    expect(api.progress.value).toBe(0)
  })

  it('offset 函数形式参与几何', async () => {
    // span = 1868 − 768 + 100 = 1200；(100 − (−500)) / 1200 = 0.5
    const { wrapper, api } = mountProgress({ top: -500, height: 1868 }, { offset: () => 100 })
    await scrollOnce(wrapper)
    expect(api.progress.value).toBe(0.5)
  })

  it('offset 字符串形式生效，非法值回 0', async () => {
    // span = 1536 − 768 + 48 = 816；(48 − (−360)) / 816 = 0.5
    const a = mountProgress({ top: -360, height: 1536 }, { offset: '48' })
    await scrollOnce(a.wrapper)
    expect(a.api.progress.value).toBe(0.5)

    const b = mountProgress({ top: -360, height: 1536 }, { offset: 'abc' })
    await scrollOnce(b.wrapper)
    // offset 按 0 算：span = 768，(0 + 360) / 768 ≈ 0.46875
    expect(b.api.progress.value).toBeCloseTo(360 / 768, 5)
  })

  it('prefers-reduced-motion：进度钉终态 1 且不随滚动变化', async () => {
    const realMatch = window.matchMedia
    window.matchMedia = (q) => ({ matches: q.includes('reduce'), addEventListener() {}, removeEventListener() {} })
    try {
      const rect = { top: 0, height: 1536 }
      const { wrapper, api } = mountProgress(rect)
      expect(api.reduced.value).toBe(true)
      expect(api.progress.value).toBe(1)

      rect.top = -384
      await scrollOnce(wrapper)
      expect(api.progress.value).toBe(1)
    } finally {
      window.matchMedia = realMatch
    }
  })

  it('卸载时解绑 window 监听', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { wrapper } = mountProgress({ top: 0, height: 1536 })
    wrapper.unmount()
    const names = removeSpy.mock.calls.map((c) => c[0])
    expect(names).toContain('scroll')
    expect(names).toContain('resize')
    removeSpy.mockRestore()
  })
})

// —— onInView ——

describe('onInView', () => {
  it('无 IntersectionObserver 环境走 onFallback 降级', async () => {
    const onEnter = vi.fn()
    const onFallback = vi.fn()
    let cleanup
    await withGlobal(null, () => {
      const el = document.createElement('div')
      cleanup = onInView(el, onEnter, onFallback)
    })
    expect(onFallback).toHaveBeenCalledTimes(1)
    expect(onEnter).not.toHaveBeenCalled()
    expect(typeof cleanup).toBe('function')
    expect(() => cleanup()).not.toThrow()
  })

  it('IO 存在时 observe 进入元素，isIntersecting 才回调并取消重复观察', async () => {
    const FakeIO = makeFakeIO()
    const el = document.createElement('div')
    const onEnter = vi.fn()
    let cleanup
    await withGlobal(FakeIO, () => {
      cleanup = onInView(el, onEnter)
    })
    const io = FakeIO.instances.at(-1)
    expect(io.observed).toEqual([el])

    io.cb([{ isIntersecting: false, target: el }])
    expect(onEnter).not.toHaveBeenCalled()

    const entry = { isIntersecting: true, target: el }
    io.cb([entry])
    expect(onEnter).toHaveBeenCalledWith(entry)
    expect(io.unobserved).toEqual([el])

    cleanup()
    expect(io.unobserved).toEqual([el, el])
  })
})

// —— useUncontrolled ——

function mountCtrl(props = {}, options = {}) {
  const api = {}
  const Harness = defineComponent({
    props: { modelValue: { type: null, default: undefined } },
    setup(p) {
      Object.assign(api, useUncontrolled(p, options))
    },
    template: '<div />',
  })
  const wrapper = mount(Harness, { props })
  return { wrapper, api }
}

describe('useUncontrolled', () => {
  it('非受控：set 直接驱动内部值，defaultValue 提供初值', () => {
    const { api } = mountCtrl({}, { defaultValue: 'a' })
    expect(api.isControlled.value).toBe(false)
    expect(api.value.value).toBe('a')
    api.set('b')
    expect(api.value.value).toBe('b')
  })

  it('非受控且未给 defaultValue：初值取 props.modelValue（通常 undefined）', () => {
    const { api } = mountCtrl({})
    expect(api.value.value).toBeUndefined()
    api.set('x')
    expect(api.value.value).toBe('x')
  })

  it('受控：值由宿主 modelValue 驱动，set 只返回入参不改值', async () => {
    const { wrapper, api } = mountCtrl({ modelValue: 'a' })
    expect(api.isControlled.value).toBe(true)
    expect(api.value.value).toBe('a')
    expect(api.set('b')).toBe('b')
    expect(api.value.value).toBe('a')
    await wrapper.setProps({ modelValue: 'b' })
    expect(api.value.value).toBe('b')
  })

  it('只传 onUpdate:modelValue 也算受控', () => {
    const { api } = mountCtrl({ 'onUpdate:modelValue': () => {} })
    expect(api.isControlled.value).toBe(true)
  })
})

// —— useCopy ——

const clipboardDesc = Object.getOwnPropertyDescriptor(navigator, 'clipboard')

function stubClipboard(value) {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true })
}

function restoreClipboard() {
  if (clipboardDesc) Object.defineProperty(navigator, 'clipboard', clipboardDesc)
  else delete navigator.clipboard
}

// execCommand / textarea.select 在 jsdom 的存缺不定，统一以赋值桩定并在 finally 还原
function stubExecCommand(impl) {
  const orig = document.execCommand
  document.execCommand = impl
  const proto = HTMLTextAreaElement.prototype
  const origSelect = typeof proto.select === 'function' ? proto.select : null
  proto.select = function () {}
  return () => {
    if (orig === undefined) delete document.execCommand
    else document.execCommand = orig
    if (origSelect) proto.select = origSelect
    else delete proto.select
  }
}

describe('useCopy', () => {
  it('Clipboard API 可用：写入原文并置 copied，resetDelay 后自动复位', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubClipboard({ writeText })
    vi.useFakeTimers()
    try {
      const { copy, copied } = useCopy(1500)
      expect(await copy('hello')).toBe(true)
      expect(writeText).toHaveBeenCalledWith('hello')
      expect(copied.value).toBe(true)
      vi.advanceTimersByTime(1499)
      expect(copied.value).toBe(true)
      vi.advanceTimersByTime(1)
      expect(copied.value).toBe(false)
    } finally {
      vi.useRealTimers()
      restoreClipboard()
    }
  })

  it('非字符串入参转 String；null 归空串', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubClipboard({ writeText })
    try {
      const { copy } = useCopy()
      await copy(42)
      expect(writeText).toHaveBeenCalledWith('42')
      await copy(null)
      expect(writeText).toHaveBeenCalledWith('')
    } finally {
      restoreClipboard()
    }
  })

  it('Clipboard API 拒绝写入时降级 execCommand 成功', async () => {
    stubClipboard({ writeText: () => Promise.reject(new Error('denied')) })
    const restore = stubExecCommand(() => true)
    try {
      const { copy, copied } = useCopy()
      expect(await copy('fallback')).toBe(true)
      expect(copied.value).toBe(true)
    } finally {
      restore()
      restoreClipboard()
    }
  })

  it('Clipboard 不可用时降级 execCommand 成功', async () => {
    stubClipboard(undefined)
    const restore = stubExecCommand(() => true)
    try {
      const { copy } = useCopy()
      expect(await copy('legacy')).toBe(true)
    } finally {
      restore()
      restoreClipboard()
    }
  })

  it('两条路都失败：返回 false 且 copied 不置位', async () => {
    stubClipboard(undefined)
    const restore = stubExecCommand(() => false)
    try {
      const { copy, copied } = useCopy()
      expect(await copy('x')).toBe(false)
      expect(copied.value).toBe(false)
    } finally {
      restore()
      restoreClipboard()
    }
  })
})

// —— utils/scroll ——

describe('utils/scroll', () => {
  it('getScrollTop：window 读 pageYOffset、元素读 scrollTop、空值回 0', () => {
    const desc = Object.getOwnPropertyDescriptor(window, 'pageYOffset')
    Object.defineProperty(window, 'pageYOffset', { value: 120, configurable: true })
    try {
      expect(getScrollTop(window)).toBe(120)
    } finally {
      if (desc) Object.defineProperty(window, 'pageYOffset', desc)
      else delete window.pageYOffset
    }

    const el = document.createElement('div')
    Object.defineProperty(el, 'scrollTop', { value: 88, configurable: true })
    expect(getScrollTop(el)).toBe(88)
    expect(getScrollTop(null)).toBe(0)
    expect(getScrollTop(undefined)).toBe(0)
  })

  it('getScrollParent：命中最近的可滚动祖先', () => {
    const outer = document.createElement('div')
    outer.style.overflowY = 'auto'
    // jsdom 无布局，scrollHeight/clientHeight 恒 0，按场景桩定
    Object.defineProperty(outer, 'scrollHeight', { value: 500, configurable: true })
    Object.defineProperty(outer, 'clientHeight', { value: 100, configurable: true })
    const inner = document.createElement('div')
    outer.appendChild(inner)
    document.body.appendChild(outer)
    try {
      expect(getScrollParent(inner)).toBe(outer)
      expect(getScrollParent(outer)).toBe(window) // outer 之上是 body → 回退 window
    } finally {
      outer.remove()
    }
  })

  it('getScrollParent：无可滚动祖先回退 window', () => {
    const plain = document.createElement('div')
    document.body.appendChild(plain)
    try {
      expect(getScrollParent(plain)).toBe(window)
      expect(getScrollParent(null)).toBe(window)
    } finally {
      plain.remove()
    }
  })
})

// —— v-reveal / revealElement ——

describe('v-reveal / revealElement', () => {
  it('无 IO 环境：直接呈现终态并写入 dataset 与延迟', async () => {
    await withGlobal(null, async () => {
      const { revealElement: freshReveal } = await import('../src/directives/reveal')

      const el = document.createElement('div')
      const cleanup = freshReveal(el, { type: 'left', delay: 120 })
      expect(el.classList.contains('ev-reveal')).toBe(true)
      expect(el.dataset.evReveal).toBe('left')
      expect(el.dataset.evRevealOnce).toBe('true')
      expect(el.style.transitionDelay).toBe('120ms')
      expect(el.classList.contains('is-revealed')).toBe(true)
      expect(typeof cleanup).toBe('function')

      const el2 = document.createElement('div')
      freshReveal(el2, { type: 'diagonal', delay: 0 })
      expect(el2.dataset.evReveal).toBe('up') // 未知类型回落 up
      expect(el2.style.transitionDelay).toBe('')
    })
    expect(REVEAL_TYPES).toEqual(['up', 'left', 'right', 'zoom', 'fade'])
  })

  it('IO 环境：observe 后进视口才呈现，once 语义区分取消观察与否', async () => {
    const FakeIO = makeFakeIO()
    await withGlobal(FakeIO, async () => {
      const { revealElement: freshReveal } = await import('../src/directives/reveal')

      const once = document.createElement('div')
      freshReveal(once, {})
      expect(once.classList.contains('is-revealed')).toBe(false) // 未进视口不播

      const repeat = document.createElement('div')
      freshReveal(repeat, { once: false })
      expect(repeat.dataset.evRevealOnce).toBe('false')

      const io = FakeIO.instances.at(-1)
      expect(io.observed).toEqual([once, repeat])

      io.cb([{ isIntersecting: true, target: once }])
      expect(once.classList.contains('is-revealed')).toBe(true)
      expect(io.unobserved).toEqual([once]) // once 默认 true → 播后取消观察

      io.cb([{ isIntersecting: true, target: repeat }])
      expect(repeat.classList.contains('is-revealed')).toBe(true)
      expect(io.unobserved).toEqual([once]) // once:false 持续观察
    })
  })

  it('指令用法：mounted 写入状态并 observe，unmounted 取消观察', async () => {
    const FakeIO = makeFakeIO()
    await withGlobal(FakeIO, async () => {
      const { revealDirective } = await import('../src/directives/reveal')
      const Harness = defineComponent({
        template: `<div v-reveal="{ type: 'zoom' }" class="rv">x</div>`,
      })
      const wrapper = mount(Harness, { global: { directives: { reveal: revealDirective } } })
      const el = wrapper.find('.rv').element
      expect(el.dataset.evReveal).toBe('zoom')
      const io = FakeIO.instances.at(-1)
      expect(io.observed).toContain(el)
      wrapper.unmount()
      expect(io.unobserved).toContain(el)
    })
  })
})
