import { createApp } from 'vue'
import EvokeBusinessUI from '@wil-works/evoke-business-ui'
import '@wil-works/evoke-business-ui/styles'
import App from './App.vue'

const app = createApp(App)
app.use(EvokeBusinessUI)
app.mount('#app')
