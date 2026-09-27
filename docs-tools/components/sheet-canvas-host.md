# EtSheetCanvasHost · 画布宿主

**office 层**的画布地基：可滚动视口 + 不随内容滚动的浮层位 + 尺寸/滚动契约 + 焦点根。
它不认识单元格、也不画东西——格子怎么画、怎么虚拟化，都在默认槽里由产品决定。

<script setup>
import { ref } from 'vue'
const size = ref({ width: 0, height: 0 })
const scroll = ref({ scrollLeft: 0, scrollTop: 0 })
const focused = ref(false)
</script>

<DemoBlock>
  <div class="demo-col">
    <et-sheet-canvas-host
      label="工作表演示"
      :content-width="1600"
      :content-height="900"
      overlay
      @resize="size = $event"
      @scroll="scroll = $event"
      @viewport-focus="focused = true"
      @viewport-blur="focused = false"
    >
      <div class="demo-canvas">滚动这块 1600×900 的内容位</div>
      <template #overlay><span class="demo-readout">浮层位：不随内容滚动</span></template>
    </et-sheet-canvas-host>
    <p class="demo-readout">
      视口 <code>{{ Math.round(size.width) }}×{{ Math.round(size.height) }}</code> ·
      滚动 <code>{{ Math.round(scroll.scrollLeft) }}, {{ Math.round(scroll.scrollTop) }}</code> ·
      焦点 <code>{{ focused ? '在画布内' : '外' }}</code>
    </p>
  </div>
</DemoBlock>

## API

<CompApi id="sheet-canvas-host" />

## 契约要点

- **事件是视口的量**，不是内容的量：虚拟化产品按它算可见区；
- **浮层不随滚动**：需要跟随单元格的浮层（编辑器）走 `#overlay` + 产品自己算坐标；
- **宿主不加外框**：边框归布局/停靠，避免与分隔线叠成双线；
- **画布聚焦不加内描边**：焦点可见性由产品在"当前单元格"上表达（办公软件的通行做法）。
