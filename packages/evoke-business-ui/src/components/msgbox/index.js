/**
 * EvMsgbox — 命令式消息框 API
 *
 * Usage:
 *   EvMsgbox('消息', '标题', { type: 'warning' })
 *   EvMsgbox.alert('内容', '标题', options)
 *   EvMsgbox.confirm('确认删除？', '提示').then(({ action }) => ...)
 *   EvMsgbox.prompt('请输入名称', '提示', { inputPattern: /\S+/ })
 *
 * Promise resolve { action: 'confirm'|'cancel'|'close', value }
 * lockScroll 默认 false
 */
import { createVNode, render } from 'vue'
import MsgboxView from './src/msgbox.vue'
import { nextZIndex } from '../../utils/zIndex'
import { inBrowser } from '../../utils/dom'

/** 默认参数 */
const DEFAULT_OPTIONS = {
  lockScroll: false,
}

/**
 * 规范化 alert/confirm/prompt 重载：
 *   (message, title?, options?, appContext?)
 *   (message, options?, appContext?)
 */
function normalizeArgs(message, titleOrOptions, optionsOrAppContext, appContext) {
  let title = ''
  let options = {}
  let ctx = appContext
  if (typeof titleOrOptions === 'string') {
    title = titleOrOptions
    if (optionsOrAppContext && typeof optionsOrAppContext === 'object' && !optionsOrAppContext._context) {
      options = optionsOrAppContext
    } else if (optionsOrAppContext?._context) {
      ctx = optionsOrAppContext
    }
  } else if (titleOrOptions && typeof titleOrOptions === 'object') {
    options = titleOrOptions
    if (optionsOrAppContext?._context) {
      ctx = optionsOrAppContext
    }
  }
  return { title, options, appContext: ctx }
}

/**
 * 挂载消息框并返回 Promise
 * @param {object} options 完整选项（含 mode）
 */
function showMsgbox(options = {}, appContext) {
  if (!inBrowser()) {
    return Promise.reject(new Error('[EvMsgbox] 仅支持浏览器环境'))
  }
  const container = document.createElement('div')

  return new Promise((resolve, reject) => {
    const vnode = createVNode(MsgboxView, {
      ...options,
      zIndex: nextZIndex(),
      onDone: (action, value) => {
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
      vnode.appContext = appContext
    }
    render(vnode, container)
    document.body.appendChild(container)
  })
}

function EvMsgbox(message, titleOrOptions, optionsOrAppContext, appContext) {
  // 对象式调用：EvMsgbox(options[, appContext])
  if (message && typeof message === 'object') {
    return showMsgbox(
      { ...DEFAULT_OPTIONS, ...message, showCancelButton: true, mode: 'confirm' },
      typeof titleOrOptions === 'object' && titleOrOptions?._context ? titleOrOptions : undefined
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

/**
 * alert：仅确认按钮，永远 resolve
 */
EvMsgbox.alert = function (message, titleOrOptions, optionsOrAppContext, appContext) {
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

/**
 * confirm：确认/取消，confirm resolve，其余 reject
 */
EvMsgbox.confirm = function (message, titleOrOptions, optionsOrAppContext, appContext) {
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

/**
 * prompt：带输入框，confirm resolve { action, value }
 */
EvMsgbox.prompt = function (message, titleOrOptions, optionsOrAppContext, appContext) {
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

/** 关闭当前消息框（单例语义：渲染中实例 ESC 关闭由内部处理，此处兼容 API 存在） */
EvMsgbox.close = () => {
  document
    .querySelectorAll('.ev-message-box.ev-message-box')
    .forEach((el) => el.__ev_msgbox_close?.())
}

export { EvMsgbox }
export default EvMsgbox
