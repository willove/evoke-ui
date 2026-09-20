/**
 * Evoke Charts · 三维篇章（@wil-works/evoke-charts/3d）
 *
 * 与二维主入口（./index.js）平行的独立篇章：自绘透视投影管线
 * （向量/矩阵数学 → 轨道相机 → 场景图元 → 画家算法深度排序 → Canvas 2D），
 * 不依赖 WebGL 封装库；色系 / 令牌 / 换肤事件与二维同源。
 * 独立子入口保证只用二维的消费方不背三维的包体。
 */
import EvChart3d from './chart3d.vue'
import { useChart3d } from './useChart3d'
import { applySeriesPalette, clearSeriesPalette } from '../palette.js'
import {
  CHART3D_PALETTES,
  CHART3D_PALETTE_IDS,
  CHART3D_RAMPS,
  resolveChartPalette,
  resolveChartRamp,
} from './palette'
import { chart3dOptionsSchema, validateOptions3d } from './schema'
import {
  CHART3D_TYPES,
  CHART_COLORS,
  getTheme,
  easings,
} from './types'
import { render3d } from './renderer'
import { createSvgRecorder } from './renderer/svgRecorder'
import { DEFAULT_CAMERA, resolveCamera } from './core/camera'
import { projectScene, pickScene } from './core/scene'

const components = {
  EvChart3d,
}

// ─── Vue Plugin Install ───
function install(app, _options = {}) {
  for (const [name, component] of Object.entries(components)) {
    app.component(name, component)
  }
}

export const Charts3d = { install }

export {
  // 组件
  EvChart3d,
  // Composables
  useChart3d,
  // 色系（与 evoke-charts 同 id 同色值）
  CHART3D_PALETTES,
  CHART3D_PALETTE_IDS,
  CHART3D_RAMPS,
  resolveChartPalette,
  resolveChartRamp,
  applySeriesPalette,
  clearSeriesPalette,
  // 主题与常量
  CHART3D_TYPES,
  CHART_COLORS,
  getTheme,
  easings,
  // Spec 契约
  chart3dOptionsSchema,
  validateOptions3d,
  // 相机
  DEFAULT_CAMERA,
  resolveCamera,
  // 底层管线（自定义图型 / 服务端渲染场景）
  render3d,
  projectScene,
  pickScene,
  createSvgRecorder,
  // Install
  install,
  components,
}

export default { install }
