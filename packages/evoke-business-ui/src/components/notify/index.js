/**
 * EbNotify — 命令式通知 API
 *
 * Usage:
 *   EbNotify({ title: '标题', message: '内容' })
 *   EbNotify.success('标题', '内容', { duration: 0 })
 *   EbNotify.close()  // 关闭全部
 *
 * 四角定位独立堆叠列（top-right 默认，offset 16 起步，间距 16）
 */
import { createVNode, render } from 'vue'
import NotifyView from './src/notify.vue'
import { nextZIndex } from '../../utils/zIndex'
import { inBrowser } from '../../utils/dom'

const GAP = 16
const INITIAL_OFFSET = 16
const FALLBACK_HEIGHT = 88

/** @type {Record<string, Array<{position: string, container: HTMLElement, vm: object, handle: object}>>} */
const columns = {
  'top-right': [],
  'top-left': [],
  'bottom-right': [],
  'bottom-left': [],
}

function normalizeArgs(args) {
  const first = args[0]
  if (typeof first === 'string') {
    // 快捷方法形态：(title, message?, options?)
    const [title, message, options] = args
    return { ...(typeof options === 'object' && options ? options : {}), title, message: message ?? '' }
  }
  return typeof first === 'object' && first !== null ? first : {}
}

/** 重排同列堆叠 */
function updateColumn(position) {
  const list = columns[position]
  const isTop = position.startsWith('top')
  let offset = INITIAL_OFFSET
  for (const instance of list) {
    // 按类名定位通知本体，不能取 container.firstElementChild——
    // 测试环境（@vue/test-utils 全局 transformVNodeArgs）或任何包装层都可能让首子元素不是通知元素
    const el = instance.container.querySelector('.eb-notification')
    if (el) {
      if (isTop) {
        el.style.top = `${offset}px`
      } else {
        el.style.bottom = `${offset}px`
      }
    }
    const h = el?.offsetHeight || FALLBACK_HEIGHT
    offset += h + GAP
  }
}

function destroyInstance(instance) {
  const list = columns[instance.position]
  const idx = list.indexOf(instance)
  if (idx >= 0) {
    list.splice(idx, 1)
  }
  render(null, instance.container)
  instance.container?.parentNode?.removeChild?.(instance.container)
  updateColumn(instance.position)
}

function closeInstance(instance) {
  instance.vm?.exposed?.close?.()
}

function EbNotify(...args) {
  if (!inBrowser()) {
    console.warn('[EbNotify] 仅支持浏览器环境')
    return { close: () => {} }
  }
  const options = normalizeArgs(args)
  const position = options.position ?? 'top-right'
  const type = options.type ?? 'info'

  const container = document.createElement('div')
  Object.assign(container.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    pointerEvents: 'none',
    zIndex: '0',
  })

  const userOnClose = options.onClose
  const vnode = createVNode(NotifyView, {
    ...options,
    type,
    position,
    zIndex: nextZIndex(),
    onClose: () => userOnClose?.(),
    onDestroy: () => destroyInstance(instance),
  })
  render(vnode, container)
  document.body.appendChild(container)

  const instance = {
    position,
    container,
    vm: vnode.component,
    handle: null,
  }
  instance.handle = {
    close: () => closeInstance(instance),
  }
  columns[position].push(instance)
  updateColumn(position)
  return instance.handle
}

function createShortcut(type) {
  return (title, message, options = {}) =>
    EbNotify({ ...(typeof options === 'object' && options ? options : {}), title, message, type })
}

EbNotify.success = createShortcut('success')
EbNotify.warning = createShortcut('warning')
EbNotify.info = createShortcut('info')
EbNotify.error = createShortcut('error')

/** 关闭全部 */
EbNotify.close = () => {
  for (const list of Object.values(columns)) {
    ;[...list].forEach(closeInstance)
  }
}

EbNotify.closeAll = EbNotify.close

/** 各列活动实例数（测试用） */
EbNotify._columns = columns

export { EbNotify }
export default EbNotify
