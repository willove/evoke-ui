# Rate 评分

<script setup>
import { ref } from 'vue'

const v = ref(3)
const v2 = ref(3.5)
</script>


星级评分控件：支持半星、鼠标悬停预览、键盘方向键步进（allow-half 时步进 0.5）；填充色按 low/high 阈值分三档取色，可展示分级文案或总分。组件获得焦点后可用方向键调整分值。

## 基础用法

`v-model` 绑定分值；`allow-half` 开启半星（悬停星左半取 0.5），`clearable` 时再次点击当前分值清零。

<DemoBlock>
  <ev-rate v-model="v" />
  <ev-rate v-model="v2" allow-half clearable />
</DemoBlock>

## 尺寸

`size` 影响图标大小（large 24px / default 18px / small 14px）。

<DemoBlock>
  <ev-rate :model-value="3" size="large" />
  <ev-rate :model-value="3" />
  <ev-rate :model-value="3" size="small" />
</DemoBlock>

## 最大分值

`max` 决定星星数量，分值范围 0 到 max；`texts` 文案数量应与 max 匹配。

<DemoBlock>
  <ev-rate :model-value="7" :max="10" show-score score-template="{value} 分（满分 10）" />
</DemoBlock>

## 分档颜色

`colors` 接受三档色数组 [低, 中, 高]（按 low-threshold / high-threshold 分档），或 `{ 阈值: 色 }` 对象（取分值命中的最小阈值档）；`void-color` 为未选中星颜色。

<DemoBlock>
  <ev-rate :model-value="2" :colors="['#99A9BF', '#F7BA2A', '#FF9900']" />
  <ev-rate :model-value="4" :colors="{ 2: '#99A9BF', 4: '#F7BA2A', 5: '#FF9900' }" />
  <ev-rate :model-value="3" void-color="#E5E9F0" />
</DemoBlock>

## 分级文案与总分

`show-text` 显示 `texts` 中的分级文案（按当前分值向上取整取用）；`show-score` 优先级更高，按 `score-template`（`{value}` 为分值占位）显示总分。

<DemoBlock>
  <ev-rate :model-value="3" show-text />
  <ev-rate :model-value="4" show-text :texts="['极差', '失望', '一般', '满意', '惊喜']" />
  <ev-rate :model-value="4.5" allow-half show-score score-template="{value} 分" />
</DemoBlock>

## 自定义图标

`icon` / `void-icon` 传 registry 图标名，选中与未选中可用不同图标；图标颜色随分档取色。

<DemoBlock>
  <ev-rate :model-value="3" icon="star-filled" void-icon="star" />
</DemoBlock>

## 只读与禁用

`readonly` 用于展示场景（无交互但保持正常配色），`disabled` 禁用并按 `disabled-color` 置灰选中星。

<DemoBlock>
  <ev-rate :model-value="4" readonly />
  <ev-rate :model-value="3" disabled />
</DemoBlock>

## API

<ApiTable title="Rate Props" :rows="[
  { name: 'v-model', desc: '评分值（allow-half 时可为 0.5 的倍数）', type: 'number', default: '0' },
  { name: 'max', desc: '最大分值（星星数量）', type: 'number', default: '5' },
  { name: 'allow-half', desc: '支持半星（悬停左半取 0.5，键盘步进 0.5）', type: 'boolean', default: 'false' },
  { name: 'low-threshold', desc: '低档阈值（低于等于该值取 colors 第 1 档色）', type: 'number', default: '2' },
  { name: 'high-threshold', desc: '高档阈值（低于等于该值取第 2 档色，否则第 3 档）', type: 'number', default: '4' },
  { name: 'colors', desc: '选中星颜色：数组 [低, 中, 高] 或 { 阈值: 色 } 对象', type: 'array | object', default: '三档黄色' },
  { name: 'void-color', desc: '未选中星颜色', type: 'string', default: '#C6D1DE' },
  { name: 'disabled-color', desc: '禁用态选中星颜色', type: 'string', default: '#C9CDD4' },
  { name: 'icon', desc: '选中星图标名', type: 'string', default: 'star-filled' },
  { name: 'void-icon', desc: '未选中星图标名', type: 'string', default: 'star-filled' },
  { name: 'size', desc: '尺寸，影响图标大小（large / default / small）', type: 'string', default: 'default' },
  { name: 'clearable', desc: '再次点击当前分值时清零', type: 'boolean', default: 'false' },
  { name: 'show-text', desc: '显示分级文案', type: 'boolean', default: 'false' },
  { name: 'texts', desc: '分级文案（按分值向上取整取用，可自定义中文）', type: 'array', default: '内置英文五档' },
  { name: 'show-score', desc: '显示总分（优先于 show-text）', type: 'boolean', default: 'false' },
  { name: 'score-template', desc: '总分模板，{value} 为分值占位', type: 'string', default: '{value}' },
  { name: 'text-color', desc: '辅助文字颜色', type: 'string', default: '#1F2D3D' },
  { name: 'readonly', desc: '只读（无交互但保持正常配色）', type: 'boolean', default: 'false' },
  { name: 'disabled', desc: '禁用（无交互并按 disabled-color 置灰）', type: 'boolean', default: 'false' },
  { name: 'label', desc: '无障碍标签（aria-label）', type: 'string', default: 'rating' },
]" />

<ApiTable title="Rate Events" :rows="[
  { name: 'update:modelValue', desc: '评分变化，返回新分值（clearable 清零时为 0）', type: '(value: number) => void', default: '—' },
  { name: 'change', desc: '与 update:modelValue 同步触发，同时触发表单项 change 校验', type: '(value: number) => void', default: '—' },
]" />
