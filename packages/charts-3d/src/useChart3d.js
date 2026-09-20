/**
 * useChart3d — 命令式使用三维图表的组合式 API
 * 模板里仍用 <EvChart3d ref="chartRef">，本 composable 只是把常用实例方法
 * 收拢成解构友好的形式，并提供相机快捷操作。
 */
import { onBeforeUnmount, ref, shallowRef } from 'vue'

export function useChart3d() {
  const containerRef = ref(null)
  const chartRef = shallowRef(null)
  const disposed = ref(false)

  const invoke = (method, ...args) => {
    const inst = chartRef.value
    if (!inst || typeof inst[method] !== 'function') return undefined
    return inst[method](...args)
  }

  onBeforeUnmount(() => {
    disposed.value = true
    invoke('destroy')
  })

  return {
    containerRef,
    chartRef,
    /** 相机读取/写入（自动触发重绘并派发 camera-change） */
    getCamera: () => invoke('getCamera'),
    setCamera: (next) => invoke('setCamera', next),
    resetCamera: () => invoke('resetCamera'),
    /** 相机快捷操作：环绕（度）与缩放（倍率） */
    orbit: (dYaw, dPitch) => {
      const cam = invoke('getCamera')
      if (!cam) return null
      return invoke('setCamera', { yaw: cam.yaw + (dYaw || 0), pitch: cam.pitch + (dPitch || 0) })
    },
    zoom: (factor) => {
      const cam = invoke('getCamera')
      if (!cam) return null
      return invoke('setCamera', { distance: cam.distance * (factor || 1) })
    },
    toggleSeries: (name) => invoke('toggleSeries', name),
    getHiddenSeries: () => invoke('getHiddenSeries'),
    toDataURL: (type, quality) => invoke('toDataURL', type, quality),
    exportSVG: (options) => invoke('exportSVG', options),
    refresh: () => invoke('refresh'),
    resize: () => invoke('resize'),
    getProjected: () => invoke('getProjected'),
    isDisposed: () => disposed.value,
  }
}
