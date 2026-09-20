import DocLayout from './DocLayout.vue'
import DemoBlock from './DemoBlock.vue'
import DocExample from './DocExample.vue'
import ApiTable from './ApiTable.vue'
import Icon from './Icon.vue'
import EvButton from '../../../packages/evoke-ui/src/components/button/index.vue'
import EvTimeline from '../../../packages/evoke-ui/src/components/timeline/index.vue'
import { Charts3d } from '@wil-works/charts-3d'
import '../../../packages/evoke-ui/src/styles/variables.css'
import './style.css'

/**
 * 自定义主题 — Charts 3D 文档站布局
 * 三维图表包源码级全局注册（源码改动即时反映到演示）；
 * --ev-* 令牌来自 evoke-ui variables.css（含 html.dark 重映射），仅注入令牌不注入组件库 reset。
 * EvButton 仅供演示页控件使用。
 */
export default {
  Layout: DocLayout,
  enhanceApp({ app }) {
    app.use(Charts3d)
    app.component('DemoBlock', DemoBlock)
    app.component('DocExample', DocExample)
    app.component('ApiTable', ApiTable)
    app.component('CdIcon', Icon)
    app.component('EvButton', EvButton)
    app.component('EvTimeline', EvTimeline)
  },
}
