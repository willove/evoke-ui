# EtScrollArea · 滚动内容区

面板 / 工具区里「内容比容器大」的位的统一滚动外壳：只做 overflow 容器。

<script setup>
const lines = Array.from({ length: 24 }, (_, i) => `第 ${i + 1} 行`)
</script>

<DemoBlock>
  <et-scroll-area direction="vertical" style="height: 160px">
    <ul class="demo-list">
      <li v-for="line in lines" :key="line">{{ line }}</li>
    </ul>
  </et-scroll-area>
</DemoBlock>

## API

<CompApi id="scroll-area" />

## 行为

- 方向声明：内容轴与容器轴不符时才滚，另一轴锁死（侧栏里横滚的面板会把整个工作台带歪）。
- 嵌套滚动不链控（`overscroll-behavior: contain`）：面板内容滚到底不带动外壳继续滚。
- 空内容保一行：`min-height` 取 `--et-size-row`，滚动区是列表位，塌成 0 会让空态与加载态之间闪跳。
- 不引入第二套滚动条样式：需要 `EbScrollbar` / `EbVirtualList` 时由消费方显式使用，框架不替产品选滚动条皮肤。

## 令牌与门禁

- `--et-size-row`（空内容保底行高）。
- M2 验收点「面板内容滚动不影响外壳」由本件的 contain 行为满足。
