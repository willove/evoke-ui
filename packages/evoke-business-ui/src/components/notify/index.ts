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
import type { ComponentInternalInstance } from 'vue'
import NotifyView from './src/notify.vue'
import { nextZIndex } from '../../utils/zIndex'
import { inBrowser } from '../../utils/dom'

export type NotifyType = 'success' | 'warning' | 'info' | 'error'

export type NotifyPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

export interface NotifyOptions {
  title?: string
  message?: unknown
  type?: NotifyType
  position?: NotifyPosition
  duration?: number
  showClose?: boolean
  offset?: number
  onClose?: () => void
  [key: string]: unknown
}

export interface NotifyHandle {
  close: () => void
}

type ExposedVM = ComponentInternalInstance

interface NotifyInstance {
  position: string
  container: HTMLElement
  vm: ExposedVM | null
  handle: NotifyHandle | null
}

const GAP = 16
const INITIAL_OFFSET = 16
const FALLBACK_HEIGHT = 88

const columns: Record<string, NotifyInstance[]> = {
  'top-right': [],
  'top-left': [],
  'bottom-right': [],
  'bottom-left': [],
}

function normalizeArgs(args: unknown[]): NotifyOptions {
  const first = args[0]
  if (typeof first === 'string') {
    // 快捷方法形态：(title, message?, options?)
    const [title, message, options] = args as [string, unknown, NotifyOptions | null | undefined]
    return {
      ...(typeof options === 'object' && options ? options : {}),
      title,
      message: message ?? '',
    }
  }
  return typeof first === 'object' && first !== null ? (first as NotifyOptions) : {}
}

/** 重排同列堆叠 */
function updateColumn(position: string): void {
  const list = columns[position]!
  const isTop = position.startsWith('top')
  let offset = INITIAL_OFFSET
  for (const instance of list) {
    // 按类名定位通知本体，不能取 container.firstElementChild——
    // 测试环境（@vue/test-utils 全局 transformVNodeArgs）或任何包装层都可能让首子元素不是通知元素
    const el = instance.container.querySelector<HTMLElement>('.eb-notification')
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

function destroyInstance(instance: NotifyInstance): void {
  const list = columns[instance.position]
  const idx = list.indexOf(instance)
  if (idx >= 0) {
    list.splice(idx, 1)
  }
  render(null, instance.container)
  instance.container?.parentNode?.removeChild?.(instance.container)
  updateColumn(instance.position)
}

function closeInstance(instance: NotifyInstance): void {
  instance.vm?.exposed?.close?.()
}

interface NotifyFn {
  (first: NotifyOptions | string, ...rest: unknown[]): NotifyHandle
  success: (title: string, message?: unknown, options?: NotifyOptions | null) => NotifyHandle
  warning: (title: string, message?: unknown, options?: NotifyOptions | null) => NotifyHandle
  info: (title: string, message?: unknown, options?: NotifyOptions | null) => NotifyHandle
  error: (title: string, message?: unknown, options?: NotifyOptions | null) => NotifyHandle
  /** 关闭全部 */
  close: () => void
  closeAll: () => void
  /** 各列活动实例数（测试用） */
  _columns: Record<string, NotifyInstance[]>
}

function EbNotifyImpl(first: NotifyOptions | string, ...rest: unknown[]): NotifyHandle {
  if (!inBrowser()) {
    console.warn('[EbNotify] 仅支持浏览器环境')
    return { close: () => {} }
  }
  const options = normalizeArgs([first, ...rest])
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

  const instance: NotifyInstance = {
    position,
    container,
    vm: vnode.component,
    handle: null,
  }
  instance.handle = {
    close: () => closeInstance(instance),
  }
  columns[position]!.push(instance)
  updateColumn(position)
  return instance.handle
}

function createShortcut(type: NotifyType): NotifyFn['success'] {
  return (title, message, options = {}) =>
    EbNotify({ ...(typeof options === 'object' && options ? options : {}), title, message, type })
}

const EbNotify = EbNotifyImpl as NotifyFn

EbNotify.success = createShortcut('success')
EbNotify.warning = createShortcut('warning')
EbNotify.info = createShortcut('info')
EbNotify.error = createShortcut('error')

EbNotify.close = () => {
  for (const list of Object.values(columns)) {
    ;[...list].forEach(closeInstance)
  }
}

EbNotify.closeAll = EbNotify.close

EbNotify._columns = columns

export { EbNotify }
export default EbNotify
