/**
 * EvLoading — 命令式加载服务 + v-loading 指令
 *
 * Usage:
 *   const handle = EvLoading.service({ fullscreen: true, text: '加载中' })
 *   handle.close()
 *
 *   app.use 安装时自动注册 v-loading 指令
 */
import { createVNode, render } from 'vue'
import LoadingView from './src/loading.vue'
import { nextZIndex } from '../../utils/zIndex'
import { inBrowser } from '../../utils/dom'

/** 全屏实例计数（多次 service 只保留一个全屏遮罩） */
let fullscreenInstance = null

/**
 * @param {object} [options]
 * @param {boolean} [options.fullscreen] 全屏遮罩
 * @param {string} [options.text] 加载文案
 * @param {string} [options.background] 遮罩背景色
 * @param {HTMLElement} [options.target] 挂载目标（默认 body）
 */
function createLoading(options = {}) {
  if (!inBrowser()) {
    return { close: () => {} }
  }
  const fullscreen = !!options.fullscreen
  const target = options.target ?? (fullscreen ? document.body : document.body)

  const container = document.createElement('div')
  const vnode = createVNode(LoadingView, {
    ...options,
    fullscreen,
    zIndex: nextZIndex(),
  })
  render(vnode, container)
  target.appendChild(container)

  const handle = {
    close() {
      render(null, container)
      container?.parentNode?.removeChild?.(container)
      if (fullscreen) {
        fullscreenInstance = null
      }
    },
    vm: vnode.component,
  }

  if (fullscreen) {
    if (fullscreenInstance) {
      fullscreenInstance.close()
    }
    fullscreenInstance = handle
  }
  return handle
}

const EvLoading = {
  service: createLoading,
  /** 兼容 invoke-ui 全屏快捷调用 */
  fullscreen(options) {
    return createLoading({ ...options, fullscreen: true })
  },
}

/**
 * v-loading 指令安装（指令式 API）
 * v-loading="loadingFlag" + 可选 v-loading:text="文案"
 */
function createLoadingDirective() {
  /** @type {WeakMap<HTMLElement, handle>} */
  const instanceMap = new WeakMap()

  return {
    mounted(el, binding) {
      const text = el.getAttribute('loading-text')
      const handle = createLoading({
        target: el,
        text: text || binding.value?.text || '',
        fullscreen: false,
      })
      el.classList.add('ev-loading-parent--relative')
      instanceMap.set(el, handle)
      handle.vm.exposed.setVisible(!!binding.value)
    },
    updated(el, binding) {
      const handle = instanceMap.get(el)
      if (handle) {
        handle.vm.exposed.setVisible(!!binding.value)
      }
    },
    unmounted(el) {
      const handle = instanceMap.get(el)
      handle?.close()
      el.classList.remove('ev-loading-parent--relative')
      instanceMap.delete(el)
    },
  }
}

export { EvLoading, createLoadingDirective }
export default EvLoading
