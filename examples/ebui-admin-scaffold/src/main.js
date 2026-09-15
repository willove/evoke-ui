import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import EvokeBusinessUI from '@wil-works/evoke-business-ui'
import '@wil-works/evoke-business-ui/styles'
import App from './App.vue'
import { routes } from './routes'
import './styles.css'

const app = createApp(App)

// Hash 路由：静态托管 / Electron / 内网部署零配置
const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
app.use(router)
// EbMenu router 模式依赖 provide('router')
app.provide('router', router)

app.use(EvokeBusinessUI)
app.mount('#app')
