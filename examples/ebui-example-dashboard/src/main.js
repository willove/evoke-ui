import { createApp } from 'vue'
import EvokeBusinessUI from '@wil-works/evoke-business-ui'
import '@wil-works/evoke-business-ui/styles'
// 图表组件（<eb-chart>）随 EvokeBusinessUI 注册，样式来自图表独立包
import '@wil-works/evoke-charts/styles'
import App from './App.vue'

const app = createApp(App)
app.use(EvokeBusinessUI)
app.mount('#app')
