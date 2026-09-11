# NavBar 页头

<script setup>
import { ref } from 'vue'

const hint = ref('点按左右热区试试')
function left() {
  hint.value = 'click-left：返回上一页（router.back）'
}
function right() {
  hint.value = 'click-right：打开客服'
}
</script>

`EvNavBar` 是移动端 H5 的**页面头部**：左区返回箭头/文案、居中标题（超长省略）、
右区动作，与拇指触控热区（≥44px）对齐。它替代的是 App 式页头，区别于桌面站点的
[EvNavbar](/components/navbar)；`fixed` 吸顶时自动吸收 `env(safe-area-inset-top)`
（刘海屏独立 PWA 生效，普通浏览器为 0），配 `placeholder` 生成等高占位。
与 evoke-business-ui 的 `EvNavBar` 同名同 API。

## 基础用法

<DemoBlock title="返回 + 标题 + 右侧动作" description="左右热区整条可点，点选后回调 click-left / click-right。">

<MobileStage>
  <ev-nav-bar title="商品详情" left-arrow left-text="返回" right-text="客服" @click-left="left" @click-right="right" />
  <div class="mb-page">
    <div class="mb-card mb-card--pad">
      <div class="mb-card__title">页面内容</div>
      <div class="mb-card__label" style="margin-top: 4px;">{{ hint }}</div>
    </div>
  </div>
</MobileStage>

```html
<EvNavBar
  title="商品详情"
  left-arrow
  left-text="返回"
  right-text="客服"
  @click-left="router.back()"
  @click-right="openService"
/>
```

</DemoBlock>

## 自定义两侧内容

左右都是完整插槽：左区放图标按钮，右区放胶囊主按钮（下一步/提交类动作），
标题也能整体替换（如输入框搜索头）。

<DemoBlock title="插槽自定义" description="左区关闭按钮、右区主按钮胶囊；title 插槽换成品牌字标。">

<MobileStage>
  <ev-nav-bar title="EVOKE">
    <template #left>
      <ev-icon-button icon="close" variant="ghost" size="small" aria-label="关闭" />
    </template>
    <template #right>
      <ev-button type="primary" size="small" pill>下一步</ev-button>
    </template>
  </ev-nav-bar>
  <div class="mb-page">
    <div class="mb-card mb-card--pad">
      <div class="mb-card__title">向导第二步</div>
      <div class="mb-card__label" style="margin-top: 4px;">页头右侧的「下一步」对准拇指收势位置</div>
    </div>
  </div>
</MobileStage>

```html
<EvNavBar title="EVOKE">
  <template #left>
    <EvIconButton icon="close" variant="ghost" size="small" />
  </template>
  <template #right>
    <EvButton type="primary" size="small" pill>下一步</EvButton>
  </template>
</EvNavBar>
```

</DemoBlock>

## 吸顶与安全区

真机上页面头部通常吸顶滚动：`fixed` 定位到视口顶部，并自动叠加
`env(safe-area-inset-top)`（`viewport-fit=cover` 时刘海屏自动让出状态栏，
浏览器环境为 0，无需判断平台）。`fixed` 必须配 `placeholder`，由组件生成
等高占位，内容不会被头部遮挡：

```html
<EvNavBar title="订单详情" left-arrow left-text="返回" fixed placeholder @click-left="router.back()" />
```

## API

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| title | string | '' | 标题文本，title 插槽可替换 |
| left-text | string | '' | 左区文案（常配「返回」），left 插槽可替换 |
| right-text | string | '' | 右区文案，right 插槽可替换 |
| left-arrow | boolean | false | 左区显示返回箭头 |
| fixed | boolean | false | 固定在视口顶部，自动吸收 safe-area-inset-top |
| placeholder | boolean | false | fixed 时渲染等高占位 |
| bordered | boolean | true | 底部描边 |
| z-index | number | 900 | fixed 时的层级（压在弹层之下） |

### 事件

| 名称 | 参数 | 说明 |
| --- | --- | --- |
| click-left | — | 点击左区热区 |
| click-right | — | 点击右区热区 |

### 插槽

| 名称 | 参数 | 说明 |
| --- | --- | --- |
| left | — | 替换左区内容（默认：箭头 + 文案） |
| title | — | 替换标题（如换成搜索框 / 字标） |
| right | — | 替换右区内容（默认：文案） |
