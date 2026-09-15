# Loading 加载服务

命令式加载遮罩 + `v-loading` 区块加载指令：请求期间盖住界面或局部容器，结束后手动关闭。骨架屏适合已知结构的占位，加载遮罩适合时长不确定的等待。

## 命令式服务

`service` 返回句柄，调 `close()` 结束；`fullscreen` 全屏遮罩（多次调用只保留一个）：

<DemoBlock>
  <eb-space wrap>
    <eb-button type="primary" @click="openFullscreen">全屏加载（1.5s 自动结束）</eb-button>
    <eb-button @click="openManual">手动关闭</eb-button>
  </eb-space>
</DemoBlock>

## v-loading 区块加载

指令绑定布尔值控制显隐，容器自动进入定位上下文；文案用 `loading-text` 属性或 `v-loading="{ text, value }"` 对象：

<DemoBlock>
  <div style="display:flex;gap:16px;flex-wrap:wrap">
    <div v-loading="cardLoading" loading-text="数据加载中" style="position:relative;border:1px solid var(--eb-border-color);border-radius:8px;padding:20px;width:220px;height:96px">
      <div>区块一：v-loading 布尔值</div>
    </div>
    <div style="border:1px solid var(--eb-border-color);border-radius:8px;padding:20px;width:220px">
      <eb-button size="small" @click="cardLoading = !cardLoading">切换左侧加载态</eb-button>
    </div>
  </div>
</DemoBlock>

<script setup>
import { ref, onBeforeUnmount } from 'vue'

let handle = null
let timer = null
const cardLoading = ref(true)

const openFullscreen = () => {
  handle = $loading.service({ fullscreen: true, text: '正在加载数据…' })
  timer = setTimeout(() => handle?.close(), 1500)
}
const openManual = () => {
  handle = $loading.service({ fullscreen: true, text: '点下方按钮关闭' })
  timer = setTimeout(() => handle?.close(), 5000)
}
onBeforeUnmount(() => {
  clearTimeout(timer)
  handle?.close()
})
</script>

<ApiTable title="Service Options" :rows="[
  { name: 'fullscreen', desc: '全屏遮罩（body 直挂）', type: 'boolean', default: 'false' },
  { name: 'text', desc: '加载文案', type: 'string', default: '' },
  { name: 'background', desc: '遮罩背景色', type: 'string', default: '—' },
  { name: 'target', desc: '挂载目标元素', type: 'HTMLElement', default: 'body' },
]" />

<ApiTable title="Service 返回句柄" :rows="[
  { name: 'close', desc: '关闭遮罩', type: '() => void', default: '—' },
  { name: 'vm', desc: '组件实例（高级用法）', type: 'object', default: '—' },
]" />

<ApiTable title="v-loading 指令" :rows="[
  { name: '绑定值', desc: '真值显示遮罩、假值隐藏', type: 'boolean | { text: string }', default: 'false' },
  { name: 'loading-text', desc: '元素属性形式设置文案', type: 'string', default: '' },
]" />
