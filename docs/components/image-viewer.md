# ImageViewer 图片预览

全屏图片预览：多图切换、缩放、旋转；[Image](/components/image) 的放大预览即由它承载，也可独立挂在自己的触发器上。

## 基础用法

`v-model` 控制显隐，`url-list` 传入图片组，工具条支持缩放与旋转：

<DemoBlock>
  <eb-button type="primary" @click="visible = true">预览图片（2 张）</eb-button>
  <eb-image-viewer v-model="visible" :url-list="urls" hide-on-click-modal />
</DemoBlock>

## 指定初始图与切换回调

`initial-index` 指定打开时的图片；翻页时触发 `switch`：

<DemoBlock>
  <eb-button @click="visible2 = true">从第 2 张打开</eb-button>
  <eb-text v-if="switched >= 0" size="small" type="info" style="margin-top:8px;display:block">当前第 {{ switched + 1 }} 张</eb-text>
  <eb-image-viewer v-model="visible2" :url-list="urls" :initial-index="1" @switch="i => (switched = i)" />
</DemoBlock>

<script setup>
import { ref } from 'vue'
const urls = [
  'https://picsum.photos/seed/ev-viewer-1/1200/700',
  'https://picsum.photos/seed/ev-viewer-2/1200/700',
]
const visible = ref(false)
const visible2 = ref(false)
const switched = ref(-1)
</script>

## 键盘操作

打开预览后焦点自动移入查看器（关闭时归还原焦点），操作按钮均为原生 button 可 Tab 聚焦：`←` / `→` 切换上一张/下一张，`Esc` 关闭（可用 `close-on-press-escape` 关闭），`+` / `-` 缩放，`0` 重置缩放与旋转。预览打开期间页面滚动被锁定，关闭后恢复。

<ApiTable title="ImageViewer Props" :rows="[
  { name: 'modelValue', desc: '显隐（v-model）', type: 'boolean', default: 'false' },
  { name: 'url-list', desc: '图片地址列表', type: 'string[]', default: '[]' },
  { name: 'initial-index', desc: '打开时的图片下标', type: 'number', default: '0' },
  { name: 'hide-on-click-modal', desc: '点击遮罩关闭', type: 'boolean', default: 'false' },
  { name: 'close-on-press-escape', desc: 'ESC 关闭', type: 'boolean', default: 'true' },
]" />

<ApiTable title="ImageViewer Events" :rows="[
  { name: 'switch', desc: '切换图片', type: '(index: number) => void', default: '—' },
  { name: 'close', desc: '关闭预览', type: '() => void', default: '—' },
]" />
