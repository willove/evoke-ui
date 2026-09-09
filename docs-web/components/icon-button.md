# IconButton 图标按钮

`EwIconButton` 是只有图标的紧凑按钮，专为官网导航栏与卡片动作区设计：主题切换、社交链接、
搜索入口、下载动作等。默认幽灵形态，hover 才浮现底色，保持页面的安静气质。

无障碍标签 `aria-label` 缺省取图标名，对外暴露的动作建议显式传入。

## 基础用法

<DemoBlock title="五种变体" description="ghost / soft 用于导航栏动作位，primary / dark 用于强提示动作。">

<div style="display:flex; align-items:center; gap:12px;">
  <EwIconButton icon="github" aria-label="GitHub" />
  <EwIconButton icon="download" variant="soft" />
  <EwIconButton icon="search" variant="outline" />
  <EwIconButton icon="x" variant="dark" round />
  <EwIconButton icon="menu" variant="primary" />
</div>

```vue
<EwIconButton icon="github" aria-label="GitHub" />
<EwIconButton icon="download" variant="soft" />
<EwIconButton icon="x" variant="dark" round />
```

</DemoBlock>

## 尺寸与正圆

<DemoBlock title="尺寸 / round 正圆形态">

<div style="display:flex; align-items:center; gap:12px; align-items:center;">
  <EwIconButton icon="menu" size="small" />
  <EwIconButton icon="menu" />
  <EwIconButton icon="menu" size="large" />
  <EwIconButton icon="sun" round variant="soft" />
</div>

```vue
<EwIconButton icon="menu" size="small" />
<EwIconButton icon="menu" size="large" />
<EwIconButton icon="sun" round variant="soft" />
```

</DemoBlock>

::: tip 导航栏组合
典型组合见 [EwNavbar](./navbar)：`EwThemeToggle` + 若干社交 `EwIconButton` + 一个 `soft` 下载按钮。
:::

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| icon | 图标名（kebab-case） | string | 必填 |
| variant | 视觉变体 | `'ghost' \| 'soft' \| 'outline' \| 'primary' \| 'dark'` | `'ghost'` |
| size | 尺寸 | `'small' \| 'default' \| 'large'` | `'default'` |
| round | 正圆形态 | boolean | `false` |
| disabled | 禁用态 | boolean | `false` |
| aria-label | 无障碍标签（缺省取 icon 名） | string | icon |
| native-type | 原生类型 | string | `'button'` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| default | 追加内容（一般不用） |

### 事件

| 事件 | 说明 | 参数 |
| --- | --- | --- |
| click | 点击（disabled 时不派发） | MouseEvent |
