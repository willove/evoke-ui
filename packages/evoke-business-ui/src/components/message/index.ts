/**
 * EbMessage — 命令式消息 API
 *
 * Usage:
 *   EbMessage('普通消息')
 *   EbMessage({ message: '成功', type: 'success', duration: 5000 })
 *   EbMessage.success('成功')
 *   EbMessage.close()  // 关闭全部
 *
 * 实现：createVNode(MessageView) → render(vnode, container)，容器惰性挂 body；
 * 实例数组垂直堆叠重排（间距 16px）；grouping 同文案同类型合并并重置计时。
 */
import { createVNode, render } from 'vue'
import type { ComponentInternalInstance } from 'vue'
import MessageView from './src/message.vue'
import { nextZIndex } from '../../utils/zIndex'
import { inBrowser } from '../../utils/dom'

export type MessageType = 'success' | 'warning' | 'info' | 'error'

export interface MessageOptions {
  message?: unknown
  type?: MessageType
  duration?: number
  /** 同类型同文案合并并重置计时 */
  grouping?: boolean
  showClose?: boolean
  offset?: number
  onClose?: () => void
  [key: string]: unknown
}

export interface MessageHandle {
  close: () => void
}

/** 组件实例上命令式 API 依赖的 exposed 形态 */
type ExposedVM = ComponentInternalInstance

interface MessageInstance {
  id: number
  type: string
  message: unknown
  container: HTMLElement
  vm: ExposedVM | null
  handle: MessageHandle | null
}

const GAP = 16
const INITIAL_TOP = 16
/** jsdom/极端环境 offsetHeight 为 0 时的兜底高度 */
const FALLBACK_HEIGHT = 44

const instances: MessageInstance[] = []
let seed = 0

function normalizeOptions(args: unknown[]): MessageOptions {
  const first = args[0]
  if (typeof first === 'string' || typeof first === 'number') {
    const rest = args[1]
    return { ...(typeof rest === 'object' && rest !== null ? (rest as MessageOptions) : {}), message: String(first) }
  }
  return typeof first === 'object' && first !== null ? (first as MessageOptions) : {}
}

/** 依据前序实例累计高度，重排全部消息 top */
function updatePositions(): void {
  let top = INITIAL_TOP
  for (const instance of instances) {
    instance.container.style.top = `${top}px`
    const h = instance.container.offsetHeight || FALLBACK_HEIGHT
    top += h + GAP
  }
}

function destroyInstance(instance: MessageInstance): void {
  // 自然到期路径也会走到这里：必须同步清出 instances，否则幽灵实例会让后续新消息的 top 累加偏移
  const idx = instances.indexOf(instance)
  if (idx >= 0) {
    instances.splice(idx, 1)
    updatePositions()
  }
  if (instance.container?.parentNode) {
    instance.container.parentNode.removeChild(instance.container)
  }
  render(null, instance.container)
}

function closeInstance(instance: MessageInstance): void {
  const idx = instances.indexOf(instance)
  if (idx >= 0) {
    instances.splice(idx, 1)
  }
  instance.vm?.exposed?.close?.()
  updatePositions()
}

interface MessageFn {
  (first: MessageOptions | string | number, ...rest: unknown[]): MessageHandle
  success: (message: unknown, options?: MessageOptions | null) => MessageHandle
  warning: (message: unknown, options?: MessageOptions | null) => MessageHandle
  info: (message: unknown, options?: MessageOptions | null) => MessageHandle
  error: (message: unknown, options?: MessageOptions | null) => MessageHandle
  /** 关闭全部 */
  close: () => void
  closeAll: () => void
  /** 当前活动实例数（测试用） */
  _instances: MessageInstance[]
}

function EbMessageImpl(first: MessageOptions | string | number, ...rest: unknown[]): MessageHandle {
  if (!inBrowser()) {
    console.warn('[EbMessage] 仅支持浏览器环境')
    return { close: () => {} }
  }
  const options = normalizeOptions([first, ...rest])
  const type = options.type ?? 'info'

  // grouping：同类型同文案的活动中实例复用（重置计时）
  if (options.grouping) {
    const existing = instances.find(
      (i) => i.type === type && i.message === options.message
    )
    if (existing) {
      existing.vm?.exposed?.resetTimer?.()
      return existing.handle!
    }
  }

  const id = ++seed
  const container = document.createElement('div')
  container.className = 'eb-message-container'
  // zIndex 必须挂在 container 上：transform 已创建层叠上下文，内层 z-index 无法越级
  const zIndex = nextZIndex()
  Object.assign(container.style, {
    position: 'fixed',
    top: '0px',
    left: '50%',
    transform: 'translateX(-50%)',
    transition: 'top 0.3s cubic-bezier(0.215, 0.61, 0.355, 1)',
    pointerEvents: 'none',
    zIndex: String(zIndex),
    // 显式宽度语义：max-content 防止 shrink-to-fit 与内层 max-width 百分比互相循环塌陷
    width: 'max-content',
    maxWidth: 'calc(100vw - 32px)',
  })

  const userOnClose = options.onClose
  const vnode = createVNode(MessageView, {
    ...options,
    type,
    zIndex,
    onClose: () => userOnClose?.(),
    onDestroy: () => destroyInstance(instance),
  })
  render(vnode, container)
  document.body.appendChild(container)

  const instance: MessageInstance = {
    id,
    type,
    message: options.message,
    container,
    vm: vnode.component,
    handle: null,
  }
  instance.handle = {
    close: () => closeInstance(instance),
  }
  instances.push(instance)
  updatePositions()
  return instance.handle
}

/**
 * 快捷方法工厂
 */
function createShortcut(type: MessageType): MessageFn['success'] {
  return (message, options = {}) =>
    EbMessage({ ...(typeof options === 'object' && options !== null ? options : {}), message, type })
}

const EbMessage = EbMessageImpl as MessageFn

EbMessage.success = createShortcut('success')
EbMessage.warning = createShortcut('warning')
EbMessage.info = createShortcut('info')
EbMessage.error = createShortcut('error')

EbMessage.close = () => {
  ;[...instances].forEach(closeInstance)
}

EbMessage.closeAll = EbMessage.close

EbMessage._instances = instances

export { EbMessage }
export default EbMessage
