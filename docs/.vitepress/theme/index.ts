import { defineComponent, h } from 'vue'
import DocLayout from './DocLayout.vue'
import DemoBlock from './DemoBlock.vue'
import DocExample from './DocExample.vue'
import MobileStage from './MobileStage.vue'
import ApiTable from './ApiTable.vue'
import IconGallery from './IconGallery.vue'
import Icon from './Icon.vue'
import EvokeBusinessUI from '@wil-works/evoke-business-ui'
import '@wil-works/evoke-business-ui/styles'
import './style.css'

/**
 * 自定义主题 — 文档站布局
 * 组件库源码级全局注册（源码改动即时反映到演示）
 */
export default {
  Layout: DocLayout,
  enhanceApp({ app }) {
    app.use(EvokeBusinessUI)
    app.component('DemoBlock', DemoBlock)
    app.component('DocExample', DocExample)
    app.component('MobileStage', MobileStage)
    app.component('ApiTable', ApiTable)
    app.component('IconGallery', IconGallery)
    app.component('BdIcon', Icon)
  },
}
