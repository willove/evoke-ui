import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import EbImageViewer from '../src/components/image-viewer/index.vue'

const urls = ['http://a/1.png', 'http://a/2.png', 'http://a/3.png']

const Harness = defineComponent({
  setup() {
    const visible = ref(true)
    return () =>
      h(EbImageViewer, {
        modelValue: visible.value,
        'onUpdate:modelValue': (v) => (visible.value = v),
        urlList: urls,
      })
  },
})

function flush(ms = 30) {
  return new Promise((r) => setTimeout(r, ms))
}

function press(key) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key }))
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('EbImageViewer 键盘可达性', () => {
  it('操作区为原生 button（可聚焦），打开时焦点移入容器', async () => {
    const wrapper = mount(Harness, { attachTo: document.body })
    await flush()
    expect(document.querySelector('.eb-image-viewer__close')?.tagName).toBe('BUTTON')
    expect(document.querySelector('.eb-image-viewer__prev')?.tagName).toBe('BUTTON')
    expect(document.querySelector('.eb-image-viewer__next')?.tagName).toBe('BUTTON')
    const actions = [...document.querySelectorAll('.eb-image-viewer__action')]
    expect(actions.length).toBe(3)
    actions.forEach((el) => expect(el.tagName).toBe('BUTTON'))
    // 焦点移入容器（tabindex=-1）
    const wrapperEl = document.querySelector('.eb-image-viewer__wrapper')
    expect(wrapperEl.getAttribute('tabindex')).toBe('-1')
    expect(wrapperEl.contains(document.activeElement)).toBe(true)
    wrapper.unmount()
  })

  it('←/→ 切换图片（switch 事件 + 计数器），首尾禁用 prev/next', async () => {
    const wrapper = mount(Harness, { attachTo: document.body })
    await flush()
    // 首张：prev 禁用
    expect(document.querySelector('.eb-image-viewer__prev').disabled).toBe(true)
    press('ArrowRight')
    await flush()
    expect(document.querySelector('.eb-image-viewer__counter').textContent).toContain('2 / 3')
    press('ArrowRight')
    await flush()
    expect(document.querySelector('.eb-image-viewer__counter').textContent).toContain('3 / 3')
    // 末张：next 禁用
    expect(document.querySelector('.eb-image-viewer__next').disabled).toBe(true)
    press('ArrowLeft')
    await flush()
    expect(document.querySelector('.eb-image-viewer__counter').textContent).toContain('2 / 3')
    const viewer = wrapper.findComponent(EbImageViewer)
    expect(viewer.emitted('switch').length).toBe(3)
    wrapper.unmount()
  })

  it('Esc 关闭并还焦到打开前的元素', async () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()
    const wrapper = mount(Harness, { attachTo: document.body })
    await flush()
    press('Escape')
    await flush()
    expect(document.querySelector('.eb-image-viewer__wrapper')).toBeNull()
    expect(document.activeElement).toBe(trigger)
    wrapper.unmount()
  })

  it('+/- 缩放、0 重置变换', async () => {
    const wrapper = mount(Harness, { attachTo: document.body })
    await flush()
    press('+')
    await flush()
    expect(document.querySelector('.eb-image-viewer__img').style.transform).toContain('scale(1.2)')
    press('-')
    await flush()
    expect(document.querySelector('.eb-image-viewer__img').style.transform).toContain('scale(1)')
    press('+')
    await flush()
    press('0')
    await flush()
    expect(document.querySelector('.eb-image-viewer__img').style.transform).toContain('rotate(0deg)')
    wrapper.unmount()
  })

  it('打开时锁定页面滚动，关闭解锁', async () => {
    const wrapper = mount(Harness, { attachTo: document.body })
    await flush()
    expect(document.body.classList.contains('eb-scroll-locked')).toBe(true)
    expect(document.body.style.overflow).toBe('hidden')
    press('Escape')
    await flush()
    expect(document.body.classList.contains('eb-scroll-locked')).toBe(false)
    expect(document.body.style.overflow).toBe('')
    wrapper.unmount()
  })
})
