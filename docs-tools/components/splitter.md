# EtSplitter / EtSplitterPanel · 分隔面板族

底座分隔基元的工具度量适配：拖拽条厚度、热区、把手走 `--et-splitter-*`，其余透传。

<script setup>
import { ref } from 'vue'
const sizes = ref([])
</script>

<DemoBlock>
  <div class="demo-col">
    <et-splitter layout="horizontal" class="demo-splitter" @resize="sizes = $event">
      <et-splitter-panel size="38%" min="180"><p class="demo-readout">文件树</p></et-splitter-panel>
      <et-splitter-panel size="62%" min="240"><p class="demo-readout">编辑器（拖或聚焦分隔条按 ←/→）</p></et-splitter-panel>
    </et-splitter>
    <p class="demo-readout">回传尺寸 <code>{{ sizes.length ? sizes.join(' / ') : '—' }}</code></p>
  </div>
</DemoBlock>

## EtSplitter

<CompApi id="splitter" />

面板件 `EtSplitterPanel`（`size` / `min` / `max` / `keyboardStep` 等透传面）见 [其单页](/components/splitter-panel)。

## 行为

- 面板注册、尺寸分摊、min/max 夹角、拖拽、折叠与百分比回传全部来自底座；本族只换度量。
- 拖拽条由底座 `EbSplitterPanel` 自渲染；`EtDock` 用族内包装件而不是裸底座，`.et-splitter` 作用域才落得上。
- **键盘 resize（1.2.0）**：可拖拽时拖拽条即 `role="separator"`（`tabindex=0`、`aria-orientation`、
  `aria-valuenow/min/max` 取前面板）；←/→（横排）或 ↑/↓（竖排）按 `keyboardStep` 移动边界，
  Home/End 到 min/max，与拖拽同一套夹角；组字中不响应。停靠面板可纯键盘调尺寸。

## 令牌与门禁

- `--et-splitter-*`：拖拽条可视厚度 / 热区 / 把手度量，覆盖写在 `.et-splitter .eb-splitter__bar` 上。
- G7：度量只引用令牌，禁字面量 px。
