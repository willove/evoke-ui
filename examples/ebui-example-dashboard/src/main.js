import { createApp } from 'vue'
import EvokeBusinessUI from '@wil-works/evoke-business-ui'
import '@wil-works/evoke-business-ui/styles'
import EvokeCharts from '@wil-works/evoke-charts'
import '@wil-works/evoke-charts/styles'
import App from './App.vue'

const app = createApp(App)
app.use(EvokeBusinessUI)
app.use(EvokeCharts)
app.mount('#app')
