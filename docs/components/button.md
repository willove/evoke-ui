# Button 按钮

<script setup>
import { ref } from 'vue'

const fakeLoading = ref(false)

function submitWithLoading() {
  fakeLoading.value = true
  setTimeout(() => {
    fakeLoading.value = false
  }, 2000)
}
</script>


常用的操作按钮：default / primary / success / warning / danger / info 六种语义类型，支持 plain / round / circle / text / link / ghost / loading 等形态，图标颜色自动跟随按钮文字色（primary 按钮内图标呈白色）。disabled 与 loading 状态下点击不触发 click 事件；loading 时前导图标被替换为旋转图标并锁定宽度避免抖动。

## 基础用法

`type` 决定语义色，缺省为 default。

<DemoBlock>
<ev-button>默认按钮</ev-button>
<ev-button type="primary">主要按钮</ev-button>
<ev-button type="success">成功按钮</ev-button>
<ev-button type="warning">警告按钮</ev-button>
<ev-button type="danger">危险按钮</ev-button>
<ev-button type="info">信息按钮</ev-button>
</DemoBlock>

## 朴素 / 圆角 / 圆形

`plain` 朴素底色，`round` 全圆角，`circle` 圆形（常与纯图标搭配）。

<DemoBlock>
<ev-button type="primary" plain>朴素按钮</ev-button>
<ev-button type="primary" round>圆角按钮</ev-button>
<ev-button type="primary" icon="search">搜索</ev-button>
<ev-button type="primary" icon="search" circle />
<ev-button type="danger" plain icon="delete">删除</ev-button>
</DemoBlock>

## 图标

`icon` 传 registry 图标名（或图标组件），图标颜色随按钮文字色自动变化：实心类型内为白色，plain / default 内为主题色或常规色。

<DemoBlock>
<ev-button type="primary" icon="edit">编辑</ev-button>
<ev-button type="primary" plain icon="share">分享</ev-button>
<ev-button type="success" icon="check">保存</ev-button>
<ev-button icon="search" circle />
</DemoBlock>

## 禁用与加载

`disabled` 禁用点击，`loading` 展示旋转图标并同样阻断点击；loading 时插槽内的前导图标会被自动移除，避免双图标并列。

<DemoBlock>
<ev-button type="primary" disabled>禁用</ev-button>
<ev-button type="primary" loading>加载中</ev-button>
<ev-button type="primary" loading icon="edit">加载中</ev-button>
</DemoBlock>

## 点击触发加载

loading 通常由异步请求驱动：点击后置 true，请求结束置 false，期间按钮不可重复点击。

<DemoBlock>
<ev-button type="primary" :loading="fakeLoading" @click="submitWithLoading">提交</ev-button>
</DemoBlock>

## 尺寸

`size` 控制高度与内边距，图标字号随之缩放（large 16px / default 14px / small 12px）。

<DemoBlock>
<ev-button type="primary" size="large">大型按钮</ev-button>
<ev-button type="primary">默认尺寸</ev-button>
<ev-button type="primary" size="small">小型按钮</ev-button>
</DemoBlock>

## 文字与链接按钮

`text` 无底色文字按钮（适合表格操作列），`link` 链接样式按钮；两者均可叠加 type 语义色与 icon。

<DemoBlock>
<ev-button type="primary" text>文字按钮</ev-button>
<ev-button type="primary" link>链接按钮</ev-button>
<ev-button text icon="plus">新增</ev-button>
<ev-button link type="danger">删除</ev-button>
</DemoBlock>

## 幽灵与危险实心

`ghost` 幽灵按钮透明底（适合深色背景），`danger-solid` 让 danger 按钮红色更实，用于强危险操作。

<DemoBlock>
<ev-button type="primary" ghost>幽灵按钮</ev-button>
<ev-button type="danger" ghost icon="delete">幽灵删除</ev-button>
<ev-button type="danger">危险按钮</ev-button>
<ev-button type="danger" danger-solid>危险实心</ev-button>
</DemoBlock>

## 按钮组

`ev-button-group` 包裹的按钮连为一个整体（相邻边框合并、圆角只保留首尾）。成对出现的操作（如上一页 / 下一页）建议图标朝外：默认 `icon-position="left"`，第二枚按钮传 `icon-position="right"` 让图标落到文本右侧。

<DemoBlock>
<ev-button-group style="margin-right: 16px;">
  <ev-button type="primary" icon="arrow-left">上一页</ev-button>
  <ev-button type="primary" icon="arrow-right" icon-position="right">下一页</ev-button>
</ev-button-group>
<ev-button-group>
  <ev-button icon="d-arrow-left">回退</ev-button>
  <ev-button icon="d-arrow-right" icon-position="right">前进</ev-button>
</ev-button-group>
</DemoBlock>

## API

<ApiTable title="Button Props" :rows="[
  { name: 'type', desc: '按钮类型', type: 'default | primary | success | warning | danger | info', default: 'default' },
  { name: 'size', desc: '尺寸', type: 'small | default | large', default: 'default' },
  { name: 'plain', desc: '朴素按钮', type: 'boolean', default: 'false' },
  { name: 'round / circle', desc: '圆角 / 圆形', type: 'boolean', default: 'false' },
  { name: 'text / link', desc: '文字按钮 / 链接按钮', type: 'boolean', default: 'false' },
  { name: 'ghost', desc: '幽灵按钮（透明底）', type: 'boolean', default: 'false' },
  { name: 'disabled / loading', desc: '禁用 / 加载（两者均阻断 click）', type: 'boolean', default: 'false' },
  { name: 'icon', desc: '图标名（registry）或图标组件，颜色随按钮文字色', type: 'string | Component', default: '—' },
  { name: 'iconPosition', desc: '图标位置：left 文本左侧（默认）/ right 文本右侧（如「下一页 →」）', type: 'left | right', default: 'left' },
  { name: 'nativeType', desc: '原生 type 属性', type: 'button | submit | reset', default: 'button' },
  { name: 'autofocus', desc: '自动聚焦', type: 'boolean', default: 'false' },
  { name: 'dangerSolid', desc: '危险实心（danger 时红色更实）', type: 'boolean', default: 'false' },
]" />

<ApiTable title="Button Events" :rows="[
  { name: 'click', desc: '点击触发（disabled / loading 时不触发）', type: '(e: MouseEvent) => void', default: '—' },
]" />

<ApiTable title="Button Slots" :rows="[
  { name: 'default', desc: '按钮内容；loading 时前导图标会被替换为旋转图标', type: '—', default: '—' },
]" />

<ApiTable title="Button Methods" :rows="[
  { name: 'ref', desc: '原生 button 元素引用（可透传 focus / blur 等）', type: 'HTMLElement', default: '—' },
  { name: 'focus', desc: '聚焦按钮', type: '() => void', default: '—' },
  { name: 'blur', desc: '失焦按钮', type: '() => void', default: '—' },
]" />

<ApiTable title="ButtonGroup API" :rows="[
  { name: 'default（slot）', desc: '包裹 ev-button 子按钮，相邻按钮边框合并、仅首尾保留圆角', type: '—', default: '—' },
]" />
