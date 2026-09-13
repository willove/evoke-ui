import { mount, describe, it, expect, EvScrollScene } from './helpers'

// jsdom 的 getBoundingClientRect 恒 0，按场景几何桩定；innerHeight 用 jsdom 默认 768
function stubRect(wrapper, top, height) {
  const el = wrapper.find('.ev-scroll-scene').element
  el.getBoundingClientRect = () => ({ top, height, bottom: top + height, left: 0, right: 0, width: 1000, x: 0, y: top })
}

// 派发滚动并等进度计算（rAF 回调）与渲染（nextTick）完成
async function scrollBy(wrapper) {
  window.dispatchEvent(new Event('scroll'))
  await new Promise((r) => requestAnimationFrame(r))
  await wrapper.vm.$nextTick()
}

describe('EvScrollScene', () => {
  it('滚动进度映射到 0..1 并经插槽与 CSS 变量双通道暴露', async () => {
    const wrapper = mount(EvScrollScene, {
      props: { duration: 200 },
      slots: {
        default: `<template #default="{ progress }"><span class="p">{{ progress }}</span></template>`,
      },
    })
    const scene = wrapper.find('.ev-scroll-scene')
    // 高度 = 100vh(768) + 200vh(1536) = 2304px；可钉长度 = 2304 − 768 = 1536
    stubRect(wrapper, 0, 2304)
    await scrollBy(wrapper)
    expect(wrapper.find('.p').text()).toBe('0')

    stubRect(wrapper, -768, 2304) // 滚过一半（768 / 1536）
    await scrollBy(wrapper)
    expect(wrapper.find('.p').text()).toBe('0.5')
    expect(scene.attributes('style')).toContain('--ev-scene-progress: 0.5')

    stubRect(wrapper, -99999, 2304) // 越过终点收敛 1
    await scrollBy(wrapper)
    expect(wrapper.find('.p').text()).toBe('1')
  })

  it('进度双向回溯：上滚数值回退', async () => {
    const wrapper = mount(EvScrollScene, {
      props: { duration: 200 },
      slots: {
        default: `<template #default="{ progress }"><span class="p">{{ progress }}</span></template>`,
      },
    })
    stubRect(wrapper, -1536, 2304) // 终点 → 1
    await scrollBy(wrapper)
    expect(wrapper.find('.p').text()).toBe('1')
    stubRect(wrapper, -230.4, 2304) // 上滚回退到 15%
    await scrollBy(wrapper)
    expect(wrapper.find('.p').text()).toBe('0.15')
  })

  it('吸附偏移参与进度几何（top 使起点推迟、总长等量延长）', async () => {
    const wrapper = mount(EvScrollScene, {
      props: { duration: 100, top: 48 },
      slots: {
        default: `<template #default="{ progress }"><span class="p">{{ progress }}</span></template>`,
      },
    })
    // 高度 768 + 768 = 1536；span = 1536 − 768 + 48 = 816；吸附位 48、元素顶 −360 → 408 / 816 = 0.5
    stubRect(wrapper, -360, 1536)
    await scrollBy(wrapper)
    expect(wrapper.find('.p').text()).toBe('0.5')
  })

  it('disabled 冻结进度为 0、不拉高度', async () => {
    const wrapper = mount(EvScrollScene, {
      props: { duration: 200, disabled: true },
      slots: {
        default: `<template #default="{ progress }"><span class="p">{{ progress }}</span></template>`,
      },
    })
    const scene = wrapper.find('.ev-scroll-scene')
    stubRect(wrapper, -768, 2304)
    await scrollBy(wrapper)
    expect(wrapper.find('.p').text()).toBe('0')
    expect(scene.attributes('style')).toContain('--ev-scene-progress: 0')
    expect(scene.attributes('style')).not.toContain('height')
    expect(scene.classes()).toContain('is-disabled')
  })

  it('prefers-reduced-motion：进度钉在终态 1', async () => {
    const realMatch = window.matchMedia
    window.matchMedia = (q) => ({ matches: q.includes('reduce'), addEventListener() {}, removeEventListener() {} })
    const wrapper = mount(EvScrollScene, {
      props: { duration: 200 },
      slots: {
        default: `<template #default="{ progress }"><span class="p">{{ progress }}</span></template>`,
      },
    })
    stubRect(wrapper, -768, 2304)
    await scrollBy(wrapper)
    expect(wrapper.find('.p').text()).toBe('1')
    window.matchMedia = realMatch
  })
})
