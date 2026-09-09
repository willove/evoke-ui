# QRCode 二维码

纯 JS 编码（byte 模式 / M 级纠错 / 版本 1-10 自动选择，最长 214 字节，中文按 UTF-8 计），Canvas 高清渲染（devicePixelRatio 适配），无外部依赖、离线可用。

## 基础用法

<DemoBlock>
  <ev-space size="middle">
    <ev-qrcode :value="text" :size="128" />
    <div>
      <ev-input v-model="text" placeholder="修改内容实时刷新" style="width: 220px" />
      <p style="font-size: 12px; color: var(--ev-text-color-secondary); margin-top: 8px;">换主色/暗色模式下前景背景色可用令牌覆盖</p>
    </div>
  </ev-space>
</DemoBlock>

<script setup>
import { ref } from 'vue'
const text = ref('https://evoke-ui.example.com/join?id=42')
</script>

## 自定义颜色与静区

<DemoBlock>
  <ev-space size="middle">
    <ev-qrcode value="Evoke Business UI" :size="112" foreground="#175DFF" />
    <ev-qrcode value="Evoke Business UI" :size="112" :margin="2" />
  </ev-space>
</DemoBlock>

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
