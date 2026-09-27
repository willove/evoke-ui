# EtBanner · 内联横条通知

跟内容同流的内联横条：浅底 + 图标色，warn/error 打断式播报。

<script setup>
import { ref } from 'vue'
const open = ref(true)
</script>

<DemoBlock densities>
  <div class="demo-col">
    <et-banner v-if="open" type="warn" title="有未保存改动" @close="open = false">
      切换页面前请先保存，或选择「放弃改动」。
    </et-banner>
    <et-tool-button v-else size="small" icon="refresh" label="重新显示" @click="open = true" />
  </div>
</DemoBlock>

## API

<CompApi id="banner" />

## 行为

- 内联件（不 Teleport）：随消费方的容器排版。
- `warn` / `error` 用 `role="alert"`（打断式播报），`info` 用 `role="status"`（礼貌播报）。
- 关闭钮带 `aria-label`（G4）。
- 与 `EtToast` 的分界：横条常驻在内容流里讲一件事，Toast 是瞬时反馈、不占布局。

## 令牌与门禁

- 浅底 + 图标色走语义色令牌，文字仍走中性阶；三种 type 即一屏彩色上限内的三档。
