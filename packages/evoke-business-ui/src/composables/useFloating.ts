/**
 * 浮层定位 composable — @floating-ui/dom 封装
 * Tooltip/Popover/Select/Dropdown/Cascader/DatePicker/TreeSelect 统一消费
 *
 * 策略 fixed + transform（Electron webview 缩放下比 absolute 稳）
 */
import { ref, onBeforeUnmount, watch, unref } from 'vue'
import type { Ref } from 'vue'
import {
  computePosition,
  autoUpdate,
  offset as offsetMiddleware,
  flip,
  shift,
  arrow as arrowMiddleware,
  hide as hideMiddleware,
} from '@floating-ui/dom'
import type { Placement, Strategy, MiddlewareData } from '@floating-ui/dom'

type ElementRef = Ref<HTMLElement | null | undefined>

export interface UseFloatingOptions {
  /** 参考元素（触发器） */
  reference?: ElementRef
  /** 浮层元素 */
  floating?: ElementRef
  /** 箭头元素 ref（传入即启用箭头定位中间件） */
  arrow?: ElementRef
  strategy?: Strategy
  placement?: Placement
  /** 主轴偏移（px） */
  offset?: number
  /** 空间不足时翻转 */
  flip?: boolean
  /** 视口内平移 */
  shift?: boolean
  /** 滚动/resize 自动重算 */
  autoUpdate?: boolean
  /** 参考元素随滚动越出视口边缘时的回调（top<0 或 bottom>innerHeight，任一部分越出即触发；
   *  组件据此自动关闭弹层，避免触发器不可见后弹层悬空、叠在站点顶栏之上） */
  onReferenceEscape?: () => void
  /** 附加 z-index（内部调用 nextZIndex 的结果） */
  zIndex?: number
}

export function useFloating(options: UseFloatingOptions = {}) {
  const {
    strategy = 'fixed',
    placement: defaultPlacement = 'bottom-start',
    offset = 8,
    flip: flipEnabled = true,
    shift: shiftEnabled = true,
    autoUpdate: autoUpdateEnabled = true,
    onReferenceEscape = null,
    arrow: externalArrowRef = null,
  } = options

  const referenceRef: ElementRef = options.reference ?? ref<HTMLElement | null>(null)
  const floatingRef: ElementRef = options.floating ?? ref<HTMLElement | null>(null)
  // 箭头 ref：消费方可传入自有 ref（其模板绑定箭头元素），否则内部自建（恒空 = 无箭头）
  const arrowRef: ElementRef = options.arrow ?? ref<HTMLElement | null>(null)

  const x = ref(0)
  const y = ref(0)
  const visible = ref(false)
  const placement = ref<Placement>(defaultPlacement)
  const middlewareData = ref<MiddlewareData>({})

  let cleanupAutoUpdate: (() => void) | null = null

  function buildMiddleware() {
    const list = [offsetMiddleware(offset)]
    if (flipEnabled) list.push(flip())
    if (shiftEnabled) list.push(shift({ padding: 4 }))
    // 每次重算时解包真实元素（arrow 未挂载时跳过，autoUpdate 会在挂载后重算）
    const arrowElement = unref(arrowRef)
    if (arrowElement) {
      list.push(arrowMiddleware({ element: arrowElement, padding: 4 }))
    }
    list.push(hideMiddleware())
    return list
  }

  async function update(): Promise<void> {
    const reference = unref(referenceRef)
    const floating = unref(floatingRef)
    if (!reference || !floating) return
    // 参考元素越出视口边缘：通知消费方关闭弹层（触发器不可见后弹层不应悬空）
    if (onReferenceEscape) {
      const r = reference.getBoundingClientRect()
      if (r.top < 0 || r.bottom > (window.innerHeight || document.documentElement.clientHeight)) {
        onReferenceEscape()
        return
      }
    }
    const result = await computePosition(reference, floating, {
      strategy,
      placement: defaultPlacement,
      middleware: buildMiddleware(),
    })
    x.value = result.x
    y.value = result.y
    placement.value = result.placement
    middlewareData.value = result.middlewareData
    Object.assign(floating.style, {
      position: strategy,
      left: `${result.x}px`,
      top: `${result.y}px`,
    })
    // 箭头定位：窗口式箭头（外层 8×8 overflow hidden 裁剪 ::before 旋转方块），
    // 窗口整体推到浮层边框外侧，仅露出朝外的半角三角形
    const arrowData = result.middlewareData.arrow
    const arrowEl = unref(arrowRef)
    if (arrowEl && arrowData) {
      const side = result.placement.split('-')[0] as 'top' | 'right' | 'bottom' | 'left'
      const staticSide = {
        top: 'bottom',
        right: 'left',
        bottom: 'top',
        left: 'right',
      }[side] ?? 'top'
      Object.assign(arrowEl.style, {
        left: arrowData.x != null ? `${arrowData.x}px` : '',
        top: arrowData.y != null ? `${arrowData.y}px` : '',
        right: '',
        bottom: '',
        [staticSide]: '-8px',
      })
      // 供 ::before 按方向取裁剪几何
      floating.dataset.popperSide = side
    }
  }

  function startAutoUpdate(): void {
    const reference = unref(referenceRef)
    const floating = unref(floatingRef)
    if (!autoUpdateEnabled || !reference || !floating || cleanupAutoUpdate) return
    cleanupAutoUpdate = autoUpdate(reference, floating, update)
  }

  function stopAutoUpdate(): void {
    if (cleanupAutoUpdate) {
      cleanupAutoUpdate()
      cleanupAutoUpdate = null
    }
  }

  async function show(): Promise<void> {
    visible.value = true
    await update()
    startAutoUpdate()
  }

  function hide(): void {
    visible.value = false
    stopAutoUpdate()
  }

  async function toggle(): Promise<void> {
    if (visible.value) {
      hide()
    } else {
      await show()
    }
  }

  // 浮层/参考元素变化时重算
  watch(
    [() => unref(referenceRef), () => unref(floatingRef)],
    ([ref1, ref2]) => {
      if (ref1 && ref2 && visible.value) {
        update()
        startAutoUpdate()
      }
    }
  )

  onBeforeUnmount(() => {
    stopAutoUpdate()
  })

  return {
    referenceRef,
    floatingRef,
    arrowRef,
    x,
    y,
    placement,
    visible,
    middlewareData,
    update,
    show,
    hide,
    toggle,
  }
}
