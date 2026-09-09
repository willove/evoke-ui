# Badge 徽标

`EwBadge` 是附在其它元素角上的计数徽标：未读消息数、通知数等。提供数字上限折叠（`99+`）与
纯圆点两种形态，底色可用 `color` 覆写以适配不同场景。

## 基础用法

<DemoBlock title="附着在图标按钮上" description="徽标需要父级 position: relative，用绝对定位挂在右上角。">

<div style="display:flex; align-items:center; gap:28px;">
  <span style="position:relative; display:inline-flex;">
    <EwIconButton icon="mail" variant="soft" />
    <EwBadge value="7" style="position:absolute; top:-6px; right:-6px;" />
  </span>
  <span style="position:relative; display:inline-flex;">
    <EwIconButton icon="heart" variant="soft" />
    <EwBadge value="150" style="position:absolute; top:-6px; right:-6px;" />
  </span>
  <span style="position:relative; display:inline-flex;">
    <EwIconButton icon="search" variant="soft" />
    <EwBadge dot style="position:absolute; top:-4px; right:-4px;" />
  </span>
</div>

```vue
<span style="position:relative; display:inline-flex;">
  <EwIconButton icon="mail" variant="soft" />
  <EwBadge value="7" style="position:absolute; top:-6px; right:-6px;" />
</span>
```

</DemoBlock>

## 上限折叠

<DemoBlock title="超过 max 显示 max+" description="数字计数值超过 max（默认 99）时折叠为 max+，避免长数字撑破布局。">

<div style="display:flex; align-items:center; gap:16px;">
  <EwBadge value="42" />
  <EwBadge value="150" />
  <EwBadge value="1500" :max="999" />
</div>

```vue
<EwBadge value="42" />
<EwBadge value="150" /> <!-- 渲染为 99+ -->
<EwBadge value="1500" :max="999" /> <!-- 渲染为 999+ -->
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| value | 计数值 | string / number | — |
| max | 上限，数值超过时显示 `max+` | number | `99` |
| dot | 圆点模式（不显示数字） | boolean | `false` |
| color | 自定义底色 | string | — |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| default | 覆写徽标内容（dot 模式下无效） |
