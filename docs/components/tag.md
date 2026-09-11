# Tag 标签

用于标记与分类的小标签：五种类型搭配 plain / light / dark 三种效果，支持自定义颜色、圆角、hit 边框与可关闭。整体可点击并 emit `click`，关闭图标点击会阻止冒泡并 emit `close`。

<script setup>
import { ref } from 'vue'

const tagInput = ref('')
const tagList = ref(['前端', '组件库', 'Vue 3'])

function addTag() {
  const v = tagInput.value.trim()
  if (!v) return
  if (!tagList.value.includes(v)) tagList.value.push(v)
  tagInput.value = ''
}

function removeTag(index) {
  tagList.value.splice(index, 1)
}

const picked = ref('primary')
</script>

## 基础用法

`type` 决定语义色（默认 info），`effect` 决定填充方式：plain 透明底描边（默认）、light 浅色底、dark 实色底白字。

<DemoBlock>
  <eb-space direction="vertical" size="small">
    <eb-space size="small">
      <eb-tag>默认 info</eb-tag>
      <eb-tag type="primary">主要</eb-tag>
      <eb-tag type="success">成功</eb-tag>
      <eb-tag type="warning">警告</eb-tag>
      <eb-tag type="danger">危险</eb-tag>
    </eb-space>
    <eb-space size="small">
      <eb-tag type="primary" effect="light">primary light</eb-tag>
      <eb-tag type="primary" effect="dark">primary dark</eb-tag>
      <eb-tag type="success" effect="light">success light</eb-tag>
      <eb-tag type="success" effect="dark">success dark</eb-tag>
      <eb-tag type="warning" effect="light">warning light</eb-tag>
      <eb-tag type="danger" effect="dark">danger dark</eb-tag>
    </eb-space>
  </eb-space>
</DemoBlock>

## 尺寸与形态

`size` 提供 small（默认，20px 高）/ default（24px）/ large（32px）三档；`round` 全圆角，`hit` 让边框加深为文字色，`closable` 显示关闭图标并 emit `close` 事件（组件本身不移除节点，删除逻辑由业务侧处理）。

<DemoBlock>
  <eb-space direction="vertical" size="small">
    <eb-space size="small">
      <eb-tag size="small">small</eb-tag>
      <eb-tag size="default">default</eb-tag>
      <eb-tag size="large">large</eb-tag>
    </eb-space>
    <eb-space size="small">
      <eb-tag type="primary" round>圆角标签</eb-tag>
      <eb-tag type="success" closable>可关闭</eb-tag>
      <eb-tag type="warning" hit>hit 边框</eb-tag>
    </eb-space>
  </eb-space>
</DemoBlock>

## 自定义颜色

`color` 传入任意颜色即可覆盖主题配色：plain 效果下仅描边与文字着色（背景透明），light / dark 效果下填充该色（dark 下文字为白色）。

<DemoBlock>
  <eb-space size="small">
    <eb-tag color="#6f42c1">自定义色</eb-tag>
    <eb-tag color="#6f42c1" effect="dark">自定义深色</eb-tag>
    <eb-tag color="#0ea5e9" effect="light">自定义浅色</eb-tag>
    <eb-tag color="#0ea5e9" round effect="dark">组合形态</eb-tag>
  </eb-space>
</DemoBlock>

## 动态编辑标签

典型的标签管理场景：`closable` 加 `@close` 从数组移除，输入框加按钮向数组追加，`v-for` 渲染即可，组件不维护内部状态。

<DemoBlock>
  <eb-space wrap size="small">
    <eb-tag v-for="(item, i) in tagList" :key="item" type="primary" closable @close="removeTag(i)">{{ item }}</eb-tag>
  </eb-space>
  <div style="margin-top:12px;display:flex;gap:8px;">
    <eb-input v-model="tagInput" size="small" style="width:180px;" placeholder="输入标签，回车确认" @keydown.enter="addTag" />
    <eb-button size="small" type="primary" @click="addTag">添加</eb-button>
  </div>
</DemoBlock>

## 点击选中

标签整体可点击（emit `click`），结合动态 `type` / `effect` 可实现单选筛选器之类的轻交互。

<DemoBlock>
  <eb-space size="small">
    <eb-tag
      v-for="t in ['primary', 'success', 'warning', 'danger']"
      :key="t"
      :type="t"
      :effect="picked === t ? 'dark' : 'plain'"
      style="cursor:pointer;"
      @click="picked = t"
    >{{ t }}</eb-tag>
  </eb-space>
  <p style="margin-top:8px;font-size:13px;color:#909399;">当前选中：{{ picked }}</p>
</DemoBlock>

## API

<ApiTable title="Tag Props" :rows="[
  { name: 'type', desc: '类型', type: 'primary | success | info | warning | danger', default: 'info' },
  { name: 'size', desc: '尺寸（传空字符串等价于 default）', type: 'small | default | large', default: 'small' },
  { name: 'effect', desc: '显示效果', type: 'dark | light | plain', default: 'plain' },
  { name: 'round', desc: '圆角标签', type: 'boolean', default: 'false' },
  { name: 'hit', desc: '边框使用文字色', type: 'boolean', default: 'false' },
  { name: 'closable', desc: '显示关闭图标（点击 emit close，不自动移除节点）', type: 'boolean', default: 'false' },
  { name: 'disable-transitions', desc: '禁用颜色过渡动画', type: 'boolean', default: 'true' },
  { name: 'color', desc: '自定义颜色（plain 下仅描边与文字着色，dark 下文字为白色）', type: 'string', default: '—' },
]" />

<ApiTable title="Tag Events" :rows="[
  { name: 'click', desc: '点击标签本体时触发', type: '(e: MouseEvent) => void', default: '—' },
  { name: 'close', desc: '点击关闭图标时触发（已阻止冒泡，不会触发 click）', type: '(e: MouseEvent) => void', default: '—' },
]" />

<ApiTable title="Tag Slots" :rows="[
  { name: 'default', desc: '标签内容', type: '—', default: '—' },
]" />
