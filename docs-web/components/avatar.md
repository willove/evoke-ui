# Avatar 头像

`EvAvatar` 展示用户或团队头像。图片缺失或加载失败时自动回退到姓名首字（中文名取前两字、
英文名取两词首字母），也可以直接给图标。圆形为默认形态，`square` 适合应用/品牌图标。

## 基础用法

<DemoBlock title="回退规则与形态" description="无图时姓名首字自动兜底；square 形态适合应用图标。">

<div style="display:flex; align-items:center; gap:24px; flex-wrap:wrap;">
  <EvAvatar name="林一舟" />
  <EvAvatar name="Ada Lovelace" />
  <EvAvatar icon="github" shape="square" />
  <EvAvatar icon="wechat" shape="square" />
</div>

```vue
<EvAvatar name="林一舟" />
<EvAvatar name="Ada Lovelace" />
<EvAvatar icon="github" shape="square" />
```

</DemoBlock>

## 尺寸

<DemoBlock title="预设尺寸与自定义像素" description="small 28 / default 40 / large 56，也可传数字自定义。">

<div style="display:flex; align-items:center; gap:16px; align-items:center;">
  <EvAvatar name="小" size="small" />
  <EvAvatar name="中" />
  <EvAvatar name="大" size="large" />
  <EvAvatar name="72" :size="72" />
</div>

```vue
<EvAvatar name="中" />
<EvAvatar :src="user.avatar" size="large" />
<EvAvatar name="自定义" :size="72" />
```

</DemoBlock>

::: tip 头像组
多人层叠展示（团队、参与者列表）用 [EvAvatarGroup](./avatar-group)，支持溢出折叠为 +N。
:::

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| src | 图片地址（加载失败自动回退） | string | — |
| name | 姓名（无图时的回退文案） | string | — |
| icon | 图标名（无图时的另一种回退） | string | — |
| alt | 图片 alt 文案（缺省取 name） | string | name |
| size | 尺寸：预设或像素数值 | `'small' \| 'default' \| 'large'` / number | `'default'` |
| shape | 形态 | `'circle' \| 'square'` | `'circle'` |
