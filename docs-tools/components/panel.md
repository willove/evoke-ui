# EtPanel · 停靠面板

侧/底停靠面板：标题栏（标题 + 工具位 + 动作组）+ 内容区，状态只由 props 来。

<script setup>
import { computed, ref } from 'vue'
const collapsed = ref(false)
const closed = ref(false)
const maximized = ref(false)
const node = computed(() => ({ id: 'files', title: '文件', closable: true, collapsed: collapsed.value }))
</script>

<DemoBlock densities>
  <et-panel
    v-if="!closed"
    :panel="node"
    :maximized="maximized"
    @collapse="collapsed = true"
    @expand="collapsed = false"
    @close="closed = true"
    @maximize="maximized = true"
    @restore="maximized = false"
  >
    <template #tools>
      <et-tool-button size="small" icon="more" label="更多" />
    </template>
    <p class="demo-readout">文件 · 12 项</p>
  </et-panel>
</DemoBlock>

<div v-if="closed" class="demo-row">
  <span class="demo-readout">已关闭</span>
  <et-tool-button size="small" icon="refresh" label="重新打开" @click="closed = false" />
</div>

## API

<CompApi id="panel" />

## 行为

- 标题栏 = 标题 + tools 工具位 + 动作组（折叠 / 最大化|还原 / 关闭）。
- 本件不存 `collapsed` / `maximized`：单一事实源是布局树，写树入口在 EtWorkbench。
- 折叠态内容用 `v-if` 不渲染（省 DOM，折叠后面板不占事件天然成立）。
- 全屏只做视觉放大 + 层级抬升，不用 fixed 定位（那会提出工作台流、盖住 chrome）。
- `closable !== false` 才渲染关闭钮；三个动作钮都带 `aria-label`（G4）。

## 令牌与门禁

- `--et-panel-header-height`（28px，不随密度档变化）、`--et-icon-sm`（标题栏图标 16 档）。
- G7：标题栏高度钉死，内容溢出走内部滚动。
