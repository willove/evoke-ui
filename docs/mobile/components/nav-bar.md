# NavBar 页头

移动端 H5 的**页面头部**：左区返回箭头/文案、居中标题（超长省略）、右区动作，
触控热区不小于 44px。中后台内容页头（标题 + 副标题 + 操作区）见 PageHeader，
二者一个面向 H5 导航、一个面向桌面文档流，不要混用。`fixed` 吸顶时自动吸收
`env(safe-area-inset-top)`（刘海屏独立 PWA 生效，普通浏览器为 0），配
`placeholder` 生成等高占位。与 evoke-ui 的 `EwNavBar` 同名同 API。

## 基础用法

<DemoBlock>
<MobileStage>
  <ev-nav-bar title="审批详情" left-arrow left-text="返回" right-text="协办" @click-left="hint = 'click-left：返回上一页'" @click-right="hint = 'click-right：打开协办人'" />
  <div class="mb-page">
    <div class="mb-card mb-card--pad">
      <div class="mb-card__title">页面内容</div>
      <div class="mb-card__label" style="margin-top: 4px;">{{ hint }}</div>
    </div>
  </div>
</MobileStage>
</DemoBlock>

```html
<ev-nav-bar
  title="审批详情"
  left-arrow
  left-text="返回"
  right-text="协办"
  @click-left="router.back()"
  @click-right="openAssignee"
/>
```

## 自定义两侧内容

左右都是完整插槽：左区放图标按钮，右区放主按钮（提交/下一步），
标题也能整体替换（如换成进度步骤或搜索框）。

<DemoBlock>
<MobileStage>
  <ev-nav-bar title="EVOKE">
    <template #left>
      <ev-icon name="close" :size="16" style="color: var(--ev-text-color-secondary);" />
    </template>
    <template #right>
      <ev-button type="primary" size="small">提交审批</ev-button>
    </template>
  </ev-nav-bar>
  <div class="mb-page">
    <div class="mb-card mb-card--pad">
      <div class="mb-card__title">表单第三步</div>
      <div class="mb-card__label" style="margin-top: 4px;">页头右侧的「提交审批」对准拇指收势位置</div>
    </div>
  </div>
</MobileStage>
</DemoBlock>

## 吸顶与安全区

真机上页头通常吸顶滚动：`fixed` 定位到视口顶部并自动叠加
`env(safe-area-inset-top)`；`fixed` 必须配 `placeholder` 生成等高占位，
内容不会被头部遮挡：

```html
<ev-nav-bar title="订单详情" left-arrow left-text="返回" fixed placeholder @click-left="router.back()" />
```

## API

<ApiTable title="NavBar Props" :rows="[
  { name: 'title', desc: '标题文本，title 插槽可替换', type: 'string', default: `''` },
  { name: 'left-text', desc: '左区文案（常配「返回」），left 插槽可替换', type: 'string', default: `''` },
  { name: 'right-text', desc: '右区文案，right 插槽可替换', type: 'string', default: `''` },
  { name: 'left-arrow', desc: '左区显示返回箭头', type: 'boolean', default: 'false' },
  { name: 'fixed', desc: '固定在视口顶部，自动吸收 safe-area-inset-top', type: 'boolean', default: 'false' },
  { name: 'placeholder', desc: 'fixed 时渲染等高占位', type: 'boolean', default: 'false' },
  { name: 'bordered', desc: '底部描边', type: 'boolean', default: 'true' },
  { name: 'z-index', desc: 'fixed 时的层级（压在弹层之下）', type: 'number', default: '900' },
]" />

<ApiTable title="NavBar Events" :rows="[
  { name: 'click-left', desc: '点击左区热区', type: '—', default: '—' },
  { name: 'click-right', desc: '点击右区热区', type: '—', default: '—' },
]" />

<ApiTable title="NavBar Slots" :rows="[
  { name: 'left', desc: '替换左区内容（默认：箭头 + 文案）', type: '—', default: '箭头 + 文案' },
  { name: 'title', desc: '替换标题（如换成搜索框 / 步骤条）', type: '—', default: 'title 文案' },
  { name: 'right', desc: '替换右区内容（默认：文案）', type: '—', default: 'right-text 文案' },
]" />

<script setup>
import { ref } from 'vue'

const hint = ref('点按左右热区试试')
</script>
