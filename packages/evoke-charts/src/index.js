import EvChart from './chart.vue'
import { useChart, provideChartContext, injectChartContext } from './useChart'

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
  // Install
  install,
  components,
}

export default { install }
