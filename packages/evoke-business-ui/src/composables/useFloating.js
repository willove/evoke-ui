/**
 * 浮层定位 composable — @floating-ui/dom 封装
 * Tooltip/Popover/Select/Dropdown/Cascader/DatePicker/TreeSelect 统一消费
 *
 * 策略 fixed + transform（Electron webview 缩放下比 absolute 稳）
 */
import { ref, onBeforeUnmount, watch, unref } from 'vue'
import {
  computePosition,
  autoUpdate,
  offset as offsetMiddleware,
  flip,
  shift,
  arrow as arrowMiddleware,
  hide as hideMiddleware,
} from '@floating-ui/dom'

/**
 * @param {Object} [options]
 * @param {import('vue').Ref<HTMLElement|null>|HTMLElement} [options.reference] 参考元素（可为 virtual element）
 * @param {import('vue').Ref<HTMLElement|null>|HTMLElement} [options.floating] 浮层元素
 * @param {import('vue').Ref<HTMLElement|null>} [options.arrow] 箭头元素 ref（传入即启用箭头定位中间件）
 * @param {'absolute'|'fixed'} [options.strategy='fixed']
 * @param {string} [options.placement='bottom-start']
 * @param {number} [options.offset=8] 主轴偏移（px）
 * @param {boolean} [options.flip=true] 空间不足时翻转
 * @param {boolean} [options.shift=true] 视口内平移
 * @param {boolean} [options.autoUpdate=true] 滚动/resize 自动重算
 * @param {number} [options.zIndex] 附加 z-index（内部调用 nextZIndex 的结果）
 * @returns 浮层状态与方法
 */
export function useFloating(options = {}) {
  const {
    strategy = 'fixed',
    placement: defaultPlacement = 'bottom-start',
    offset = 8,
    flip: flipEnabled = true,
    shift: shiftEnabled = true,
    autoUpdate: autoUpdateEnabled = true,
    arrow: externalArrowRef = null,
  } = options

  const referenceRef = options.reference ?? ref(null)
  const floatingRef = options.floating ?? ref(null)
  // 箭头 ref：消费方可传入自有 ref（其模板绑定箭头元素），否则内部自建（恒空 = 无箭头）
  const arrowRef = options.arrow ?? ref(null)

  const x = ref(0)
  const y = ref(0)
  const visible = ref(false)
  const placement = ref(defaultPlacement)
  const middlewareData = ref({})

  let cleanupAutoUpdate = null

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

  async function update() {
    const reference = unref(referenceRef)
    const floating = unref(floatingRef)
    if (!reference || !floating) return
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
      const side = result.placement.split('-')[0]
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

  function startAutoUpdate() {
    const reference = unref(referenceRef)
    const floating = unref(floatingRef)
    if (!autoUpdateEnabled || !reference || !floating || cleanupAutoUpdate) return
    cleanupAutoUpdate = autoUpdate(reference, floating, update)
  }

  function stopAutoUpdate() {
    if (cleanupAutoUpdate) {
      cleanupAutoUpdate()
      cleanupAutoUpdate = null
    }
  }

  async function show() {
    visible.value = true
    await update()
    startAutoUpdate()
  }

  function hide() {
    visible.value = false
    stopAutoUpdate()
  }

  async function toggle() {
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
