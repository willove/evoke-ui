import { createApp } from 'vue'
import App from './App.vue'
import EvokeToolsUI from '@wil-works/evoke-tools-ui'
// 底座样式（reset + --eb-* + 暗色）与工具层样式（--et-*）先挂后渲染
import '@wil-works/evoke-business-ui/styles'
import '@wil-works/evoke-tools-ui/styles'

createApp(App).use(EvokeToolsUI).mount('#app')
