import EvChart from './chart.vue'
import { useChart, provideChartContext, injectChartContext } from './useChart'
import { applySeriesPalette, clearSeriesPalette } from './palette'
import { chartOptionsSchema, validateOptions } from './schema'
import {
  generateChartSpec,
  parseDataTable,
  buildChartPrompt,
  lintChartSpec,
} from './ai/index.js'

const components = {
  EvChart,
}

// ─── Vue Plugin Install ───
function install(app, _options = {}) {
  for (const [name, component] of Object.entries(components)) {
    app.component(name, component)
  }
}

export const EvokeCharts = { install }

export {
  // 组件
  EvChart,
  // Composables
  useChart,
  provideChartContext,
  injectChartContext,
  // 配色方案
  applySeriesPalette,
  clearSeriesPalette,
  // Spec 契约
  chartOptionsSchema,
  validateOptions,
  // AI 生成引擎（数据 → Spec 合成 / 提示词契约 / 渲染自检）
  generateChartSpec,
  parseDataTable,
  buildChartPrompt,
  lintChartSpec,
  // Install
  install,
  components,
}

export default { install }
