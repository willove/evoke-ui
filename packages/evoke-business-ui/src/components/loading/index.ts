/**
 * EbLoading — 命令式加载服务 + v-loading 指令
 *
 * Usage:
 *   const handle = EbLoading.service({ fullscreen: true, text: '加载中' })
 *   handle.close()
 *
 *   app.use 安装时自动注册 v-loading 指令
 */
import { createVNode, render } from 'vue'
import type { ComponentInternalInstance, Directive } from 'vue'
import LoadingView from './src/loading.vue'
import { nextZIndex } from '../../utils/zIndex'
import { inBrowser } from '../../utils/dom'

export interface LoadingOptions {
  /** 全屏遮罩 */
  fullscreen?: boolean
  /** 加载文案 */
  text?: string
  /** 遮罩背景色 */
  background?: string
  /** 挂载目标（默认 body） */
  target?: HTMLElement
  [key: string]: unknown
}

export interface LoadingHandle {
  close: () => void
  vm: ComponentInternalInstance | null
}

/** 全屏实例计数（多次 service 只保留一个全屏遮罩） */
let fullscreenInstance: LoadingHandle | null = null

function createLoading(options: LoadingOptions = {}): LoadingHandle {
  if (!inBrowser()) {
    return { close: () => {} } as LoadingHandle
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

  const handle: LoadingHandle = {
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

export interface LoadingDirectiveValue {
  text?: string
}

const EbLoading = {
  service: createLoading,
  /** 兼容 invoke-ui 全屏快捷调用 */
  fullscreen(options?: LoadingOptions | null): LoadingHandle {
    return createLoading({ ...options, fullscreen: true })
  },
}

/**
 * v-loading 指令安装（指令式 API）
 * v-loading="loadingFlag" + 可选 v-loading:text="文案"
 */
function createLoadingDirective(): Directive<HTMLElement, LoadingDirectiveValue | null | undefined> {
  const instanceMap = new WeakMap<HTMLElement, LoadingHandle>()

  return {
    mounted(el, binding) {
      const text = el.getAttribute('loading-text')
      const handle = createLoading({
        target: el,
        text: text || binding.value?.text || '',
        fullscreen: false,
      })
      el.classList.add('eb-loading-parent--relative')
      instanceMap.set(el, handle)
      handle.vm!.exposed!.setVisible(!!binding.value)
    },
    updated(el, binding) {
      const handle = instanceMap.get(el)
      if (handle) {
        handle.vm!.exposed!.setVisible(!!binding.value)
      }
    },
    unmounted(el) {
      const handle = instanceMap.get(el)
      handle?.close()
      el.classList.remove('eb-loading-parent--relative')
      instanceMap.delete(el)
    },
  }
}

export { EbLoading, createLoadingDirective }
export default EbLoading
