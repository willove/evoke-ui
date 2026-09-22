import { describe, it, expect } from 'vitest'
import { createApp } from 'vue'
import EvokeChat, { components, install, EbChatbot, EbAiConsole, EbAiPromptBox } from '../src/index'

/**
 * 包入口守卫：注册表 ↔ install ↔ 具名导出三者一致。
 * 漏注册时宿主 `app.use(EvokeChat)` 后标签解析不到，此前这类问题只能靠文档页演示发现。
 */

describe('包入口：注册表 / install / 导出', () => {
  it('注册表覆盖家族，且默认导出带 install', () => {
    expect(Object.keys(components).length).toBeGreaterThanOrEqual(35)
    expect(typeof EvokeChat.install).toBe('function')
    expect(components.EbChatbot).toBe(EbChatbot)
    expect(components.EbAiConsole).toBe(EbAiConsole)
    expect(components.EbAiPromptBox).toBe(EbAiPromptBox)
  })

  it('全部注册名都是 Eb* 命名，且没有重复键', () => {
    const names = Object.keys(components)
    expect(new Set(names).size).toBe(names.length)
    for (const n of names) expect(n).toMatch(/^Eb[A-Z][A-Za-z0-9]*$/)
  })

  it('install 把每个组件注册到 app', () => {
    const registered = []
    install({ component: (name) => registered.push(name) })
    expect(registered).toEqual(Object.keys(components))
  })

  it('真实 app 上可解析出全局标签（装机冒烟）', () => {
    const app = createApp({ render: () => null })
    app.use(EvokeChat)
    expect(app.component('EbChatbot')).toBeTruthy()
    expect(app.component('EbAiConsole')).toBeTruthy()
  })
})
