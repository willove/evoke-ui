# Progress 进度条

<script setup>
import { ref } from 'vue'

const dynamicVal = ref(30)

function segmentColor(p) {
  if (p < 40) return '#f56c6c'
  if (p < 80) return '#e6a23c'
  return '#67c23a'
}
</script>

展示操作或任务的当前进度，支持线性（line）与环形（circle / dashboard）两种形态。内置 success / warning / exception 状态色，也可通过 `color` 自定义；`percentage` 超出 0-100 会自动截断，数值变化按 `duration` 秒平滑过渡。

## 基础用法

`percentage` 接受 0-100 的数字；`status` 指定状态后进度条与文字切换为语义色（success 绿 / warning 橙 / exception 红）。

<DemoBlock>
  <eb-progress :percentage="20" />
  <eb-progress :percentage="60" style="margin-top: 12px;" />
  <eb-progress :percentage="80" status="success" style="margin-top: 12px;" />
  <eb-progress :percentage="45" status="warning" style="margin-top: 12px;" />
  <eb-progress :percentage="35" status="exception" style="margin-top: 12px;" />
  <eb-progress :percentage="50" :text-inside="true" :stroke-width="18" style="margin-top: 12px;" />
</DemoBlock>

## 内显文字与加粗轨道

`text-inside` 把百分比文字放进进度条内部，需要配合较大的 `stroke-width`（line 形态下 stroke-width 是轨道高度）才有足够空间。

<DemoBlock>
  <eb-progress :percentage="66" :stroke-width="20" :text-inside="true" />
  <eb-progress :percentage="90" :stroke-width="20" :text-inside="true" status="success" style="margin-top: 12px;" />
</DemoBlock>

## 环形进度与仪表盘

`type="circle"` 渲染环形进度（`width` 控制直径，`stroke-width` 控制线条粗细），`type="dashboard"` 渲染 270 度仪表盘形态；`color` 传字符串固定颜色。

<DemoBlock>
  <eb-progress type="circle" :percentage="25" :width="90" />
  <eb-progress type="circle" :percentage="70" :width="90" status="success" style="margin-left: 24px;" />
  <eb-progress type="dashboard" :percentage="55" :width="90" :color="'#7c3aed'" style="margin-left: 24px;" />
</DemoBlock>

## 动态进度

进度值变化时按 `duration`（默认 0.3 秒）平滑过渡，适合上传、轮询等场景。

<DemoBlock>
  <eb-progress :percentage="dynamicVal" :stroke-width="18" :text-inside="true" />
  <eb-button style="margin-top: 12px;" @click="dynamicVal = Math.min(100, dynamicVal + 10)">前进 10</eb-button>
  <eb-button style="margin-top: 12px; margin-left: 8px;" @click="dynamicVal = 0">重置</eb-button>
</DemoBlock>

## 自定义颜色

`color` 传函数时入参为当前百分比，返回颜色值，可实现分段变色；传字符串则全程固定颜色。

<DemoBlock>
  <eb-progress :percentage="dynamicVal" :color="segmentColor" />
  <eb-progress :percentage="dynamicVal" :color="'#16a34a'" style="margin-top: 12px;" />
</DemoBlock>

## 自定义文字

`#text` 插槽替换右侧百分比文字，作用域插槽入参为 `{ percentage }`。

<DemoBlock>
  <eb-progress :percentage="60">
    <template #text="{ percentage }">
      <span style="font-size: 13px;">已上传 {{ Math.round(percentage / 10) }}/6 个文件</span>
    </template>
  </eb-progress>
</DemoBlock>

## 使用提示

- circle / dashboard 形态下 `stroke-width` 是相对直径的线条宽度，调大 `width` 时同步调大线条更协调；
- `status` 与 `color` 同时提供时，`color` 优先；
- 环形文字同样支持 `#text` 插槽，常用于将百分比替换为分数、件数等业务语义。

## API

<ApiTable title="Progress Props" :rows="[
  { name: 'percentage', desc: '进度百分比，超出 0-100 自动截断', type: 'number', default: '0' },
  { name: 'type', desc: '形态', type: 'line | circle | dashboard', default: 'line' },
  { name: 'stroke-width', desc: '进度条粗细（px），line 为轨道高度，circle 为线条宽度（缺省 6）', type: 'number', default: '—' },
  { name: 'status', desc: '状态，决定进度条与文字配色', type: 'success | warning | exception', default: '—' },
  { name: 'show-text', desc: '是否显示百分比文字', type: 'boolean', default: 'true' },
  { name: 'text-inside', desc: '文字显示在进度条内部（仅 line）', type: 'boolean', default: 'false' },
  { name: 'width', desc: 'circle / dashboard 直径（px）', type: 'number', default: '126' },
  { name: 'color', desc: '进度条颜色，函数入参为当前百分比；缺省按 status 取语义色', type: 'string | (percentage) => string', default: '—' },
  { name: 'duration', desc: '进度变化的过渡时长（秒）', type: 'number', default: '0.3' },
]" />

<ApiTable title="Slots" :rows="[
  { name: 'text', desc: '自定义右侧文字内容（show-text 且非 text-inside 时渲染）', type: '{ percentage: number }', default: '—' },
]" />
