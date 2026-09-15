/**
 * EbMsgbox — 命令式消息框 API
 *
 * Usage:
 *   EbMsgbox('消息', '标题', { type: 'warning' })
 *   EbMsgbox.alert('内容', '标题', options)
 *   EbMsgbox.confirm('确认删除？', '提示').then(({ action }) => ...)
 *   EbMsgbox.prompt('请输入名称', '提示', { inputPattern: /\S+/ })
 *
 * Promise resolve { action: 'confirm'|'cancel'|'close', value }
 * lockScroll 默认 false
 */
import { createVNode, render } from 'vue'
import type { App, AppContext } from 'vue'
import MsgboxView from './src/msgbox.vue'
import { nextZIndex } from '../../utils/zIndex'
import { inBrowser } from '../../utils/dom'

export type MsgboxMode = 'alert' | 'confirm' | 'prompt'

export interface MsgboxOptions {
  message?: unknown
  title?: string
  type?: string
  mode?: MsgboxMode
  showCancelButton?: boolean
  /** 默认 false */
  lockScroll?: boolean
  inputValue?: string
  inputPattern?: RegExp
  inputValidator?: (value: string) => boolean | string
  inputPlaceholder?: string
  confirmButtonText?: string
  cancelButtonText?: string
  onClose?: () => void
  [key: string]: unknown
}

export interface MsgboxResult {
  action: string
  value?: unknown
}

/** 识别「直接传 app 实例」的形态（app._context 存在即视为 app） */
function hasAppContext(v: unknown): boolean {
  return !!(v && typeof v === 'object' && (v as { _context?: unknown })._context)
}

/**
 * 规范化 alert/confirm/prompt 重载：
 *   (message, title?, options?, appContext?)
 *   (message, options?, appContext?)
 */
function normalizeArgs(
  message: string,
  titleOrOptions?: string | MsgboxOptions | App | null,
  optionsOrAppContext?: MsgboxOptions | App | null,
  appContext?: App | AppContext | null,
): { title: string; options: MsgboxOptions; appContext: App | AppContext | undefined } {
  let title = ''
  let options: MsgboxOptions = {}
  let ctx: App | AppContext | undefined = appContext ?? undefined
  if (typeof titleOrOptions === 'string') {
    title = titleOrOptions
    if (optionsOrAppContext && typeof optionsOrAppContext === 'object' && !hasAppContext(optionsOrAppContext)) {
      options = optionsOrAppContext as MsgboxOptions
    } else if (hasAppContext(optionsOrAppContext)) {
      ctx = optionsOrAppContext as App | AppContext
    }
  } else if (titleOrOptions && typeof titleOrOptions === 'object') {
    options = titleOrOptions as MsgboxOptions
    if (hasAppContext(optionsOrAppContext)) {
      ctx = optionsOrAppContext as App | AppContext
    }
  }
  return { title, options, appContext: ctx }
}

/**
 * 挂载消息框并返回 Promise
 */
function showMsgbox(options: MsgboxOptions = {}, appContext?: App | AppContext | null): Promise<MsgboxResult> {
  if (!inBrowser()) {
    return Promise.reject(new Error('[EbMsgbox] 仅支持浏览器环境'))
  }
  const container = document.createElement('div')

  return new Promise<MsgboxResult>((resolve, reject) => {
    const vnode = createVNode(MsgboxView, {
      ...options,
      zIndex: nextZIndex(),
      onDone: (action: string, value: unknown) => {
        if (action === 'confirm') {
          resolve({ action, value })
        } else {
          reject({ action, value })
        }
      },
      onDestroy: () => {
        render(null, container)
        container?.parentNode?.removeChild?.(container)
      },
    })
    if (appContext) {
      vnode.appContext = appContext as AppContext
    }
    render(vnode, container)
    document.body.appendChild(container)
  })
}

/** 默认参数 */
const DEFAULT_OPTIONS: MsgboxOptions = {
  lockScroll: false,
}

type MsgboxOverloadArgs = [
  titleOrOptions?: string | MsgboxOptions | App | null,
  optionsOrAppContext?: MsgboxOptions | App | null,
  appContext?: App | AppContext | null,
]

interface MsgboxFn {
  (message: MsgboxOptions | string, ...args: MsgboxOverloadArgs): Promise<MsgboxResult>
  /** alert：仅确认按钮，永远 resolve */
  alert: (message: string, ...args: MsgboxOverloadArgs) => Promise<MsgboxResult>
  /** confirm：确认/取消，confirm resolve，其余 reject */
  confirm: (message: string, ...args: MsgboxOverloadArgs) => Promise<MsgboxResult>
  /** prompt：带输入框，confirm resolve { action, value } */
  prompt: (message: string, ...args: MsgboxOverloadArgs) => Promise<MsgboxResult>
  /** 关闭当前消息框（单例语义：渲染中实例 ESC 关闭由内部处理，此处兼容 API 存在） */
  close: () => void
}

function EbMsgboxImpl(
  message: MsgboxOptions | string,
  titleOrOptions?: string | MsgboxOptions | App | null,
  optionsOrAppContext?: MsgboxOptions | App | null,
  appContext?: App | AppContext | null,
): Promise<MsgboxResult> {
  // 对象式调用：EbMsgbox(options[, appContext])
  if (message && typeof message === 'object') {
    return showMsgbox(
      { ...DEFAULT_OPTIONS, ...message, showCancelButton: true, mode: 'confirm' },
      typeof titleOrOptions === 'object' && hasAppContext(titleOrOptions)
        ? (titleOrOptions as App | AppContext)
        : undefined
    )
  }
  const { title, options, appContext: ctx } = normalizeArgs(
    message,
    titleOrOptions,
    optionsOrAppContext,
    appContext
  )
  return showMsgbox(
    { ...DEFAULT_OPTIONS, ...options, message, title, showCancelButton: true, mode: 'confirm' },
    ctx
  )
}

const EbMsgbox = EbMsgboxImpl as MsgboxFn

EbMsgbox.alert = function (message, titleOrOptions, optionsOrAppContext, appContext) {
  const { title, options, appContext: ctx } = normalizeArgs(
    message,
    titleOrOptions,
    optionsOrAppContext,
    appContext
  )
  return showMsgbox(
    { ...DEFAULT_OPTIONS, ...options, message, title, showCancelButton: false, mode: 'alert' },
    ctx
  ).catch(({ action, value }) => ({ action, value }))
}

EbMsgbox.confirm = function (message, titleOrOptions, optionsOrAppContext, appContext) {
  const { title, options, appContext: ctx } = normalizeArgs(
    message,
    titleOrOptions,
    optionsOrAppContext,
    appContext
  )
  return showMsgbox(
    { ...DEFAULT_OPTIONS, ...options, message, title, showCancelButton: true, mode: 'confirm' },
    ctx
  )
}

EbMsgbox.prompt = function (message, titleOrOptions, optionsOrAppContext, appContext) {
  const { title, options, appContext: ctx } = normalizeArgs(
    message,
    titleOrOptions,
    optionsOrAppContext,
    appContext
  )
  return showMsgbox(
    {
      ...DEFAULT_OPTIONS,
      ...options,
      message,
      title,
      showCancelButton: true,
      mode: 'prompt',
    },
    ctx
  )
}

EbMsgbox.close = () => {
  document
    .querySelectorAll('.eb-message-box.eb-message-box')
    .forEach((el) => (el as Element & { __ev_msgbox_close?: () => void }).__ev_msgbox_close?.())
}

export { EbMsgbox }
export default EbMsgbox
