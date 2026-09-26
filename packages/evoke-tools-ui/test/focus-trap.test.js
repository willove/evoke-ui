import { describe, it, expect } from 'vitest'
import {
  FOCUSABLE_SELECTOR,
  getFocusableElements,
  nextFocusableInTrap,
  resolveFocusReturnTarget,
} from '../src/runtime/focus/trap'

const makeRoot = (html) => {
  const div = document.createElement('div')
  div.innerHTML = html
  document.body.appendChild(div)
  return div
}

describe('焦点陷阱契约（M3：Dialog/Backstage/Palette 同一套）', () => {
  it('可聚焦元素查询：剔除 disabled / tabindex=-1 / aria-hidden', () => {
    const root = makeRoot(`
      <button id="a">A</button>
      <button id="b" disabled>B</button>
      <button id="c" tabindex="-1">C</button>
      <button id="d" aria-hidden="true">D</button>
      <input id="e" />
      <select id="f"></select>
      <textarea id="g"></textarea>
      <a id="h" href="#x">H</a>
      <div id="i" contenteditable="true">I</div>
    `)
    const ids = getFocusableElements(root).map((el) => el.id)
    expect(ids).toEqual(['a', 'e', 'f', 'g', 'h', 'i'])
    expect(FOCUSABLE_SELECTOR).toContain('button:not([disabled])')
    root.remove()
  })

  it('循环：Tab 末位回首位，Shift+Tab 首位回末位', () => {
    const root = makeRoot('<button id="a">A</button><button id="b">B</button>')
    const [a, b] = getFocusableElements(root)
    expect(nextFocusableInTrap([a, b], b, 1)).toBe(a)
    expect(nextFocusableInTrap([a, b], a, -1)).toBe(b)
    expect(nextFocusableInTrap([a, b], null, 1)).toBe(a) // 打开落点 = 第一个
    root.remove()
  })

  it('容器外焦点（或空）→ 进第一个', () => {
    const root = makeRoot('<button id="a">A</button>')
    const outside = document.createElement('button')
    expect(nextFocusableInTrap(getFocusableElements(root), outside, 1).id).toBe('a')
    root.remove()
  })

  it('归还：触发器还在文档里 → 还给它；不在 → 容器内第一个', () => {
    const root = makeRoot('<button id="a">A</button><button id="b">B</button>')
    const container = document.createElement('div')
    container.appendChild(document.createElement('button')) // 容器兜底
    const live = root.querySelector('#a')
    const detached = document.createElement('button')
    expect(resolveFocusReturnTarget(container, live)).toBe(live)
    expect(resolveFocusReturnTarget(container, detached)).toBe(container.querySelector('button'))
    // 触发器与容器都空 → null（调用方不得静默 focus body 之外的野元素）
    expect(resolveFocusReturnTarget(null, detached)).toBeNull()
    root.remove()
  })
})
