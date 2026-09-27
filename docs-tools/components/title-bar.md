# EtTitleBar · 标题栏

产品外壳标题栏：产品名 / 快捷访问位 / 文档名 / 窗口控制位（双宿主适配）。

<script setup>
import { ref } from 'vue'
const host = ref('web')
const last = ref('')
</script>

<DemoBlock>
  <div class="demo-col">
    <div class="demo-row">
      <et-tool-button v-for="h in ['web', 'desktop']" :key="h" size="small" :icon="h === 'web' ? 'grid' : 'computer'" :label="h === 'web' ? 'Web 宿主' : '桌面壳'" :active="host === h" @click="host = h" />
    </div>
    <et-title-bar title="报表工具" doc-title="报表.xlsx" :host="host" @window-control="last = $event">
      <template #quick><et-key-hint combo="mod+s" /></template>
    </et-title-bar>
    <p class="demo-readout">窗口控制 <code>{{ last || '—' }}</code></p>
  </div>
</DemoBlock>

## API

<CompApi id="title-bar" />

## 行为

- 宿主 × 平台矩阵全部查 `runtime/window/host` 的表，本件不写平台 if-else。
- Web 宿主无窗口控制位；桌面壳 macOS 左置 traffic lights（close 先），Win / Linux 右置三联钮（minimize 先）。
- `documentElement` 的 `data-host` 属性优先于 UA 探测（宿主自证 + 测试注入同一条路径）。
- 拖曳区与可点区不冲突：`-webkit-app-region: drag` 只加在纯空白条带上，控制位与快捷位显式 no-drag。
- 快捷键提示一律走 `EtKeyHint`（平台符号化，不手拼字符）。

## 令牌与门禁

- `--et-chrome-titlebar-height`（32px）、`--et-icon-sm`（控制位 16 档）。
- G4：控制位是图标钮，必须 `aria-label`。
- M3 验收：两种宿主下布局正确，拖拽区与可点区零重叠。
