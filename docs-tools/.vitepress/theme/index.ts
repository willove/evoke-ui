import DefaultTheme from 'vitepress/theme'
import TdLayout from './TdLayout.vue'
import DemoBlock from './DemoBlock.vue'
import DocExample from './DocExample.vue'
import ApiTable from './ApiTable.vue'
import Icon from './Icon.vue'
import EvokeToolsUI from '@wil-works/evoke-tools-ui'
import EbBusinessUI from '@wil-works/evoke-business-ui'
import '@wil-works/evoke-tools-ui/styles'
import '@wil-works/evoke-business-ui/styles'
import './style.css'

/**
 * tools-ui 文档站主题（M4 后站点优化）
 *
 * 与 charts 站同构的机制：动态 demo 块 + 源码级消费（vite alias 指到 src）+ ApiTable。
 * 保留 VitePress 默认布局（工具的文档是查阅型，默认布局的侧栏/目录已够），
 * 定制集中在 DemoBlock 与首屏 hero（style.css 的 td-* 段）。
 *
 * 全局注册两库：演示页直接写 <et-tool-button> / <eb-button>，
 * 与消费方 app.use(EvokeToolsUI) 的真实路径一致（不是只为演示存在的包装）。
 */
export default {
  ...DefaultTheme,
  // 家族一致性：tools 站用与 business / charts 同构的自写外壳
  // （devwarn + logo/版本顶栏 + 图标导航 + 站内搜索 + 定制侧栏）
  Layout: TdLayout,
  enhanceApp({ app }) {
    app.use(EvokeToolsUI)
    // 演示里会直接用底座件（eb-button / eb-segmented…）——与消费方同路径全注册
    app.use(EbBusinessUI)
    app.component('DemoBlock', DemoBlock)
    app.component('DocExample', DocExample)
    app.component('ApiTable', ApiTable)
    app.component('TdIcon', Icon)
  },
}
