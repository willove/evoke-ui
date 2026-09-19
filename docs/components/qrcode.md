# QRCode 二维码

纯 JS 编码（byte 模式 / M 级纠错 / 版本 1-10 自动选择，最长 214 字节，中文按 UTF-8 计），Canvas 高清渲染（devicePixelRatio 适配），无外部依赖、离线可用。

## 基础用法

<DemoBlock>
  <eb-space size="middle">
    <eb-qrcode :value="text" :size="128" />
    <div>
      <eb-input v-model="text" placeholder="修改内容实时刷新" style="width: 220px" />
      <p style="font-size: 12px; color: var(--eb-text-color-secondary); margin-top: 8px;">换主色/暗色模式下前景背景色可用令牌覆盖</p>
    </div>
  </eb-space>
</DemoBlock>

## 自定义颜色与静区

`margin` 收窄四周静区；第二个示例深底反白，前景与背景需保持足够对比度，否则影响扫码识别：

<DemoBlock>
  <eb-space size="middle">
    <eb-qrcode value="Evoke Business UI" :size="112" :margin="2" />
    <eb-qrcode value="Evoke Business UI" :size="112" foreground="#175DFF" background="#EFF6FF" />
    <eb-qrcode value="Evoke Business UI" :size="112" foreground="#F9FAFB" background="#111827" />
  </eb-space>
</DemoBlock>

## 输出尺寸

`size` 为画布输出尺寸（px），码点模块自动缩放并对齐像素边界，缩放不失真：

<DemoBlock>
  <eb-space size="middle">
    <eb-qrcode :value="text" :size="qrSize" />
    <eb-radio-group v-model="qrSize">
      <eb-radio :label="96">96px</eb-radio>
      <eb-radio :label="128">128px</eb-radio>
      <eb-radio :label="192">192px</eb-radio>
    </eb-radio-group>
  </eb-space>
</DemoBlock>

## 导出 PNG

通过 ref 调用 `toDataURL()` 拿到 PNG dataURL，可直接触发下载或回显：

<DemoBlock>
  <eb-space size="middle">
    <eb-qrcode ref="qrRef" :value="text" :size="128" />
    <div>
      <eb-button type="primary" @click="downloadQrcode">下载 PNG</eb-button>
      <p v-if="qrDataUrl" style="font-size: 12px; color: var(--eb-text-color-secondary); margin-top: 8px;">已通过 toDataURL 导出并触发下载</p>
    </div>
  </eb-space>
</DemoBlock>

<script setup>
import { ref } from 'vue'
const text = ref('https://evoke-ui.example.com/join?id=42')
const qrSize = ref(128)
const qrRef = ref(null)
const qrDataUrl = ref('')
const downloadQrcode = () => {
  const url = qrRef.value?.toDataURL()
  if (!url) return
  qrDataUrl.value = url
  const link = document.createElement('a')
  link.href = url
  link.download = 'qrcode.png'
  link.click()
}
</script>

## QRCode API

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| value | String | — | 编码内容（超长时 console.error 并保持上次内容） |
| size | Number | `120` | 输出尺寸（px） |
| margin | Number | `4` | 静区（四周留白，模块数） |
| foreground | String | `#000000` | 前景色 |
| background | String | `#ffffff` | 背景色 |

暴露方法：`toDataURL()` 导出 PNG。底层编码器可独立引入：

```js
import { encodeQR } from '@wil-works/evoke-business-ui/dist/index.mjs'
// encodeQR(text, { maskId? }) → { matrix, version, size, maskId }
```
