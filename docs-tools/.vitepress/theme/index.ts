import TdLayout from './TdLayout.vue'
import DemoBlock from './DemoBlock.vue'
import DocExample from './DocExample.vue'
import ApiTable from './ApiTable.vue'
import CompApi from './CompApi.vue'
import ToolsOverview from './ToolsOverview.vue'
import SlotContract from './SlotContract.vue'
import OfficeBandsDemo from './OfficeBandsDemo.vue'
import Icon from './Icon.vue'
import EvokeToolsUI from '@wil-works/evoke-tools-ui'
import EbBusinessUI from '@wil-works/evoke-business-ui'
import '@wil-works/evoke-tools-ui/styles'
import '@wil-works/evoke-business-ui/styles'
import './style.css'

/**
 * 自定义主题 — Evoke Tools UI 文档站布局
 *
 * 与 business / charts 两站同构：**不引入 VitePress 默认主题**（自写外壳 + 自备
 * 代码块/演示块/正文样式，style.css 一段不落），否则默认主题的 .vp-doc 样式
 * 与 useCopyCode 处理器会和本站外壳重复打架。
 *
 * 两库源码级全局注册（vite alias 指到 src，源码改动即时反映到演示）：
 * 演示页直接写 <et-tool-button> / <eb-segmented>，与消费方 app.use(...) 同路径。
 */
export default {
  Layout: TdLayout,
  enhanceApp({ app }) {
    app.use(EvokeToolsUI)
    // 演示里会直接用底座件（eb-button / eb-segmented…）——与消费方同路径全注册
    app.use(EbBusinessUI)
    app.component('DemoBlock', DemoBlock)
    app.component('DocExample', DocExample)
    app.component('ApiTable', ApiTable)
    app.component('CompApi', CompApi)
    app.component('ToolsOverview', ToolsOverview)
    app.component('SlotContract', SlotContract)
    app.component('OfficeBandsDemo', OfficeBandsDemo)
    app.component('TdIcon', Icon)
  },
}