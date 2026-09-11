# Tour 新手引导

分步引导组件：聚光遮罩高亮目标元素（超大 box-shadow 挖洞），卡片自动避让定位，滚动/缩放自动跟随。支持 v-model 步进、键盘操作（Esc 跳过、←→ 步进）。

## 基础用法

<DemoBlock>
  <eb-space size="middle">
    <eb-button type="primary" @click="step = 0">开始引导</eb-button>
    <eb-button id="tour-demo-target">被引导的按钮</eb-button>
  </eb-space>
</DemoBlock>

<script setup>
import { ref } from 'vue'
const step = ref(-1)
</script>

## 用法说明

```vue
<eb-tour v-model="step" :steps="steps" @finish="onFinish" />

// steps: [{ target: '#id 或 Element', title, description }]
```

`v-model` 为当前步骤索引，置 `-1` 关闭；目标元素不存在时该步自动跳过定位。

## Tour API

### Props

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| steps | Array | `[]` | 步骤定义 `{ target, title, description, placement? }` |
| modelValue | Number | `-1` | 当前步骤（v-model） |
| gap | Number | `8` | 高亮框四周留白 |
| mask-color | String | `rgba(0,0,0,.5)` | 遮罩颜色 |
| close-on-mask | Boolean | `false` | 点击遮罩跳过 |
| keyboard | Boolean | `true` | 键盘步进/跳过 |
| z-index | Number | `3000` | 层级 |

### 事件

`change(index)`、`finish`、`skip`；插槽 `title`、`default` 自定义卡片内容。
