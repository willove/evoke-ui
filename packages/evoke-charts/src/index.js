import EvChart from './chart.vue'
import { useChart, provideChartContext, injectChartContext } from './useChart'
import { applySeriesPalette, clearSeriesPalette } from './palette'
import { chartOptionsSchema, validateOptions } from './schema'

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
  // Install
  install,
  components,
}

export default { install }
