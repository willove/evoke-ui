# Button 按钮

`EwButton` 是官网 CTA 的基本单元。五种变体对应不同的强调层级：`primary` 主色实心用于页面关键动作，
`dark` 墨色实心适合次要转化位，`soft` 柔和灰底用于工具条与次级操作，`outline` 与 `ghost` 承载更轻的动作。

按钮默认安静，hover 时才给出颜色与光影反馈；`pill` 开启全圆胶囊形态，适合首屏与定价卡的转化按钮。

## 基础用法

<DemoBlock title="五种变体">

<div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
  <EwButton>免费开始</EwButton>
  <EwButton variant="dark" pill>立即下载</EwButton>
  <EwButton variant="soft">查看文档</EwButton>
  <EwButton variant="outline">了解更多</EwButton>
  <EwButton variant="ghost">跳过</EwButton>
</div>

```vue
<EwButton>免费开始</EwButton>
<EwButton variant="dark" pill>立即下载</EwButton>
<EwButton variant="soft">查看文档</EwButton>
<EwButton variant="outline">了解更多</EwButton>
<EwButton variant="ghost">跳过</EwButton>
```

</DemoBlock>

## 尺寸

<DemoBlock title="small / default / large">

<div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
  <EwButton size="small">小型操作</EwButton>
  <EwButton>常规操作</EwButton>
  <EwButton size="large" pill>免费开始</EwButton>
</div>

```vue
<EwButton size="small">小型操作</EwButton>
<EwButton size="large" pill>免费开始</EwButton>
```

</DemoBlock>

## 图标与状态

图标位支持左侧 `icon` 与右侧 `icon-right`（常用于「继续 →」式的引导动作）。`loading` 状态下自动禁点并展示旋转图标；
只有图标没有内容时自动进入仅图标形态。

<DemoBlock title="图标位 / 加载 / 禁用 / 块级">

<div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
  <EwButton icon="download" pill>下载客户端</EwButton>
  <EwButton variant="soft" icon-right="arrow-right">继续</EwButton>
  <EwButton loading>同步中</EwButton>
  <EwButton disabled>暂不可用</EwButton>
</div>

<div style="margin-top:12px;">
  <EwButton block variant="dark" pill icon="github">使用 GitHub 登录</EwButton>
</div>

```vue
<EwButton icon="download" pill>下载客户端</EwButton>
<EwButton variant="soft" icon-right="arrow-right">继续</EwButton>
<EwButton block variant="dark" pill icon="github">使用 GitHub 登录</EwButton>
```

</DemoBlock>

::: tip 与 EwIconButton 的分工
需要承载内容的动作用 `EwButton`；纯图标动作（导航栏的主题切换、社交链接等）用
[EwIconButton](./icon-button)，它有更紧凑的方形比例与无障碍标签约定。
:::

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| variant | 视觉变体 | `'primary' \| 'dark' \| 'soft' \| 'outline' \| 'ghost'` | `'primary'` |
| size | 尺寸 | `'small' \| 'default' \| 'large'` | `'default'` |
| pill | 全圆胶囊形态 | boolean | `false` |
| block | 块级铺满 | boolean | `false` |
| icon | 左侧图标名 | string | — |
| icon-right | 右侧图标名 | string | — |
| loading | 加载态（禁点） | boolean | `false` |
| disabled | 禁用态 | boolean | `false` |
| native-type | 原生类型 | `'button' \| 'submit' \| 'reset'` | `'button'` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| default | 按钮内容 |

### 事件

| 事件 | 说明 | 参数 |
| --- | --- | --- |
| click | 点击（loading / disabled 时不派发） | MouseEvent |
