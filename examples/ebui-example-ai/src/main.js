import { createApp } from 'vue'
import EvokeBusinessUI from '@wil-works/evoke-business-ui'
import '@wil-works/evoke-business-ui/styles'
import EvokeChat from '@wil-works/evoke-chat'
import '@wil-works/evoke-chat/styles'
import App from './App.vue'

const app = createApp(App)
app.use(EvokeBusinessUI)
app.use(EvokeChat)
app.mount('#app')
